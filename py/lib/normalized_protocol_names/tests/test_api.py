# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from textwrap import dedent

import boto3
import pytest
from moto import mock_s3
from normalized_protocol_names.api import NormalizedProtocolNames


BUCKET_NAME = "prd.risk-protocol-names"
OBJECT_KEY = "seed__protocol_names.csv"


@pytest.fixture()
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture()
def sample_csv_v1() -> str:
    return dedent(
        """\
    protocol_name,protocol_name_standardized,is_dhfu_protocol
    ED to Home (Patient),ED to Home (Patient),False
    (Fix) Chest Pain Placeholder,(Fix) Chest Pain Placeholder,False
    Abdominal Pain,Abdominal Pain / Constipation,False
    Abdominal pain,Abdominal Pain / Constipation,False"""
    )


@pytest.fixture()
def sample_csv_v2() -> str:
    return dedent(
        """\
    protocol_name,protocol_name_standardized,is_dhfu_protocol
    ED to Home (Patient),ED to Home (Patient),False
    (Fix) Chest Pain Placeholder,(Fix) Chest Pain Placeholder,False
    Abdominal Pain,Abdominal Pain / Constipation,False
    Abdominal pain,Abdominal Pain / Constipation,False,
    Back Pain,Back Pain,False"""
    )


@pytest.fixture()
def s3(aws_credentials):
    with mock_s3():
        s3 = boto3.client("s3", region_name="us-east-1")
        yield s3


class TestNormalizedProtocolNames:
    def test_get_mapping(self, s3, sample_csv_v1, sample_csv_v2) -> None:
        s3.create_bucket(Bucket=BUCKET_NAME)
        s3.put_bucket_versioning(Bucket=BUCKET_NAME, VersioningConfiguration={"Status": "Enabled"})
        s3.put_object(Bucket=BUCKET_NAME, Key=OBJECT_KEY, Body=sample_csv_v1)
        version_id_v1 = s3.get_object(Bucket=BUCKET_NAME, Key=OBJECT_KEY)["VersionId"]
        library = NormalizedProtocolNames(s3)

        # v1
        assert len(library.get_mapping(version_id_v1)) == 4

        # v2
        s3.put_object(Bucket=BUCKET_NAME, Key=OBJECT_KEY, Body=sample_csv_v2)
        version_id_v2 = s3.get_object(Bucket=BUCKET_NAME, Key=OBJECT_KEY)["VersionId"]
        assert len(library.get_mapping(version_id_v2)) == 5

        # also test get_latest_mapping
        assert len(library.get_latest_mapping()) == 5

    def test_protocol_name(self, s3, sample_csv_v1, sample_csv_v2) -> None:
        s3.create_bucket(Bucket=BUCKET_NAME)
        s3.put_bucket_versioning(Bucket=BUCKET_NAME, VersioningConfiguration={"Status": "Enabled"})
        s3.put_object(Bucket=BUCKET_NAME, Key=OBJECT_KEY, Body=sample_csv_v1)
        library = NormalizedProtocolNames(s3)
        assert library.std_protocol_name("Abdominal Pain") == "Abdominal Pain / Constipation"
        with pytest.raises(KeyError):
            library.std_protocol_name("Back Pain")

        # put a new version
        s3.put_object(Bucket=BUCKET_NAME, Key=OBJECT_KEY, Body=sample_csv_v2)
        assert library.std_protocol_name("Back Pain") == "Back Pain"
