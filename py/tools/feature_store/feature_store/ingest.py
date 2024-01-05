# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import os

import pandas as pd
from beartype import beartype
from beartype.typing import Any
from beartype.typing import Dict
from beartype.typing import List
from beartype.typing import Optional
from beartype.typing import Sequence
from beartype.typing import Tuple
from botocore.exceptions import ClientError
from feature_store.errors import EventTimeFeatureTypeError
from feature_store.errors import MissingEventTimeColumnError
from feature_store.errors import MissingEventTimeError
from pythonjsonlogger import jsonlogger
from sagemaker.feature_store.feature_definition import FeatureTypeEnum
from sagemaker.feature_store.feature_group import FeatureDefinition
from sagemaker.feature_store.feature_group import FeatureGroup
from sagemaker.feature_store.feature_group import IngestionError
from sagemaker.feature_store.inputs import FeatureParameter
from sagemaker.session import Session
from tenacity import retry
from tenacity import stop_after_attempt
from tenacity import wait_exponential

from .enums import DtypeEnum

NA_STRING = "<NA>"

logger = logging.getLogger("feature_store_ingestion")
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)


@beartype
class IngestFeatureStore:
    """
    A wrapper for the sagemaker library to create feature groups and ingest data.

    Parameters
    ----------
    sagemaker_session : Session
        The SageMaker session to interact with AWS services.
    feature_group_name : str
        The name of the feature group to be created or used.
    record_identifier_name : str
        The name of the record identifier column in the input data.
    event_time_feature_name : str
        The name of the event time column in the input data.
    role : str
        The role ARN to be used for SageMaker Feature Store operations.
    enable_online_store : Optional[bool], default=True
        Whether to enable the online store for the feature group.
    prefix : Optional[str], default="default_s3_bucket"
        The prefix for the S3 bucket for the offline store.
    max_workers : Optional[int], default=os.cpu_count()
        Number of threads that will be created to work on different partitions of
        the ``data_frame`` in parallel.

    Attributes
    ----------
    sagemaker_session : Session
        The SageMaker session to interact with AWS services.
    bucket_name : str
        The name of the default bucket to use in relevant Amazon SageMaker interactions.
    region : str
        The region to be used for Amazon SageMaker interactions.
    feature_group_name : str
        The name of the feature group to be created or used.
    feature_group : FeatureGroup
        The feature group object.
    record_identifier_feature_name : str
        The name of the record identifier column in the input data.
    event_time_feature_name : str
        The name of the event time column in the input data.
    prefix : Optional[str]
        The prefix for the S3 bucket for the offline store.
    enable_online_store : Optional[bool]
        Whether to enable the online store for the feature group.
    role : str
        The role ARN to be used for SageMaker Feature Store operations.
    failed_rows : list
        A list of indices of rows that failed to ingest.
    max_workers : Optional[int]
        Number of threads that will be created to work on different partitions of
        the ``data_frame`` in parallel.
    """

    def __init__(
        self,
        sagemaker_session: Session,
        feature_group_name: str,
        record_identifier_name: str,
        event_time_feature_name: str,
        role: str,
        enable_online_store: Optional[bool] = True,
        prefix: Optional[str] = "default_s3_bucket",
        max_workers: Optional[int] = os.cpu_count(),
    ):
        """
        Initialize IngestFeatureStore with the given parameters.
        """
        self.sagemaker_session = sagemaker_session
        self.bucket_name = self.sagemaker_session.default_bucket()
        self.region = self.sagemaker_session.boto_region_name
        self.feature_group_name = feature_group_name
        self.feature_group = self._get_feature_group()
        self.record_identifier_feature_name = record_identifier_name
        self.event_time_feature_name = event_time_feature_name
        self.prefix = prefix
        self.enable_online_store = enable_online_store
        self.role = role
        self.failed_rows: List[int] = []
        self.max_workers = max_workers

    def create_feature_group(self, feature_definitions: Sequence[FeatureDefinition]) -> Dict[str, Any]:
        """
        Create a feature group in the SageMaker Feature Store.

        Parameters
        ----------
        feature_definitions : Sequence[FeatureDefinition]
            A sequence of FeatureDefinition objects.

        Returns
        -------
        Dict[str, Any]
            A dictionary containing information about the created feature group.
        """
        self.feature_group = self._get_feature_group(feature_definitions=feature_definitions)
        logger.info(f"Creating Feature Group '{self.feature_group_name}'")

        # check that event time column has the correct type (FRACTIONAL); if not,
        # raise an error early
        for fdef in feature_definitions:
            if fdef.feature_name == self.event_time_feature_name and fdef.feature_type != FeatureTypeEnum.FRACTIONAL:
                raise EventTimeFeatureTypeError(
                    f"Event time column {self.event_time_feature_name} should have FRACTIONAL type, "
                    f"but {fdef.feature_type} is provided."
                )

        response = self.feature_group.create(
            s3_uri=f"s3://{self.bucket_name}/{self.prefix}",
            record_identifier_name=self.record_identifier_feature_name,
            event_time_feature_name=self.event_time_feature_name,
            role_arn=self.role,
            enable_online_store=self.enable_online_store,
        )
        logger.info(response)
        return response

    def load_feature_definitions(self, df: pd.DataFrame, event_time_col: str) -> List:
        """Return a list of FeatureDefinitions from a dataframe.

        Since we've decided to store all data types (floats, ints, bool) as strings
        in feature store in order to preserve missing data, the only feature that will
        not be str in feature store will be event_time feature.

        Parameters
        ----------
        df
            DataFrame carrying all feature data
        event_time_col
            Name of event time column; this column will be FRACTIONAL type

        Returns
        -------
        List of FeatureDefinitions
        """
        if event_time_col not in df.columns:
            raise MissingEventTimeColumnError(f"Event time column {event_time_col} not in dataframe.")
        output = []
        for col in df.columns:
            if col == event_time_col:
                dtype = FeatureTypeEnum.FRACTIONAL
            else:
                dtype = FeatureTypeEnum.STRING
            output.append(FeatureDefinition(feature_name=col, feature_type=dtype))

        return output

    @retry(stop=stop_after_attempt(10), wait=wait_exponential(multiplier=1, min=1, max=512), reraise=True)
    def ingest(self, data_frame: pd.DataFrame) -> None:
        """
        Ingest the given DataFrame into the feature group.

        Parameters
        ----------
        data_frame : pd.DataFrame
            The DataFrame to ingest into the feature group.

        Raises
        ------
        UserWarning
            If the feature group does not exist.

        Raises
        ------
        IngestionError
            If ingestion of the data frame fails repeatedly.

        Returns
        -------
        None
        """
        if not self.feature_group_exist():
            exception_message = f"Feature Group '{self.feature_group_name}' does not exist or is not ready."
            logger.exception(f"Ingestion failed. {exception_message}")
            raise UserWarning(exception_message)

        if self.event_time_feature_name not in data_frame.columns:
            raise MissingEventTimeColumnError(
                f"Event time column {self.event_time_feature_name} missing in input dataframe."
            )

        # raise if there are missing values in event time column
        if data_frame[self.event_time_feature_name].isna().sum() > 0:
            raise MissingEventTimeError(
                f"There are some missing values in event time column {self.event_time_feature_name}."
            )

        transformed_data_frame, dtypes = self._transform_dataframe_for_feature_store(data_frame)

        # We don't want to update the definitions when re-trying to ingest failed rows.
        if not self.failed_rows:
            self._update_feature_group_definitions(transformed_data_frame, dtypes)
            # We need to 'refresh' the FeatureGroup object
            self.feature_group = self._get_feature_group()
        try:
            if self.failed_rows:
                # We only want to re-try to ingest the failed rows.
                logger.info(
                    f"Re-trying {len(self.failed_rows)} failed rows for Feature Group '{self.feature_group_name}'"
                )
                feature_store_ready_data_frame = transformed_data_frame.iloc[self.failed_rows]
            else:
                feature_store_ready_data_frame = transformed_data_frame
            logger.info(f"Ingesting Feature Group '{self.feature_group_name}'")
            self.feature_group.ingest(
                data_frame=feature_store_ready_data_frame, max_workers=self.max_workers, wait=True
            )
        except IngestionError as error:
            self.failed_rows = error.failed_rows
            logger.exception(f"Ingestion failed. {error}")
            raise error

        logger.info(f"Ingestion completed successfully for Feature Group '{self.feature_group_name}'")

    def feature_group_exist(self) -> bool:
        """
        Check if the feature group and is ready for ingestion.

        Returns
        -------
        bool
            True if the feature group exists, False otherwise.

        Raises
        ------
        ClientError
            If there is an error checking for the feature group existence that is not "ResourceNotFound".
        """
        try:
            # TODO: Add const variables for hardcoded strings
            response = self.feature_group.describe()
            status = response.get("FeatureGroupStatus")
            return status == "Created"
        except ClientError as error:
            if error.response["Error"]["Code"] == "ResourceNotFound":
                return False
            raise error

    def _get_feature_group(self, feature_definitions=None) -> FeatureGroup:
        """
        Return a new FeatureGroup object with the provided feature group name and SageMaker session.

        Returns
        -------
        FeatureGroup
            A new FeatureGroup object with the provided feature group name and SageMaker session.
        """
        kwargs = {
            "name": self.feature_group_name,
            "sagemaker_session": self.sagemaker_session,
        }
        if feature_definitions:
            kwargs["feature_definitions"] = feature_definitions
        return FeatureGroup(**kwargs)

    def _transform_dataframe_for_feature_store(
        self, data_frame: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, DtypeEnum]]:
        """
        Transform the data types of a DataFrame to be compatible with AWS Feature Store.

        Because AWS Feature Store does not support missing values, we will encode
        missing values as '<NA>'. Therefore, we need to convert all data types
        into str to support encoding missing values.

        Parameters
        ----------
        data_frame : pd.DataFrame
            The input DataFrame to transform.

        Returns
        -------
        pd.DataFrame
            A new DataFrame with transformed data types.
        dtypes
            Dict mapping feature name to data type

        Raises
        ------
        ValueError
            If the input DataFrame contains an unsupported data type for Feature Store.
        """
        # TODO: Optimize df copy and pre-processing in general
        transformed_df = data_frame.copy()
        dtypes = {}

        for col in transformed_df.columns:
            if pd.api.types.is_datetime64_any_dtype(transformed_df[col]):
                transformed_df[col] = (
                    transformed_df[col]
                    .apply(lambda x: int(x.timestamp()) if not pd.isna(x) else None)
                    .astype("Float64")
                )
                if col != self.event_time_feature_name:
                    # event time column needs to remain float
                    transformed_df[col] = transformed_df[col].astype("str")
                dtypes[col] = DtypeEnum.Float
            elif pd.api.types.is_float_dtype(transformed_df[col]):
                # Converts float to scientific notation string
                transformed_df[col] = (
                    transformed_df[col]
                    .astype("Float64")
                    .apply(lambda x: NA_STRING if pd.isna(x) else "{:.4e}".format(x))
                )
                dtypes[col] = DtypeEnum.Float
            elif pd.api.types.is_integer_dtype(transformed_df[col]):
                transformed_df[col] = (
                    transformed_df[col].astype("Int64").apply(lambda x: NA_STRING if pd.isna(x) else str(x))
                )
                dtypes[col] = DtypeEnum.Int
            elif pd.api.types.is_bool_dtype(transformed_df[col]):
                transformed_df[col] = (
                    transformed_df[col].astype("Int64").apply(lambda x: NA_STRING if pd.isna(x) else str(x))
                )
                dtypes[col] = DtypeEnum.Bool
            elif pd.api.types.is_string_dtype(transformed_df[col]):
                # even though this column is already string, still need another call of
                # astype() to convert any NAs into "<NA>"
                transformed_df[col] = transformed_df[col].apply(lambda x: NA_STRING if pd.isna(x) else str(x))
                dtypes[col] = DtypeEnum.Str
            else:
                exception_message = f"Unsupported data type for Feature Store: {transformed_df[col].dtype}"
                logger.exception(exception_message)
                raise ValueError(exception_message)

        return transformed_df, dtypes

    def _update_feature_dtype(self, feature_name: str, dtype: DtypeEnum):
        """Add/update data type for this feature in its metadata.

        Parameters
        ----------
        feature_name
            Name of feature
        dtype
            One of DtypeEnum types
        """
        self.feature_group.update_feature_metadata(
            feature_name=feature_name, parameter_additions=[FeatureParameter(key="dtype", value=dtype.name)]
        )

    def _update_feature_group_definitions(self, data_frame: pd.DataFrame, dtypes: Dict[str, DtypeEnum]) -> None:
        """
        Load the latest feature definitions from the given DataFrame and update the feature group.

        Also updates each feature's metadata to store the expected datatype. Since we want
        to support storing missing values in feature store (but SageMaker feature store does not
        explicitly allow that), we'll store all types as strings on feature store but encode
        missing values such that when we query records from feature store, we know how to preserve
        missing values.

        Parameters
        ----------
        data_frame : pd.DataFrame
            The DataFrame to load the feature definitions from.
        dtypes
            Dict mapping column name to expected data type
        """
        current_feature_names = set(fd["FeatureName"] for fd in self.feature_group.describe()["FeatureDefinitions"])
        latest_feature_definitions = {
            feature.feature_name: feature.feature_type
            for feature in self.load_feature_definitions(df=data_frame, event_time_col=self.event_time_feature_name)
        }

        latest_feature_names = set(latest_feature_definitions.keys())
        new_feature_names = list(latest_feature_names - current_feature_names)

        # sort feature names so we get a deterministic order to make testing possible
        feature_additions = [
            FeatureDefinition(feature_name=name, feature_type=latest_feature_definitions[name])
            for name in sorted(new_feature_names)
        ]
        if feature_additions:
            logger.info(
                f"Adding new feature definitions to '{self.feature_group_name}': {', '.join(new_feature_names)}"
            )
            self.feature_group.update(feature_additions=feature_additions)

        # now update each feature's metadata, even if there have been no change
        for feat in latest_feature_names:
            logging.info(f"Updating metadata for feature {feat}")
            self._update_feature_dtype(feature_name=feat, dtype=dtypes[feat])

    @retry(stop=stop_after_attempt(10), wait=wait_exponential(multiplier=1, min=1, max=512))
    def wait_for_feature_group_creation(self) -> None:
        """
        Wait for the feature group update to complete.

        Returns
        -------
        None or Exception
            If the feature group update succeeds, None is returned.
            If the feature group update fails, an Exception is raised.

        Raises
        ------
        Exception
            If the feature group update fails.
        """
        response = self.feature_group.describe()
        status = response["FeatureGroupStatus"]
        if status == "Created":
            return None
        elif status == "Failed":
            # TODO: Log exception
            raise Exception(f"Failed to update feature group '{self.feature_group_name}'.")
        return None
