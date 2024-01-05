# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict
from typing import List

import numpy as np
import pandas as pd
import pendulum
from beartype import beartype
from monitoring.metrics import DataDogMetrics
from on_scene.const import MODEL_NAMESPACE
from on_scene.user_lookup import UserLookup

from proto.ml_models.on_scene.service_pb2 import GetOnSceneTimeRequest
from proto.ml_models.on_scene.service_pb2 import ShiftTeam


# return this if no provider score is found for a particular shift team
DEFAULT_PROV_SCORE = 0.0
# need the position names to be in all-lower case
APP_POSITION = "advanced practice provider"
DHMT_POSITION = "dhmt"


@beartype
class Featurizer:
    """
    Class to construct on-scene model features from request data.

    More specifically, since we can be predicting on-scene time for multiple
    shift teams, and the model takes in features for one shift team at a time,
    we will construct features for each shift team.

    Adopted from https://github.com/*company-data-covered*/on-scene-model-api/blob/dev/app/scoring/lookups.py

    Currently the model takes the following features:
    - risk_protocol_standardized
    - patient_age
    - risk_score
    - max_num_care_requests
    - service_line_name
    - place_of_service_original
    - shift_team_score
    """

    def __init__(self, user_lookup: UserLookup, logger: logging.Logger, statsd: DataDogMetrics):
        """Initialize Featurizer object.

        Arguments
        ---------
        user_lookup
            UserLookup object to look up provider score from feature store
        logger
            Logger object
        """
        self.user_lookup = user_lookup
        self.logger = logger
        self.statsd = statsd

    def get_features(self, request: GetOnSceneTimeRequest) -> Dict[int, pd.DataFrame]:
        """Main method to get all on-scene model features from request data.

        We opt for storing the feature of each shift team in a dict so it's
        easier to keep track of predictions of each shift team ID in the server
        body.

        An alternative approach would be to get one dataframe with multiple
        rows, one shift team per row, and have an extra column to store the shift
        team ID. But when we pass features to the model, we'll have to take out
        the shift team ID column, which is a bit more complicated than passing
        one row at a time to the model.

        Arguments
        ---------
        request
            Incoming gRPC request

        Returns
        -------
        features_dict
            Dict mapping shift team ID to a one-row pandas dataframe containing
            features for that shift team (including avg provider score of the team).
        """
        dob = request.patient_dob
        dob_str = f"{dob.year}-{dob.month:02d}-{dob.day:02d}"

        # these features are the same for each shift team
        static_input = dict(
            risk_protocol=request.protocol_name,
            service_line_name=request.service_line,
            place_of_service_original=request.place_of_service,
            max_num_care_requests=request.num_crs,
            patient_age=self._get_age(dob_str),
            risk_score=request.risk_assessment_score,
        )

        # get shift team-specific features; must convert request.shift_teams
        # to a python list first
        st_scores = self.get_shift_team_scores(list(request.shift_teams))

        # copy static_input for each row
        features_dict = {}
        for team_id, team_score in st_scores.items():
            df_features = pd.DataFrame(data=static_input, index=[0])
            df_features["shift_team_score"] = team_score
            features_dict[team_id] = df_features

        self.logger.info(f"Prepared features for care_request_id = {request.care_request_id}.")

        return features_dict

    def get_shift_team_scores(self, shift_teams: List[ShiftTeam]) -> Dict[int, float]:
        """
        Get dictionary of {shift_team_id: agg_zscore}

        Arguments
        ---------
        shift_teams
            List of shift teams to look up avg provider scores for

        Returns
        -------
        prov_scores_dict
            Dict mapping shift team ID to its avg provider score
        """
        prov_scores: Dict[int, float] = {}
        self.logger.info(
            f"Getting scores for {len(shift_teams)} shift teams",
            extra={"shift_teams": {st.id: st.member_ids for st in shift_teams}},
        )

        # gather all included users
        user_ids: List[int] = []
        for team in shift_teams:
            user_ids.extend(team.member_ids)

        users = self.user_lookup.get_users(user_ids)

        # calculate avg score for each shift team
        for shift_team in shift_teams:
            num_team_members = {"app": 0, "dhmt": 0}
            scores = []

            for user_id in shift_team.member_ids:
                user = users.get(user_id, None)
                if user is None:
                    self.logger.warning(f"Cannot find score for user_id {user_id}")
                    continue

                # convert position to lower case in case there is weirdness in data
                position = user.position.lower()
                if position == APP_POSITION:
                    num_team_members["app"] += 1
                elif position == DHMT_POSITION:
                    num_team_members["dhmt"] += 1
                else:
                    self.logger.info(f"Found shift team member position '{position}'; ignored.")
                    continue

                scores.append(user.prov_score)

            self.logger.info(f"Saw {num_team_members['app']} APPs and {num_team_members['dhmt']} DHMTs on the team.")

            if len(scores) == 0:
                self.logger.warning(f"No eligible provider score found! Returning default = {DEFAULT_PROV_SCORE}.")
                self.statsd.increment(f"{MODEL_NAMESPACE}.missing_shift_teams")
                prov_scores[shift_team.id] = DEFAULT_PROV_SCORE
                continue

            avg_zscore = np.mean(scores)
            self.logger.info(f"avg_zscore = {avg_zscore}", extra={"shift_team_id": shift_team.id})

            if abs(avg_zscore) > 4:
                self.logger.warning(
                    f"Avg zscore of the team ({avg_zscore:.3f}) is outside of normal range!!",
                    extra={
                        "shift_team_id": shift_team.id,
                        "avg_zscore": round(avg_zscore, 3),
                        "member_ids": shift_team.member_ids,
                        "date": datetime.today().date(),
                    },
                )
            prov_scores[shift_team.id] = avg_zscore

        return prov_scores

    def _get_age(self, dob: str) -> int:
        """Get patient age from DOB.

        Parameters
        ----------
        r_dob
            Date of birth in YYYY-MM-DD.

        Returns
        -------
        patient_age
            age in years.
        """
        patient_age = (pendulum.today() - pendulum.parse(dob, strict=False)).years
        return patient_age
