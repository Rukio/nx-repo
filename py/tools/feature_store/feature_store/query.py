# -*- coding: utf-8 -*-
from __future__ import annotations

import datetime
import logging

import pandas as pd
from beartype import beartype
from beartype.typing import Any
from beartype.typing import Dict
from beartype.typing import List
from beartype.typing import Tuple
from feature_store.enums import DtypeEnum
from feature_store.ingest import NA_STRING
from pythonjsonlogger import jsonlogger
from sagemaker.feature_store.feature_group import FeatureGroup
from sagemaker.feature_store.feature_store import FeatureStore
from sagemaker.session import Session
from tenacity import retry
from tenacity import stop_after_attempt
from tenacity import wait_exponential


logger = logging.getLogger("feature_store_query")
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)


class DataConversionError(Exception):
    pass


@beartype
class DataConverter:
    def _convert_int(self, x: str | int) -> int | None:
        """Convert x to integer or None."""
        if isinstance(x, int):
            return x
        if x == NA_STRING:
            return None
        else:
            try:
                return int(x)
            except Exception as e_:
                logging.exception(e_)
                raise DataConversionError(f'Conversion to int failed for "{x}".')

    def _convert_float(self, x: str | float) -> float | None:
        """Convert x to float or None."""
        if isinstance(x, float):
            return x
        if x == NA_STRING:
            return None
        else:
            try:
                return float(x)
            except Exception as e_:
                logging.exception(e_)
                raise DataConversionError(f'Conversion to float failed for "{x}".')

    def _convert_bool(self, x: str | bool) -> bool | None:
        """Convert x to boolean or None.

        If x is a str, it has to be one of [0|1|true|t|false|f]
        when converted to lower case.
        """
        if isinstance(x, bool):
            return x
        if x == NA_STRING:
            return None
        if x.lower() in ["1", "t", "true"]:
            return True
        if x.lower() in ["0", "f", "false"]:
            return False
        # if we reach here, that means we cannot convert x into bool
        raise DataConversionError(f'Conversion to bool failed for "{x}".')

    def convert(self, x: Any, dtype: DtypeEnum) -> int | float | bool | str | None:
        """Convert input x into one of the DtypeEnum types.

        Parameters
        ----------
        x
            input value
        dtype
            One of the DtypeEnum

        Return
        ------
        converted input value
        """
        if dtype == DtypeEnum.Int:
            return self._convert_int(x)
        if dtype == DtypeEnum.Float:
            return self._convert_float(x)
        if dtype == DtypeEnum.Bool:
            return self._convert_bool(x)
        if dtype == DtypeEnum.Str:
            return x
        # really shouldn't reach here unless DtypeEnum's definition changed
        raise ValueError(f"Input {x} cannot be converted.")


