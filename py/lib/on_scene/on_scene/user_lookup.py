# -*- coding: utf-8 -*-
from __future__ import annotations

from logging import Logger

from beartype import beartype
from beartype.typing import Dict
from beartype.typing import List
from beartype.typing import Optional
from feature_store.query import QueryFeatureStore
from pydantic import BaseModel


class User(BaseModel):
    user_id: int
    position: str
    prov_score: float


@beartype
class UserLookup:
    """A class to query the z-score of either APP or DHMT from feature store.

    The z-score will be averaged across all APPs and DHMTs in a shift team (normally
    there should be no more than 1 of each, but sometimes weird data exist.) The
    average z-score of the shift team is an important feature to the model.
    """

    def __init__(self, querier: QueryFeatureStore, logger: Logger):
        """Initialize UserLookup.

        Arguments
        ---------
        querier
            A QueryFeatureStore object to query from AWS feature store.
        logger
            A Logger object
        """
        self.querier = querier
        self.logger = logger

    def get_user(self, user_id: int) -> Optional[User]:
        """
        Get zscore for a specific user (shift team member).

        Parameters
        ----------
        user_id : int
            Dashboard user_id for the provider or DHMT

        Returns
        -------
        user
            User object containing user information
        """
        # user_id is not found if "Record" is not in dictionary
        record = self.querier.get_record(str(user_id)).get("Record", None)
        user = self._convert_record_to_user(record)

        return user

    def get_users(self, user_ids: List[int]) -> Optional[Dict[int, User]]:
        """Get zscore for a list of users.

        This will do a batch call to feature store instead of one call for each
        user.

        Note that self.querier.get_features_records() only returns a list of
        records that have a matching user_id in feature store. User IDs without
        a matching record will not return an empty list, so we cannot assume
        the list have the same length as user_ids.

        Arguments
        ---------
        user_ids
            List of user IDs

        Returns
        -------
        users
            Dict mapping user ID to User object
        """
        self.logger.info(f"Getting User objects for user_ids = {user_ids}")

        if not len(user_ids):
            self.logger.warn("user_ids is empty; return an empty dict.")
            return {}

        records = self.querier.get_features_records([str(x) for x in user_ids]).get("Records", [])
        users: Dict[int, Optional[User]] = {}

        # parse records; only IDs with matching record in feature store exist
        for record_dict in records:
            record = record_dict["Record"]
            user = self._convert_record_to_user(record)
            users[user.user_id] = user

        # now find which user_ids do not have a record and set them to None
        for user_id in user_ids:
            if user_id not in users:
                users[user_id] = None

        return users

    def _convert_record_to_user(self, record: Optional[List[Dict[str, str]]]) -> Optional[User]:
        """Re-format the record returned from feature store.

        The result should map feature name to feature value.

        Arguments
        ---------
        record
            Results returned from feature store; if None, then this method returns
            None.

        Returns
        -------
        If input record is not None, returns a User object containing user ID,
        position, and score; otherwise, return None.
        """
        if record is None:
            return

        output = {}
        for feature in record:
            name, value = feature["FeatureName"], feature["ValueAsString"]
            output[name] = value

        return User(
            user_id=int(output["user_id"]),
            position=output["position"],
            prov_score=float(output["prov_score"]),
        )
