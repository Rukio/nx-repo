# -*- coding: utf-8 -*-
from __future__ import annotations

from datetime import datetime
from unittest.mock import call
from unittest.mock import patch

import numpy as np
import pendulum
import pytest


class TestFeaturizer:
    def test__get_age(self, featurizer):
        today = pendulum.today()
        dob1 = today - pendulum.duration(years=10)
        assert featurizer._get_age(dob1.strftime("%Y-%m-%d")) == 10
        # test a few days shorter than 10 years
        dob2 = dob1 + pendulum.duration(days=10)
        assert featurizer._get_age(dob2.strftime("%Y-%m-%d")) == 9

    def test_get_shift_team_scores_detail(self, featurizer, shift_teams, app_score, dhmt_score, slow_app_score):
        app_score_float = float(app_score)
        dhmt_score_float = float(dhmt_score)
        slow_app_score_float = float(slow_app_score)

        scores = featurizer.get_shift_team_scores(list(shift_teams.values()))

        # get a team with valid score for both APP and DHMT
        assert pytest.approx(scores[shift_teams[1].id]) == np.mean([app_score_float, dhmt_score_float])
        # get a team with no valid scores
        assert pytest.approx(scores[shift_teams[2].id]) == 0.0
        # get a team with only valid APP score
        assert pytest.approx(scores[shift_teams[3].id]) == app_score_float
        # get a team with only valid DHMT score
        assert pytest.approx(scores[shift_teams[4].id]) == dhmt_score_float

        # team 5 has one DHMT and one "Doctor", so the doctor should be ignored
        assert pytest.approx(scores[shift_teams[5].id]) == dhmt_score_float
        # test that when a position other than APP or DHMT is found, we log this
        # event using featurizer.logger.info
        logger_call5 = call("Found shift team member position 'doctor'; ignored.")
        featurizer.logger.info.assert_has_calls([logger_call5], any_order=True)

        # team 6 has a DHMT and a VERY SLOW APP with score > 10; this will lead
        # to avg score > 4 and trigger warning logs
        expected_avg_score6 = (dhmt_score_float + slow_app_score_float) / 2.0
        assert pytest.approx(scores[shift_teams[6].id]) == expected_avg_score6
        logger_call6 = call(
            f"Avg zscore of the team ({expected_avg_score6:.3f}) is outside of normal range!!",
            extra={
                "shift_team_id": 6,
                "avg_zscore": round(expected_avg_score6, 3),
                "member_ids": shift_teams[6].member_ids,
                "date": datetime.today().date(),
            },
        )
        featurizer.logger.warning.assert_has_calls([logger_call6], any_order=True)

    def test_get_shift_team_scores(self, featurizer, shift_teams, app_score, dhmt_score, users_dict):
        app_score_float = float(app_score)
        dhmt_score_float = float(dhmt_score)

        with patch.object(featurizer.user_lookup, "get_users", return_value=users_dict):
            scores = featurizer.get_shift_team_scores(list(shift_teams.values()))
            assert sorted(scores.keys()) == sorted([st.id for st in shift_teams.values()])
            assert pytest.approx(scores[1]) == np.mean([app_score_float, dhmt_score_float])
            assert pytest.approx(scores[2]) == 0.0
            assert pytest.approx(scores[3]) == app_score_float
            assert pytest.approx(scores[4]) == dhmt_score_float

    def test_get_features(self, featurizer, test_request, users_dict):
        with patch.object(featurizer.user_lookup, "get_users", return_value=users_dict):
            features_dict = featurizer.get_features(test_request)
            assert len(features_dict) == len(test_request.shift_teams)
            for team in test_request.shift_teams:
                assert features_dict[team.id].shape == (1, 7)
