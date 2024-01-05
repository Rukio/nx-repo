# -*- coding: utf-8 -*-
from __future__ import annotations

import datetime
import time
import unittest
from unittest.mock import call
from unittest.mock import Mock
from unittest.mock import patch

import pandas as pd
import pytest
from feature_store import ingest
from feature_store.enums import DtypeEnum
from feature_store.errors import MissingEventTimeColumnError
from sagemaker.feature_store.feature_definition import FeatureTypeEnum
from sagemaker.feature_store.feature_group import FeatureDefinition
from sagemaker.feature_store.feature_group import FeatureGroup
from sagemaker.feature_store.feature_group import IngestionError
from sagemaker.feature_store.inputs import FeatureParameter
from sagemaker.session import Session


TENACITY_NAP_TIME = "tenacity.nap.time"
NA_STRING = str(pd.NA)


class TestIngestFeatureStore(unittest.TestCase):
    def setUp(self) -> None:
        self.role = "arn:aws:iam::21342134231412:role/sagemaker_feature_store_role"
        self.sagemaker_session_mock = Mock(spec=Session)
        self.sagemaker_session_mock.default_bucket.return_value = Mock(spec=str)
        self.feature_group_name = "feature-group-name"
        self.record_identifier_name = "customer_id"
        self.event_time_feature_name = "event_time"
        self.customer_data = [
            {
                "customer_id": 573291,
                "event_time": datetime.datetime.now().timestamp(),
                "city_code": 1,
                "state_code": 49,
                "country_code": 2,
            },
            {
                "customer_id": 109382,
                "event_time": datetime.datetime.now().timestamp(),
                "city_code": 2,
                "state_code": 40,
                "country_code": 2,
            },
            {
                "customer_id": 828400,
                "event_time": datetime.datetime.now().timestamp(),
                "city_code": 3,
                "state_code": 31,
                "country_code": 2,
            },
            {
                "customer_id": 124013,
                "event_time": datetime.datetime.now().timestamp(),
                "city_code": 4,
                "state_code": 5,
                "country_code": 2,
            },
        ]
        self.dtypes = {
            "customer_id": DtypeEnum.Int,
            "city_code": DtypeEnum.Int,
            "state_code": DtypeEnum.Int,
            "country_code": DtypeEnum.Int,
            "event_time": DtypeEnum.Float,
        }

    @patch.object(ingest, "logger")
    def test_ingest_data(self, mock_logging):
        customer_data_frame = pd.DataFrame(self.customer_data)

        with patch.object(
            ingest.IngestFeatureStore, "_get_feature_group", return_value=Mock(spec=FeatureGroup)
        ) as get_feature_group:
            with patch.object(ingest.IngestFeatureStore, "_update_feature_group_definitions") as load_feature_group:
                with patch.object(
                    ingest.IngestFeatureStore, "_transform_dataframe_for_feature_store"
                ) as transform_dataframe_for_feature_store:
                    mock_feature_group_instance = get_feature_group.return_value
                    mock_feature_group_instance.create.return_value = {}
                    mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Created"}
                    transform_dataframe_for_feature_store.return_value = customer_data_frame, self.dtypes

                    max_workers = 8
                    ifs = ingest.IngestFeatureStore(
                        self.sagemaker_session_mock,
                        self.feature_group_name,
                        self.record_identifier_name,
                        self.event_time_feature_name,
                        self.role,
                        max_workers=max_workers,
                    )
                    # The default bucket is set
                    self.sagemaker_session_mock.default_bucket.assert_called_once()
                    # A feature group instance is created with the correct name
                    get_feature_group.assert_called_once()

                    # The feature group is created.
                    ifs.create_feature_group([])
                    mock_feature_group_instance.create.assert_called_once()

                    # Definitions are loaded and the data is ingested
                    ifs.ingest(customer_data_frame)
                    # The definitions are loaded with the correct data frame
                    transform_dataframe_for_feature_store.assert_called_once_with(customer_data_frame)
                    load_feature_group.assert_called_once_with(customer_data_frame, self.dtypes)
                    # The correct data frame is ingested
                    mock_feature_group_instance.ingest.assert_called_once_with(
                        data_frame=customer_data_frame, max_workers=max_workers, wait=True
                    )
                    mock_logging.info.return_value = Mock()
                    mock_logging.info.assert_has_calls(
                        [
                            call(f"Creating Feature Group '{self.feature_group_name}'"),
                            call(get_feature_group().create()),
                            call(f"Ingesting Feature Group '{self.feature_group_name}'"),
                            call(f"Ingestion completed successfully for Feature Group '{self.feature_group_name}'"),
                        ]
                    )

    @patch.object(ingest, "logger")
    def test_create_feature_group(self, mock_logging):
        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            mock_feature_group_instance = get_feature_group.return_value
            mock_feature_group_instance.create.return_value = {}

            ifs = ingest.IngestFeatureStore(
                self.sagemaker_session_mock,
                self.feature_group_name,
                self.record_identifier_name,
                self.event_time_feature_name,
                self.role,
            )
            # The default bucket is set
            self.sagemaker_session_mock.default_bucket.assert_called_once()
            # A feature group instance is set with the correct name
            get_feature_group.assert_called_once()

            # The feature group is created.
            feature_definitions = [FeatureDefinition(feature_name="city_code", feature_type=FeatureTypeEnum.INTEGRAL)]
            ifs.create_feature_group(feature_definitions)
            mock_feature_group_instance.create.assert_called_once()
            mock_logging.info.return_value = Mock()
            mock_logging.info.assert_has_calls(
                [call(f"Creating Feature Group '{self.feature_group_name}'"), call(get_feature_group().create())]
            )

    @patch.object(ingest, "logger")
    def test_create_feature_group_wrong_event_time_dtype(self, mock_logging):
        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            mock_feature_group_instance = get_feature_group.return_value
            mock_feature_group_instance.create.return_value = {}

            ifs = ingest.IngestFeatureStore(
                self.sagemaker_session_mock,
                self.feature_group_name,
                self.record_identifier_name,
                self.event_time_feature_name,
                self.role,
            )
            # The default bucket is set
            self.sagemaker_session_mock.default_bucket.assert_called_once()
            # A feature group instance is set with the correct name
            get_feature_group.assert_called_once()

            # The feature group is created.
            feature_definitions = [
                FeatureDefinition(feature_name=self.event_time_feature_name, feature_type=FeatureTypeEnum.INTEGRAL)
            ]
            with pytest.raises(ingest.EventTimeFeatureTypeError):
                ifs.create_feature_group(feature_definitions)

    def test_feature_group_exist(self):
        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            mock_feature_group_instance = get_feature_group.return_value
            mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Created"}

            ifs = ingest.IngestFeatureStore(
                self.sagemaker_session_mock,
                self.feature_group_name,
                self.record_identifier_name,
                self.event_time_feature_name,
                self.role,
            )
            # The default bucket is set
            self.sagemaker_session_mock.default_bucket.assert_called_once()
            # A feature group instance is created with the correct name
            get_feature_group.assert_called_once()

            # The feature group existence is checked
            result = ifs.feature_group_exist()
            mock_feature_group_instance.describe.assert_called_once()

            assert result is True

    def test_feature_group_do_not_exist(self):

        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            mock_feature_group_instance = get_feature_group.return_value
            mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Creating"}

            ifs = ingest.IngestFeatureStore(
                self.sagemaker_session_mock,
                self.feature_group_name,
                self.record_identifier_name,
                self.event_time_feature_name,
                self.role,
            )
            # The default bucket is set
            self.sagemaker_session_mock.default_bucket.assert_called_once()
            # A feature group instance is created with the correct name
            get_feature_group.assert_called_once()

            # The feature group existence is checked
            result = ifs.feature_group_exist()
            mock_feature_group_instance.describe.assert_called_once()

            assert result is False

    def test_transform_dataframe_for_feature_store(self):
        customer_data = [
            {
                "customer_id": 573291,
                "start_time": "2022-01-01",
                "gender": "M",
                "is_premium_customer": True,
                "ctr": 0.123,
            },
            {
                "customer_id": 109382,
                "start_time": "2022-01-01",
                "gender": "M",
                "is_premium_customer": False,
                "ctr": 0.456,
            },
            {
                "customer_id": 828400,
                "start_time": "2022-01-01",
                "gender": "F",
                "is_premium_customer": True,
                "ctr": 0.789,
            },
            {
                "customer_id": 124013,
                "start_time": "2022-01-01",
                "gender": "F",
                "is_premium_customer": False,
                "ctr": 0.012,
            },
        ]
        df = pd.DataFrame(customer_data)
        df["event_time"] = datetime.datetime.now()
        df["start_time"] = pd.to_datetime(df["start_time"])
        # need to convert customer_id to Int type with missing values
        df["customer_id"] = df["customer_id"].astype("Int64")
        # in pandas, 'boolean' type allows NA but not 'bool' type
        df["is_premium_customer"] = df["is_premium_customer"].astype("boolean")

        # set some values to NA
        df["customer_id"].iloc[0] = pd.NA
        df["is_premium_customer"].iloc[2] = pd.NA
        df["ctr"].iloc[3] = pd.NA
        df["gender"].iloc[3] = pd.NA

        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            mock_feature_group_instance = get_feature_group.return_value
            mock_feature_group_instance.create.return_value = {}
            mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Created"}

            ifs = ingest.IngestFeatureStore(
                self.sagemaker_session_mock,
                self.feature_group_name,
                self.record_identifier_name,
                self.event_time_feature_name,
                self.role,
            )
            # The default bucket is set
            self.sagemaker_session_mock.default_bucket.assert_called_once()
            # A feature group instance is set with the correct name
            get_feature_group.assert_called_once()

            df_transformed, dtypes = ifs._transform_dataframe_for_feature_store(df)

            # Verify the data types and values of transformed DataFrame columns
            assert df_transformed["customer_id"].dtype == "object"
            assert dtypes["customer_id"] == DtypeEnum.Int
            assert df_transformed["start_time"].dtype == "object"
            assert dtypes["start_time"] == DtypeEnum.Float
            assert df_transformed["event_time"].dtype == "Float64"
            assert dtypes["event_time"] == DtypeEnum.Float
            assert df_transformed["is_premium_customer"].dtype == "object"
            assert dtypes["is_premium_customer"] == DtypeEnum.Bool
            assert df_transformed["ctr"].dtype == "object"
            assert dtypes["ctr"] == DtypeEnum.Float
            assert df_transformed["gender"].dtype == "object"
            assert dtypes["gender"] == DtypeEnum.Str

            # test that NA values are as expected
            assert df_transformed["customer_id"].iloc[0] == NA_STRING
            assert df_transformed["is_premium_customer"].iloc[2] == NA_STRING
            assert df_transformed["ctr"].iloc[3] == NA_STRING
            assert df_transformed["gender"].iloc[3] == NA_STRING

    def test_update_feature_group_definitions(self):
        customer_data_frame = pd.DataFrame(self.customer_data)

        lfd_return_value = [
            FeatureDefinition(feature_name=col, feature_type=FeatureTypeEnum.STRING)
            for col in sorted(customer_data_frame.columns)
        ]
        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            with patch.object(ingest.IngestFeatureStore, "load_feature_definitions", return_value=lfd_return_value):
                mock_feature_group_instance = get_feature_group.return_value
                # mock what the feature group's existing feature definitions are
                mock_feature_group_instance.describe.return_value = {
                    "FeatureDefinitions": [{"FeatureName": "event_time"}]
                }

                ifs = ingest.IngestFeatureStore(
                    self.sagemaker_session_mock,
                    self.feature_group_name,
                    self.record_identifier_name,
                    self.event_time_feature_name,
                    self.role,
                )
                # The default bucket is set
                self.sagemaker_session_mock.default_bucket.assert_called_once()
                # A feature group instance is created with the correct name
                get_feature_group.assert_called_once()

                ifs._update_feature_group_definitions(customer_data_frame, self.dtypes)
                ifs.load_feature_definitions.assert_called_once()

                expected_feature_definitions = [
                    FeatureDefinition(feature_name=col, feature_type=FeatureTypeEnum.STRING)
                    for col in sorted(customer_data_frame.columns)
                    if col != "event_time"
                ]
                mock_feature_group_instance.update.assert_called_once_with(
                    feature_additions=expected_feature_definitions
                )
                calls = []
                for col in customer_data_frame.columns:
                    if col == "event_time":
                        calls.append(
                            call(feature_name=col, parameter_additions=[FeatureParameter(key="dtype", value="Float")])
                        )
                    else:
                        calls.append(
                            call(feature_name=col, parameter_additions=[FeatureParameter(key="dtype", value="Int")])
                        )
                with patch.object(ifs.sagemaker_session, "update_feature_metadata"):
                    mock_feature_group_instance.update_feature_metadata.assert_has_calls(calls, any_order=True)

    def test__update_feature_dtype(self):
        ifs = ingest.IngestFeatureStore(
            self.sagemaker_session_mock,
            self.feature_group_name,
            self.record_identifier_name,
            self.event_time_feature_name,
            self.role,
        )
        with patch.object(ifs.feature_group.sagemaker_session, "update_feature_metadata") as update_metata:
            # patch this method that is being called under the hood
            ifs._update_feature_dtype(feature_name="some_feature", dtype=DtypeEnum.Int)
            update_metata.assert_called_once()

    @patch.object(ingest, "logger")
    def test_ingest_feature_group_not_ready(self, mock_logging):
        customer_data_frame = pd.DataFrame({})
        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            mock_feature_group_instance = get_feature_group.return_value
            mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Creating"}

            ifs = ingest.IngestFeatureStore(
                self.sagemaker_session_mock,
                self.feature_group_name,
                self.record_identifier_name,
                self.event_time_feature_name,
                self.role,
            )
            # The default bucket is set
            self.sagemaker_session_mock.default_bucket.assert_called_once()
            # A feature group instance is created with the correct name
            get_feature_group.assert_called_once()

            with patch(TENACITY_NAP_TIME):
                with self.assertRaises(UserWarning):
                    ifs.ingest(customer_data_frame)
                mock_logging.exception.return_value = Mock()
                mock_logging.exception.assert_has_calls(
                    [
                        call(
                            f"Ingestion failed. Feature Group '{self.feature_group_name}' "
                            f"does not exist or is not ready."
                        )
                    ]
                )

    @patch.object(ingest, "logger")
    def test_ingest_data_with_retry(self, mock_logging):
        customer_data_frame = pd.DataFrame(self.customer_data)
        current_time_sec = int(round(time.time()))
        customer_data_frame["event_time"] = pd.Series([current_time_sec] * len(customer_data_frame), dtype="float64")

        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            with patch.object(
                ingest.IngestFeatureStore, "_transform_dataframe_for_feature_store"
            ) as transform_dataframe_for_feature_store:
                mock_feature_group_instance = get_feature_group.return_value
                mock_feature_group_instance.create.return_value = {}
                mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Created"}
                transform_dataframe_for_feature_store.return_value = customer_data_frame, self.dtypes

                max_workers = 8
                ifs = ingest.IngestFeatureStore(
                    self.sagemaker_session_mock,
                    self.feature_group_name,
                    self.record_identifier_name,
                    self.event_time_feature_name,
                    self.role,
                    max_workers=max_workers,
                )
                # The default bucket is set
                self.sagemaker_session_mock.default_bucket.assert_called_once()
                # A feature group instance is created with the correct name
                get_feature_group.assert_called_once()

                # The feature group is created.
                ifs.create_feature_group([])
                mock_feature_group_instance.create.assert_called_once()

                # Definitions are loaded and the data is ingested
                ifs.failed_rows = [1, 2]
                with patch(TENACITY_NAP_TIME):
                    ifs.ingest(customer_data_frame)
                # The definitions are loaded with the correct data frame
                transform_dataframe_for_feature_store.assert_called_once_with(customer_data_frame)
                mock_logging.info.return_value = Mock()
                mock_logging.info.assert_has_calls(
                    [
                        call(
                            f"Re-trying {len(ifs.failed_rows)} failed rows for "
                            f"Feature Group '{self.feature_group_name}'"
                        ),
                    ]
                )

    @patch.object(ingest, "logger")
    def test_ingest_data_failed(self, mock_logging):
        customer_data_frame = pd.DataFrame(self.customer_data)
        current_time_sec = int(round(time.time()))
        customer_data_frame["event_time"] = pd.Series([current_time_sec] * len(customer_data_frame), dtype="float64")

        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            with patch.object(
                ingest.IngestFeatureStore, "_transform_dataframe_for_feature_store"
            ) as transform_dataframe_for_feature_store:
                mock_feature_group_instance = get_feature_group.return_value
                mock_feature_group_instance.create.return_value = {}
                mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Created"}
                transform_dataframe_for_feature_store.return_value = customer_data_frame, self.dtypes

                max_workers = 8
                ifs = ingest.IngestFeatureStore(
                    self.sagemaker_session_mock,
                    self.feature_group_name,
                    self.record_identifier_name,
                    self.event_time_feature_name,
                    self.role,
                    max_workers=max_workers,
                )
                # The default bucket is set
                self.sagemaker_session_mock.default_bucket.assert_called_once()
                # A feature group instance is created with the correct name
                get_feature_group.assert_called_once()

                # The feature group is created.
                ifs.create_feature_group([])
                mock_feature_group_instance.create.assert_called_once()

                # Definitions are loaded and the data is ingested
                ifs.failed_rows = [1, 2]
                ingestion_error_message = "Bad Connection"
                mock_feature_group_instance.ingest.side_effect = IngestionError(
                    ifs.failed_rows, ingestion_error_message
                )
                with patch(TENACITY_NAP_TIME):
                    with self.assertRaises(IngestionError):
                        ifs.ingest(customer_data_frame)
                # The definitions are loaded with the correct data frame
                mock_logging.exception.return_value = Mock()
                mock_logging.exception.assert_has_calls(
                    [
                        call(f"Ingestion failed. {ifs.failed_rows} -> {ingestion_error_message}"),
                    ]
                )

    @patch.object(ingest, "logger")
    def test_ingest_missing_event_time_column(self, mock_logging):
        df = pd.DataFrame(self.customer_data).drop(columns=["event_time"])

        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            with patch.object(
                ingest.IngestFeatureStore, "_transform_dataframe_for_feature_store"
            ) as transform_dataframe_for_feature_store:
                mock_feature_group_instance = get_feature_group.return_value
                mock_feature_group_instance.create.return_value = {}
                mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Created"}
                transform_dataframe_for_feature_store.return_value = df, self.dtypes

                max_workers = 8
                ifs = ingest.IngestFeatureStore(
                    self.sagemaker_session_mock,
                    self.feature_group_name,
                    self.record_identifier_name,
                    self.event_time_feature_name,
                    self.role,
                    max_workers=max_workers,
                )

                # The feature group is created.
                ifs.create_feature_group([])

                with patch(TENACITY_NAP_TIME):
                    with pytest.raises(ingest.MissingEventTimeColumnError):
                        ifs.ingest(df)

    @patch.object(ingest, "logger")
    def test_ingest_missing_value_in_event_time(self, mock_logging):
        df = pd.DataFrame(self.customer_data)
        df["event_time"] = datetime.datetime.now().timestamp()
        df["event_time"].iloc[0] = None

        with patch.object(ingest.IngestFeatureStore, "_get_feature_group") as get_feature_group:
            with patch.object(
                ingest.IngestFeatureStore, "_transform_dataframe_for_feature_store"
            ) as transform_dataframe_for_feature_store:
                mock_feature_group_instance = get_feature_group.return_value
                mock_feature_group_instance.create.return_value = {}
                mock_feature_group_instance.describe.return_value = {"FeatureGroupStatus": "Created"}
                transform_dataframe_for_feature_store.return_value = df, self.dtypes

                max_workers = 8
                ifs = ingest.IngestFeatureStore(
                    self.sagemaker_session_mock,
                    self.feature_group_name,
                    self.record_identifier_name,
                    self.event_time_feature_name,
                    self.role,
                    max_workers=max_workers,
                )

                # The feature group is created.
                ifs.create_feature_group([])

                with patch(TENACITY_NAP_TIME):
                    with pytest.raises(ingest.MissingEventTimeError):
                        ifs.ingest(df)

    def test_load_feature_definitions(self):
        df = pd.DataFrame(self.customer_data)
        expected_defs = []
        for col in df.columns:
            if col == self.event_time_feature_name:
                dtype = FeatureTypeEnum.FRACTIONAL
            else:
                dtype = FeatureTypeEnum.STRING
            expected_defs.append(FeatureDefinition(feature_name=col, feature_type=dtype))

        ifs = ingest.IngestFeatureStore(
            self.sagemaker_session_mock,
            self.feature_group_name,
            self.record_identifier_name,
            self.event_time_feature_name,
            self.role,
        )

        loaded_defs = ifs.load_feature_definitions(df, event_time_col=self.event_time_feature_name)

        assert loaded_defs == expected_defs

    def test_load_feature_definitions_missing_event_time(self):
        df = pd.DataFrame(self.customer_data).drop(columns=[self.event_time_feature_name])
        ifs = ingest.IngestFeatureStore(
            self.sagemaker_session_mock,
            self.feature_group_name,
            self.record_identifier_name,
            self.event_time_feature_name,
            self.role,
        )

        with pytest.raises(MissingEventTimeColumnError):
            ifs.load_feature_definitions(df, event_time_col=self.event_time_feature_name)
