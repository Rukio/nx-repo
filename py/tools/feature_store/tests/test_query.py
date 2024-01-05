# -*- coding: utf-8 -*-
from __future__ import annotations

import unittest
from datetime import datetime
from unittest.mock import call
from unittest.mock import Mock
from unittest.mock import patch

import boto3
import pandas as pd
import pytest
from feature_store import query
from feature_store.enums import DtypeEnum
from sagemaker.session import Session


count = 0
mock_token = "token"


def mock_list_feature_groups(*args, **kwargs):
    global count
    if count < 2:
        result = {"FeatureGroupSummaries": [], "NextToken": mock_token}
    else:
        result = {"FeatureGroupSummaries": []}
    count += 1
    return result


class TestQueryFeatureStore(unittest.TestCase):
    def setUp(self) -> None:
        self.sagemaker_session_mock = Mock(spec=Session)
        self.sagemaker_session_mock.default_bucket.return_value = Mock()
        self.sagemaker_session_mock.boto_session = Mock(spec=boto3.session.Session)
        self.sagemaker_session_mock.boto_session.return_value = Mock()
        self.sagemaker_session_mock.boto_session.client().return_value = Mock()
        self.sagemaker_session_mock.boto_session.client().get_record().return_value = Mock()
        self.sagemaker_session_mock.boto_session.client().list_feature_groups = Mock(wraps=mock_list_feature_groups)
        self.role = "arn:aws:iam::21342134231412:role/sagemaker_feature_store_role"
        self.feature_group_name = "feature_group"

    def test_get_record(self):
        feature_group_name = "feature-group-get-record"
        record_identifier_value = "42"

        with patch.object(query.QueryFeatureStore, "_get_feature_group") as get_feature_group:
            with patch.object(self.sagemaker_session_mock.boto_session, "client", return_value=Mock()):
                qfs = query.QueryFeatureStore(self.sagemaker_session_mock, feature_group_name, self.role)
                with patch.object(qfs.sagemaker_runtime_client, "get_record", return_value={}):
                    # The default bucket is set.
                    self.sagemaker_session_mock.default_bucket.assert_called_once()
                    self.sagemaker_session_mock.boto_session.client.assert_has_calls(
                        [call("sagemaker"), call("sagemaker-featurestore-runtime")]
                    )
                    # A feature group instance is created with the correct name
                    get_feature_group.assert_called_once_with(feature_group_name)

                    # The feature group is created.
                    qfs.get_record(record_identifier_value)

                    qfs.sagemaker_runtime_client.get_record.assert_called_once()

    def test_list_feature_groups(self):
        feature_group_name = "feature-group-list"

        with patch.object(query.QueryFeatureStore, "_get_feature_group") as get_feature_group:
            qfs = query.QueryFeatureStore(self.sagemaker_session_mock, feature_group_name, self.role)
            # The default bucket is set.
            self.sagemaker_session_mock.default_bucket.assert_called_once()
            # A feature group instance is created with the correct name
            get_feature_group.assert_called_once_with(feature_group_name)
            # List feature groups
            qfs.list_feature_groups()

            # the way we set up the mock, we should have called list_feature_groups once
            qfs.sagemaker_boto_client.list_feature_groups.assert_called_with(NextToken=mock_token)

    def test_get_features_records_with_event_time_range(self):
        feature_group_name = "feature-group-event-time-range"
        start_time = datetime(2023, 1, 1)
        end_time = datetime(2023, 2, 1)
        expected_df = pd.DataFrame({"feature": [1, 2, 3], "event_time": [start_time, end_time, start_time]})

        with patch.object(query.QueryFeatureStore, "_get_feature_group") as get_feature_group:
            with patch.object(query.FeatureStore, "create_dataset") as create_dataset_mock:
                dataset_builder_mock = Mock()
                dataset_builder_mock.to_dataframe.return_value = expected_df, ""
                create_dataset_mock.return_value = dataset_builder_mock

                qfs = query.QueryFeatureStore(self.sagemaker_session_mock, feature_group_name, self.role)
                get_feature_group.assert_called_once_with(feature_group_name)

                df, _ = qfs.get_features_records_with_event_time_range(start_time, end_time)

                create_dataset_mock.assert_called_once_with(
                    base=qfs.feature_group,
                    output_path=qfs.offline_store_output_path,
                )
                dataset_builder_mock.to_dataframe.assert_called_once()

                pd.testing.assert_frame_equal(df, expected_df)

    def _metadata_wrapper(self, feature_name):
        if feature_name == "age":
            return {"Parameters": [{"Key": "dtype", "Value": "Int"}]}
        if feature_name == "score":
            return {"Parameters": [{"Key": "dtype", "Value": "Float"}]}
        if feature_name == "is_female":
            return {"Parameters": [{"Key": "dtype", "Value": "Bool"}]}
        if feature_name == "market":
            # this unknown dtype will be handled and be defaulted to Str
            return {"Parameters": [{"Key": "dtype", "Value": "Stuff"}]}
        else:
            raise ValueError

    def test__get_feature_dtypes(self):
        mock_feature_definitions = [
            {"FeatureName": "age", "FeatureType": "Integral"},
            {"FeatureName": "score", "FeatureType": "Fractional"},
            {"FeatureName": "is_female", "FeatureType": "Integral"},
            {"FeatureName": "market", "FeatureType": "String"},
        ]
        with patch.object(query.QueryFeatureStore, "_get_feature_group"):
            qfs = query.QueryFeatureStore(self.sagemaker_session_mock, self.feature_group_name, self.role)
            with patch.multiple(
                qfs.feature_group,
                describe=Mock(return_value={"FeatureDefinitions": mock_feature_definitions}),
                describe_feature_metadata=Mock(wraps=self._metadata_wrapper),
            ):
                with patch.object(query.logger, "error"):
                    dtypes = qfs._get_feature_dtypes()
                    assert dtypes["age"] == DtypeEnum.Int
                    assert dtypes["score"] == DtypeEnum.Float
                    assert dtypes["is_female"] == DtypeEnum.Bool
                    assert dtypes["market"] == DtypeEnum.Str
                    # also test that an unknown type in metadata is caught and handled
                    unknown_type = self._metadata_wrapper("market")["Parameters"][0]["Value"]
                    query.logger.error.assert_called_with(f"Unable to parse dtype '{unknown_type}' from metadata.")

    def test__process_one_record(self):
        record = [
            {"FeatureName": "age", "ValueAsString": "30"},
            {"FeatureName": "score", "ValueAsString": "3.0"},
            {"FeatureName": "is_female", "ValueAsString": "1"},
            {"FeatureName": "market", "ValueAsString": "DEN"},
        ]
        expected_no_conv = {x["FeatureName"]: x["ValueAsString"] for x in record}
        expected_conv = {"age": 30, "score": 3.0, "is_female": True, "market": "DEN"}
        with patch.object(query.QueryFeatureStore, "_get_feature_group"):
            qfs = query.QueryFeatureStore(self.sagemaker_session_mock, self.feature_group_name, self.role)
            qfs.feature_dtypes = {
                "age": DtypeEnum.Int,
                "score": DtypeEnum.Float,
                "is_female": DtypeEnum.Bool,
                "market": DtypeEnum.Str,
            }
            result_no_conv = qfs._process_one_record(record, convert=False)
            assert result_no_conv == expected_no_conv
            result_conv = qfs._process_one_record(record, convert=True)
            assert result_conv == expected_conv

    def test_get_record_as_dict(self):
        with patch.object(query.QueryFeatureStore, "_get_feature_group"):
            qfs = query.QueryFeatureStore(self.sagemaker_session_mock, self.feature_group_name, self.role)
            with patch.multiple(
                qfs, get_record=Mock(return_value={"Record": []}), _process_one_record=Mock(return_value={})
            ):
                _ = qfs.get_record_as_dict("id", convert=True)
                qfs.get_record.assert_called_once_with("id")
                qfs._process_one_record.assert_called_once_with([], convert=True)

    def test_get_features_records(self):
        with patch.object(query.QueryFeatureStore, "_get_feature_group"):
            qfs = query.QueryFeatureStore(self.sagemaker_session_mock, self.feature_group_name, self.role)
            with patch.object(qfs.sagemaker_runtime_client, "batch_get_record"):
                _ = qfs.get_features_records([])
                qfs.sagemaker_runtime_client.batch_get_record.assert_called_once()

    def test_get_feature_records_as_df(self):
        with patch.object(query.QueryFeatureStore, "_get_feature_group"):
            qfs = query.QueryFeatureStore(self.sagemaker_session_mock, self.feature_group_name, self.role)
            qfs.feature_dtypes = {"age": DtypeEnum.Int, "is_female": DtypeEnum.Bool}
            batch_records = {
                "Records": [
                    {
                        "Record": [
                            {"FeatureName": "age", "ValueAsString": "30"},
                            {"FeatureName": "is_female", "ValueAsString": "1"},
                        ]
                    }
                ]
            }
            with patch.object(qfs, "get_features_records", return_value=batch_records):
                with patch.object(qfs.converter, "convert"):
                    _ = qfs.get_feature_records_as_df([], convert=False)
                    qfs.get_features_records.assert_called_once()
                    qfs.converter.convert.assert_not_called()
                    _ = qfs.get_feature_records_as_df([], convert=True)
                    qfs.converter.convert.assert_called()


