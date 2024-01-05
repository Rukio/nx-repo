# -*- coding: utf-8 -*-
from __future__ import annotations

from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from model_utils.db_lookup import BaseDBLookup
from model_utils.db_lookup import DuplicateKeyError
from model_utils.db_lookup import InvalidQuerierError
from sqlalchemy.engine import Connection
from statsig import statsig
from statsig import StatsigUser

statsig.initialize("secret-key")


class MockDBLookup(BaseDBLookup):
    def lookup_cached_prediction(self, **kwargs):
        return super()._lookup_cached_prediction(**kwargs)

    def insert_prediction(self, **kwargs):
        return super()._insert_prediction(**kwargs)

    def update_last_queried(self, **kwargs):
        return super()._update_last_queried(**kwargs)


class MockQuerier:
    def __init__(self):
        self._conn = MagicMock(spec=Connection)

    def lookup_prediction(self, *, feature_hash):
        return "something"

    def add_new_prediction(self, *, feature_hash, prediction):
        return

    def update_last_queried(self, *, id):
        return


@pytest.fixture
def db_lookup():
    return MockDBLookup(querier=MockQuerier())


@pytest.fixture
def row1():
    return {"age": [30], "gender": ["M"], "place_of_service": ["HOME"]}


@pytest.fixture
def row2():
    return {"age": [30], "place_of_service": ["HOME"], "gender": ["M"]}


@pytest.fixture
def request_id():
    return "abcde"


