# -*- coding: utf-8 -*-
from __future__ import annotations

import csv
from io import TextIOWrapper

from beartype import beartype
from beartype.typing import Dict
from beartype.typing import Optional
from botocore.client import BaseClient


LATEST_VERSION = "latest"


@beartype
class NormalizedProtocolNames:
    """An interface to the `seed__protocol_names.csv` file stored on S3

    The file lives at dwh github repo, it's synced to S3 whenever it changes,
    and represents the source of truth for normalized/standardized protocol names.
    Since the S3 bucket is versioned, the part of model training that needs normalized
    protocol names can be deterministic.

    Examples
    --------
    >>> from normalized_protocol_names.api import NormalizedProtocolNames
    >>> import boto3
    >>> s3 = boto3.client('s3')
    >>> mapper = NormalizedProtocolNames(s3)
    >>> mapper.get_latest_version()
    'b5fdc72ea5019ede38e048d39e58b71f'
    >>> mapper.std_protocol_name('Back Pain')
    'Back Pain'
    >>> mapper.std_protocol_name('Head Injury')
    'Head Injury'

    """

    def __init__(self, client: BaseClient) -> None:
        """Instantiate a NormalizedProtocolNames object.

        We will use the VersionId of objects to identify the correct version.

        Parameters
        ----------
        client
            A boto3 S3 client object.

        """
        self._client = client
        self._s3_bucket_name = "prd.risk-protocol-names"
        self._s3_object_key = "seed__protocol_names.csv"
        self._mappings: Dict[str, Dict[str, str]] = {}
        self._latest_version = self.get_latest_version()

    @property
    def s3_bucket_name(self) -> str:
        return self._s3_bucket_name

    @property
    def s3_object_key(self) -> str:
        return self._s3_object_key

    @property
    def latest_version(self) -> str:
        return self.get_latest_version()

    @property
    def mappings(self) -> Dict[str, Dict[str, str]]:
        return self._mappings

    def get_mapping(self, version: str) -> Dict[str, str]:
        """Get the risk protocol standardization mapping.

        Parameters
        ----------
        version
            The VersionId of the object.

        Returns
        -------
        Risk protocol standardization mapping as a dict.

        """
        if version in self._mappings:
            return self._mappings[version]
        else:
            s3_object = self._retrieve_s3_file(version)
            mapping = {}
            reader = csv.DictReader(TextIOWrapper(s3_object["Body"]))
            for row in reader:
                protocol_name = row["protocol_name"]
                protocol_name_std = row["protocol_name_standardized"]
                mapping[protocol_name] = protocol_name_std
            # cache this version
            self._mappings[version] = mapping
            return mapping

    def std_protocol_name(self, raw_protocol_name: str, version: Optional[str] = None) -> str:
        """Get standardized risk protocol name for a given raw risk protocol.

        Parameters
        ----------
        raw_protocol_name
            Raw risk protocol
        version
            Version of the mapping to use; if None, then use the latest version.

        Returns
        -------
        Standardized risk protocol for the input.

        Raises
        ------
        KeyError
            If raw_protocol_name does not exist in the mapping (case sensitive!)

        """
        if version is None:
            # always refresh the latest version if no version is provided
            self._latest_version = self.get_latest_version()
            version = self._latest_version
        mapping = self.get_mapping(version)
        return mapping[raw_protocol_name]

    def get_latest_version(self) -> str:
        """Get the latest versionId of the mapping as the version.

        This is useful for people if they want to store the VersionId with the
        model. Also updates self._latest_version

        Returns
        -------
        The versionId of the latest version of the mapping.

        """
        resp = self._client.get_object(Bucket=self._s3_bucket_name, Key=self._s3_object_key)
        version_id = resp["VersionId"]
        self._latest_version = version_id
        return version_id

    def get_latest_mapping(self) -> Dict[str, str]:
        """Get the latest mapping."""
        return self.get_mapping(self.get_latest_version())

    def _retrieve_s3_file(self, version: str) -> dict:
        """Read the content of the mapping file on S3.

        Parameters
        ----------
        version
            VersionId of the object.

        Returns
        -------
        Response of the client's get_object() method.

        """
        options = {
            "Bucket": self._s3_bucket_name,
            "Key": self._s3_object_key,
            "VersionId": version,
        }

        return self._client.get_object(**options)