class TestDataConverter:
    converter = query.DataConverter()

    def test__convert_int(self):
        assert self.converter._convert_int("1") == 1
        assert self.converter._convert_int(1) == 1
        assert self.converter._convert_int(query.NA_STRING) is None
        with pytest.raises(query.DataConversionError):
            self.converter._convert_int("1.2")

    def test__convert_float(self):
        assert self.converter._convert_float("1.23") == 1.23
        assert self.converter._convert_float("1.23e+02") == 123.0
        assert self.converter._convert_float(query.NA_STRING) is None
        assert self.converter._convert_float("1") == 1.0
        assert self.converter._convert_float(1.23) == 1.23
        with pytest.raises(query.DataConversionError):
            self.converter._convert_float("abc")

    def test__convert_bool(self):
        assert self.converter._convert_bool("T") is True
        assert self.converter._convert_bool("true") is True
        assert self.converter._convert_bool("f") is False
        assert self.converter._convert_bool("FALSE") is False
        assert self.converter._convert_bool(True) is True
        assert self.converter._convert_bool("1") is True
        assert self.converter._convert_bool("0") is False
        assert self.converter._convert_bool(query.NA_STRING) is None
        with pytest.raises(query.DataConversionError):
            self.converter._convert_bool("2")

    def test_convert(self):
        with patch.object(self.converter, "_convert_int", return_value=Mock(spec=int)):
            self.converter.convert("0", DtypeEnum.Int)
            self.converter._convert_int.assert_called_once_with("0")
        with patch.object(self.converter, "_convert_float", return_value=Mock(spec=float)):
            self.converter.convert("0", DtypeEnum.Float)
            self.converter._convert_float.assert_called_once_with("0")
        with patch.object(self.converter, "_convert_bool", return_value=Mock(spec=bool)):
            self.converter.convert("0", DtypeEnum.Bool)
            self.converter._convert_bool.assert_called_once_with("0")
        with patch.object(self.converter, "_convert_int"):
            self.converter.convert("0", DtypeEnum.Str)
            self.converter._convert_int.assert_not_called()