class TestBaseDBLookup:
    def create_connection_no_context(self):
        """Create a connection that cannot be used as a context."""
        conn = MagicMock(spec=Connection)
        conn.execute = MagicMock(wraps=self.create_execute_results)
        return conn

    def create_connection_context(self):
        """Returns a connection that can also be used as a context"""
        connection = MagicMock(spec=Connection)
        # mock connection context
        connection.__enter__ = MagicMock(wraps=self.create_connection_no_context)
        # mock execute
        connection.execute = MagicMock(wraps=self.create_execute_results)
        return connection

    def test_bad_querier(self):
        # test that it raises if we instantiate MockDBLookup with a bad querier
        bad_querier = MagicMock()
        # make sure it does not have attribute _conn
        del bad_querier._conn

        with pytest.raises(InvalidQuerierError):
            MockDBLookup(bad_querier)

    def test_hash_features(self, row1, row2, db_lookup):
        cr_id1 = 12345
        cr_id2 = 123456
        assert db_lookup.hash_features(row_input=row1, care_request_id=cr_id1) == db_lookup.hash_features(
            row_input=row2, care_request_id=cr_id1
        )

        # test that same feature but different CR ID will give different hashes
        assert db_lookup.hash_features(row_input=row1, care_request_id=cr_id1) != db_lookup.hash_features(
            row_input=row1, care_request_id=cr_id2
        )

        # test if care_request_id already exists in row1, we'll raise
        row1["care_request_id"] = 345
        with pytest.raises(DuplicateKeyError):
            db_lookup.hash_features(row_input=row1, care_request_id=cr_id1)

    def test__lookup_cached_prediction(self, row1, request_id, db_lookup):
        feature_hash = db_lookup.hash_features(row_input=row1)
        gate = "lookup_gate"

        with patch.object(statsig, "check_gate", return_value=True):
            with patch.object(db_lookup.querier, "lookup_prediction"):
                result = db_lookup.lookup_cached_prediction(feature_hash=feature_hash, request_id=request_id, gate=gate)
                statsig.check_gate.assert_called_once_with(user=StatsigUser(user_id=request_id), gate=gate)
                db_lookup.querier.lookup_prediction.assert_called_with(feature_hash=feature_hash)
                assert result is not None

    def test__lookup_cached_prediction_no_op(self, row1, request_id):
        """Test when we should not look up predictions."""
        empty_querier = MockQuerier()
        empty_querier._conn = None
        empty_lookup = MockDBLookup(querier=empty_querier)

        feature_hash = empty_lookup.hash_features(row_input=row1)
        gate = "lookup_gate"

        with patch.object(empty_querier, "lookup_prediction"):
            # result should be None if querier._conn is None
            result1 = empty_lookup.lookup_cached_prediction(feature_hash=feature_hash, request_id=request_id, gate=gate)
            assert result1 is None
            empty_lookup.querier.lookup_prediction.assert_not_called()

            empty_lookup.querier._conn = MagicMock(spec=Connection)

            # result should be None if check_gate returns False
            with patch.object(statsig, "check_gate", return_value=False):
                result2 = empty_lookup.lookup_cached_prediction(
                    feature_hash=feature_hash, request_id=request_id, gate=gate
                )
                assert result2 is None
                empty_lookup.querier.lookup_prediction.assert_not_called()

    def test_insert_prediction(self, row1, request_id, db_lookup):
        feature_hash = db_lookup.hash_features(row_input=row1)
        gate = "insertion_gate"
        prediction = True

        with patch.object(statsig, "check_gate", return_value=True):
            with patch.object(db_lookup.querier, "add_new_prediction"):
                db_lookup._insert_prediction(
                    feature_hash=feature_hash, prediction=prediction, request_id=request_id, gate=gate
                )
                statsig.check_gate.assert_called_once_with(user=StatsigUser(user_id=request_id), gate=gate)
                db_lookup.querier.add_new_prediction.assert_called_with(
                    feature_hash=feature_hash, prediction=prediction
                )

    def test_insert_prediction_no_op(self, row1, request_id):
        """Test when we should not look up predictions."""
        empty_querier = MockQuerier()
        empty_querier._conn = None
        empty_lookup = MockDBLookup(querier=empty_querier)

        feature_hash = empty_lookup.hash_features(row_input=row1)
        gate = "insertion_gate"
        prediction = True

        with patch.object(empty_querier, "add_new_prediction"):
            # result should be None if querier._conn is None
            result1 = empty_lookup.insert_prediction(
                feature_hash=feature_hash, prediction=prediction, request_id=request_id, gate=gate
            )
            assert result1 is None
            empty_lookup.querier.add_new_prediction.assert_not_called()

            empty_lookup.querier._conn = MagicMock(spec=Connection)

            # result should be None if check_gate returns False
            with patch.object(statsig, "check_gate", return_value=False):
                result2 = empty_lookup.insert_prediction(
                    feature_hash=feature_hash, prediction=prediction, request_id=request_id, gate=gate
                )
                assert result2 is None
                empty_lookup.querier.add_new_prediction.assert_not_called()

    def test_update_last_queried(self, request_id, db_lookup):
        gate = "update_gate"
        mock_id = 123

        with patch.object(statsig, "check_gate", return_value=True):
            with patch.object(db_lookup.querier, "update_last_queried"):
                db_lookup._update_last_queried(id=mock_id, request_id=request_id, gate=gate)
                statsig.check_gate.assert_called_once_with(user=StatsigUser(user_id=request_id), gate=gate)
                db_lookup.querier.update_last_queried.assert_called_with(id=mock_id)

    def test_update_last_queried_no_op(self, request_id):
        """Test when we should not look up predictions."""
        empty_querier = MockQuerier()
        empty_querier._conn = None
        empty_lookup = MockDBLookup(querier=empty_querier)

        gate = "insertion_gate"
        mock_id = 123

        with patch.object(empty_querier, "update_last_queried"):
            # result should be None if querier._conn is None
            result1 = empty_lookup.update_last_queried(id=mock_id, request_id=request_id, gate=gate)
            assert result1 is None
            empty_lookup.querier.update_last_queried.assert_not_called()

            empty_lookup.querier._conn = MagicMock(spec=Connection)

            # result should be None if check_gate returns False
            with patch.object(statsig, "check_gate", return_value=False):
                result2 = empty_lookup.update_last_queried(id=mock_id, request_id=request_id, gate=gate)
                assert result2 is None
                empty_lookup.querier.update_last_queried.assert_not_called()
