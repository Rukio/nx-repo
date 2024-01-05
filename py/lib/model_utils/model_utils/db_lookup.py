# -*- coding: utf-8 -*-
from __future__ import annotations

import hashlib

from beartype import beartype
from beartype.typing import Any
from beartype.typing import Dict
from beartype.typing import Optional
from statsig import statsig
from statsig import StatsigUser


class InvalidQuerierError(Exception):
    pass


class DuplicateKeyError(Exception):
    pass


class NullConnection:
    """A simple class to stand in for non-existent DB connection.

    This allows us to use a simple DB connection context to handle both real
    and non-existent DB connections.
    """

    def __enter__(self, *args, **kwargs):
        return None

    def __exit__(self, *args, **kwargs):
        return None


class NullEngine:
    """A simple class to stand in for non-existent DB engine.

    Useful for running unit tests locally or in an env where DB is not set up.
    """

    def connect(self):
        return NullConnection()


@beartype
class BaseDBLookup:
    def __init__(self, querier: Any) -> None:
        """Initialize a DBLookup instance.

        Arguments
        ---------
        querier
            Should be a Querier object from generated DB code and type enforced
            in a child class. Unfortunately generated Querier classes from sqlc
            do not inherit from a base class, so we need to manually check that
            certain attributes exist.

        """
        self.querier = querier
        self._validate_querier()

    def _validate_querier(self) -> None:
        """Simple validation of self.querier."""
        # make sure self.querier has the following methods
        required_attributes = ["lookup_prediction", "add_new_prediction", "update_last_queried", "_conn"]
        for method in required_attributes:
            if not hasattr(self.querier, method):
                raise InvalidQuerierError(f"self.querier is missing attribute '{method}'.")

    @staticmethod
    def hash_features(row_input: Dict[str, Any], **kwargs) -> memoryview:
        """Hash input features using SHA256 and return an array of bytes.

        We include care_request_id in the hash because we don't want identical
        features from different care_request_id's to collide. We also include
        model version so we separate the predictions from different versions.
        Parameters
        ----------
        row
            Input feature dict
        kwargs
            Any extra field that need to be added to features before hashing. Note
            that values passed in kwargs will overwrite existing values in row if
            the same key exists.

        Returns
        -------
        An array of bytes as the hashed features
        """
        # make a copy of row_input so we don't modify input row in place
        row = row_input.copy()
        # add extra features
        for k, v in kwargs.items():
            # we don't know how to deal with duplicates, so if there is any we will raise
            if k in row:
                raise DuplicateKeyError(f"Feature '{k}' already exists in row but is passed in kwargs again.")
            row[k] = v

        # ensure deterministic key order
        data = tuple(((k, row[k]) for k in sorted(row.keys())))
        # hash
        data_hashed = hashlib.sha256(bytes(str(data), encoding="utf-8")).digest()

        return memoryview(data_hashed)

    def _lookup_cached_prediction(self, feature_hash: memoryview, request_id: str, gate: Optional[str], **kwargs):
        """Look up cached prediction in DB with the same feature stored in df.

        Parameters
        ----------
        querier
            A Querier object from generated DB code.
        feature_hash
            Hashed features.
        request_id
            some request ID (NOT care request ID) for statsig lookup purpose
        gate
            Name of statsig feature gate that determines whether we should return
            predictions from DB
        kwargs
            Additional keyword args that self.querier.lookup_prediction needs
            other than feature_hash

        Returns
        -------
        TelepMlPredCache if feature is in cache. Return None if either prediction
        is not in cache, DB connection is None, or feature gate for cache read
        evaluates to False.

        """
        statsig_user = StatsigUser(user_id=request_id)
        read_cache_flag = statsig.check_gate(user=statsig_user, gate=gate)
        if gate is None:
            read_cache_flag = True
        if self.querier._conn is None or not read_cache_flag:
            return None

        result = self.querier.lookup_prediction(feature_hash=feature_hash, **kwargs)

        return result

    def _insert_prediction(
        self, feature_hash: memoryview, prediction: Any, request_id: str, gate: Optional[str], **kwargs
    ) -> None:
        """Write a new Tele-p clinical eligibility decision to cache DB.

        Parameters
        ----------
        feature_hash
            Feature hash in bytes
        prediction
            Final model decision
        request_id
            Some (random) request ID for statsig purpose (so statsig doesn't return
            cached feature gate values)
        gate
            Statsig feature gate controlling whether to insert new prediction
        kwargs
            Additional keyword args that self.querier.add_new_prediction needs
            other than feature_hash

        Returns
        -------
        None

        """
        statsig_user = StatsigUser(user_id=request_id)
        write_cache_flag = statsig.check_gate(user=statsig_user, gate=gate)
        if gate is None:
            write_cache_flag = True
        if self.querier._conn is None or not write_cache_flag:
            return

        self.querier.add_new_prediction(feature_hash=feature_hash, prediction=prediction, **kwargs)
        self.querier._conn.commit()

    def _update_last_queried(self, id: int, request_id: str, gate: Optional[str], **kwargs) -> None:
        """Update last_queried_at of an existing prediction.

        It will only update an existing prediction if read flag is turned on.

        Parameters
        ----------
        id
            Auto-incremented ID of the cache.
        request_id
            Some (random) request ID for statsig purpose (so statsig doesn't return
            cached feature gate values)
        gate
            Statsig feature gate controlling whether to update existing prediction
        kwargs
            Additional keyword args that self.querier.update_last_queried needs
            other than feature_hash

        Returns
        -------
        None
        """
        statsig_user = StatsigUser(user_id=request_id)
        read_cache_flag = statsig.check_gate(user=statsig_user, gate=gate)
        if gate is None:
            read_cache_flag = True
        if self.querier._conn is None or not read_cache_flag:
            return None

        self.querier.update_last_queried(id=id, **kwargs)
        self.querier._conn.commit()
        return None