@beartype
class QueryFeatureStore:
    """
    The QueryFeatureStore class is a wrapper for the sagemaker library to get records from a feature group.
    https://pypi.org/project/sagemaker/
    """

    def __init__(
        self, sagemaker_session: Session, feature_group_name: str, role: str, converter: DataConverter = DataConverter()
    ) -> None:
        """
        Initialize the QueryFeatureStore object.

        Parameters
        ----------
        sagemaker_session : Session
            The session to use for interacting with Amazon SageMaker.
        feature_group_name : str
            The name of the feature group to use.
        role : str
            The AWS IAM role to use when accessing the feature store.
        """
        self.sagemaker_session = sagemaker_session
        self.sagemaker_boto_client = self.sagemaker_session.boto_session.client(
            "sagemaker",
        )
        # only the runtime client has methods to get records (wtf Amazon)
        self.sagemaker_runtime_client = self.sagemaker_session.boto_session.client("sagemaker-featurestore-runtime")
        """The name of the default bucket to use in relevant Amazon SageMaker interactions."""
        self.bucket_name = self.sagemaker_session.default_bucket()
        self.region = self.sagemaker_session.boto_region_name
        """Feature group that will be used to ingest data."""
        self.feature_group_name = feature_group_name
        self.feature_group = self._get_feature_group(self.feature_group_name)
        self.offline_store_output_path = self._get_offline_store_output_path()
        self.role = role

        # get all feature data types at instantiation time; in AWS feature store a
        # feature's definition shouldn't have changed after creation, unless the
        # entire feature group and was re-created with the same name
        self.feature_dtypes = self._get_feature_dtypes()
        self.converter = converter

    def _get_feature_dtypes(self) -> Dict[str, DtypeEnum]:
        """Get all feature data types from their metadata."""
        feature_defs = self.feature_group.describe()["FeatureDefinitions"]

        # make default dtype Str
        dtypes: Dict[str, DtypeEnum] = {}

        for fdef in feature_defs:
            feature_name = fdef["FeatureName"]
            metadata = self.feature_group.describe_feature_metadata(feature_name=feature_name)["Parameters"]

            for md in metadata:
                if md["Key"] == "dtype":
                    try:
                        dtype = getattr(DtypeEnum, md["Value"])
                    except AttributeError:
                        dtype_meta = md["Value"]
                        logger.error(f"Unable to parse dtype '{dtype_meta}' from metadata.")
                        dtype = DtypeEnum.Str
                    break

            dtypes[feature_name] = dtype

        return dtypes

    def _get_feature_group(self, feature_group_name: str) -> FeatureGroup:
        """
        Get the FeatureGroup object for the given feature group name.

        Parameters
        ----------
        feature_group_name : str
            The name of the feature group to get.

        Returns
        -------
        FeatureGroup
            The FeatureGroup object for the given feature group name.
        """
        return FeatureGroup(name=feature_group_name, sagemaker_session=self.sagemaker_session)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=16), reraise=True)
    def list_feature_groups(self) -> List[Dict[str, Any]]:
        """
        List all the feature groups in the current AWS account.

        Use pagination token to retrieve all feature groups.

        Returns
        -------
        results
            A list of all feature group definitions in a Dict.
        """
        results = []
        response = self.sagemaker_boto_client.list_feature_groups()
        next_token = response.get("NextToken", None)
        results.extend(response["FeatureGroupSummaries"])

        while next_token:
            response = self.sagemaker_boto_client.list_feature_groups(NextToken=next_token)
            results.extend(response["FeatureGroupSummaries"])
            next_token = response.get("NextToken", None)

        return results

    def get_record(self, record_identifier_value: str) -> Dict[str, Any]:
        """
        Get the record with the given record identifier value.

        Parameters
        ----------
        record_identifier_value : str
            The value of the record identifier column for the record you want to retrieve.

        Returns
        -------
        Dict[str, Any]
            A dictionary with the record data.
        """
        return self.sagemaker_runtime_client.get_record(
            FeatureGroupName=self.feature_group.name, RecordIdentifierValueAsString=record_identifier_value
        )

    def _process_one_record(self, record: List[Dict[str, str]], convert: bool) -> Dict[str, str]:
        """Process raw record from feature store to a dict that maps feature name to value."""
        result = {}
        for feat in record:
            name = feat["FeatureName"]
            value = feat["ValueAsString"]
            if convert:
                value = self.converter.convert(value, self.feature_dtypes[name])
            result[name] = value

        return result

    def get_record_as_dict(self, record_identifier_value: str, convert: bool = True) -> Dict[str, Any]:
        """Get a single record from identifier, but returned as a dict.

        Returned dict maps feature name to feature value, and optinally feature values are
        converted to the proper type based on its metadata.
        """
        response = self.get_record(record_identifier_value)
        result = self._process_one_record(response["Record"], convert=convert)

        return result

    def get_features_records(self, record_identifier_values: List[str]):
        """
        Get the features records given the list of record identifier values.

        Parameters
        ----------
        record_identifier_values : list[str]
            A list of values for the record identifier column for the records you want to retrieve.

        Returns
        -------
        Dict[str, Any]
            A dictionary with the features records data.
        """
        return self.sagemaker_runtime_client.batch_get_record(
            Identifiers=[
                {
                    "FeatureGroupName": self.feature_group_name,
                    "RecordIdentifiersValueAsString": record_identifier_values,
                }
            ]
        )

    def get_feature_records_as_df(self, record_identifier_values: List[str], convert: bool = True) -> pd.DataFrame:
        """Get a dataframe containing all matching records."""
        batch_records = self.get_features_records(record_identifier_values)["Records"]
        results = []

        for record in batch_records:
            results.append(self._process_one_record(record["Record"], convert=False))

        # convert to dataframe and data types
        df = pd.DataFrame(results)

        if convert:
            # convert data types per feature
            for feat in df.columns:
                dtype = self.feature_dtypes[feat]
                df[feat] = df[feat].apply(lambda x, dst=dtype: self.converter.convert(x, dst))

        return df

    def _get_offline_store_output_path(self) -> str:
        """
        Get the S3 path of the offline store associated with the feature group.

        Returns
        -------
        str
           The S3 path of the offline store.
        """
        feature_group_metadata = self.feature_group.describe()
        s3_uri = feature_group_metadata["OfflineStoreConfig"]["S3StorageConfig"]["S3Uri"]
        table_name = feature_group_metadata["OfflineStoreConfig"]["DataCatalogConfig"]["TableName"]
        return f"{s3_uri}/{table_name}"

    def get_features_records_with_event_time_range(
        self, start_time: datetime.datetime, end_time: datetime.datetime
    ) -> Tuple[pd.DataFrame, str]:
        """
        Get the features records within a given time range.

        Parameters
        ----------
        start_time : datetime.datetime
           The start of the time range.
        end_time : datetime.datetime
           The end of the time range.

        Returns
        -------
        Tuple[pd.DataFrame, str]
           A tuple where the first element is a pandas DataFrame containing the features records,
           and the second element is the query string executed.
        """
        feature_store = FeatureStore(sagemaker_session=self.sagemaker_session)
        dataset_builder = feature_store.create_dataset(
            base=self.feature_group,
            output_path=self.offline_store_output_path,
        )
        dataset_builder.with_event_time_range(start_time, end_time)

        return dataset_builder.to_dataframe()
