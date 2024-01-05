# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from textwrap import dedent
from typing import Generator
from urllib.parse import urlparse

import boto3
import botocore
import numpy as np
import pandas as pd
import pytest
from model_utils.model_config import MODEL_REGISTRY_HOME
from moto import mock_s3
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score  # noqa: F401
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler
from telep.config.enums import ModelName
from xgboost.sklearn import XGBClassifier


# for risk protocol mapping
RISK_PROTOCOL_BUCKET_NAME = "prd.risk-protocol-names"
RISK_PROTOCOL_OBJECT_KEY = "seed__protocol_names.csv"


@pytest.fixture()
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture()
def s3(aws_credentials) -> Generator[botocore.client.BaseClient, None, None]:
    with mock_s3():
        yield boto3.client("s3")


@pytest.fixture()
def test_bucket():
    parsed = urlparse(MODEL_REGISTRY_HOME)
    return parsed.netloc


@pytest.fixture()
def sample_size():
    return 10000


@pytest.fixture()
def rng():
    return np.random.default_rng(seed=1000)


@pytest.fixture()
def raw_features(rng, sample_size):
    """Mock training features"""
    data = {}
    # here we mock a few possible values of final risk protocol keywords
    data["protocol_keyword"] = rng.choice(
        [
            "head injury",
            "abdominal",
            "seizure",
            "confus",
            "nausea",
        ],
        size=sample_size,
    )
    data["patient_age"] = rng.triangular(0, 40, 100, size=sample_size).astype("int")
    data["risk_score"] = rng.uniform(0, 55, size=sample_size)
    data["place_of_service"] = rng.choice(["A", "B", "C", "D"], size=sample_size)
    data["market_short_name"] = rng.choice(["DEN", "PHX", "LAX", "ORD"])
    data["month"] = rng.choice(range(1, 13), size=sample_size)
    data["patient_gender"] = rng.choice([1, 2, 3], p=[0.49, 0.49, 0.02], size=sample_size)
    data["notes"] = np.repeat("some notes", sample_size)

    return pd.DataFrame(data=data)


@pytest.fixture()
def x_train(raw_features, column_transformer):
    return column_transformer.fit_transform(raw_features)


@pytest.fixture()
def training_labels(rng, sample_size):
    prevalences = {
        ModelName.IV: 0.057,
        ModelName.CATHETER: 0.018,
        ModelName.RX_ADMIN: 0.170,
    }
    labels = {}
    for model in prevalences.keys():
        prev = prevalences[model]
        labels[model] = rng.choice([0, 1], size=sample_size, p=[1 - prev, prev])

    return labels


@pytest.fixture()
def column_transformer():
    trans = [
        ("protocol", OneHotEncoder(handle_unknown="ignore"), ["protocol_keyword"]),
        (
            "age",
            Pipeline([("impute", SimpleImputer()), ("scaler", StandardScaler())]),
            ["patient_age"],
        ),
        (
            "risk_score",
            Pipeline([("impute", SimpleImputer()), ("scaler", StandardScaler())]),
            ["risk_score"],
        ),
        ("pos", OneHotEncoder(handle_unknown="ignore"), ["place_of_service"]),
        ("market", OneHotEncoder(handle_unknown="ignore"), ["market_short_name"]),
        ("month", StandardScaler(), ["month"]),
        ("gender", OneHotEncoder(handle_unknown="ignore"), ["patient_gender"]),
    ]
    return ColumnTransformer(trans, verbose_feature_names_out=False)


@pytest.fixture()
def toy_models(x_train, training_labels):
    """Train some toy XGBoost models."""
    models = {}
    for model_name, y_train in training_labels.items():
        model = XGBClassifier(n_estimators=50, random_state=10, objective="binary:logistic")
        model.fit(x_train, y_train, eval_set=[(x_train, y_train)])
        models[model_name] = model

    # also add a model with no eval_set
    model = XGBClassifier(n_estimators=50, random_state=10, objective="binary:logistic")
    model.fit(x_train, y_train)
    models["no-evals"] = model

    # also add a model with two eval metrics
    model = XGBClassifier(
        n_estimators=50,
        random_state=10,
        objective="binary:logistic",
        eval_metric=["logloss", "auc"],
    )
    model.fit(
        x_train,
        y_train,
        eval_set=[(x_train, y_train)],
    )
    models["two-evals"] = model

    # add a model with unsupported eval metrics by telep_model
    model = XGBClassifier(n_estimators=50, random_state=10, objective="binary:logistic", eval_metric="auc")
    model.fit(
        x_train,
        y_train,
        eval_set=[(x_train, y_train)],
    )
    models["bad-evals"] = model

    return models


@pytest.fixture()
def descriptions(toy_models):
    """Model descriptions"""
    desc = {}
    for model_name in toy_models.keys():
        if isinstance(model_name, ModelName):
            desc[model_name] = f"{model_name.name} model for unit tests."
        else:
            desc[model_name] = f"{model_name} model for unit tests."
    return desc


# some fixtures for risk protocol mapping
@pytest.fixture()
def sample_csv() -> str:
    return dedent(
        """\
    protocol_name,protocol_name_standardized,is_dhfu_protocol
    ED to Home (Patient),ED to Home (Patient),False
    (Fix) Chest Pain Placeholder,(Fix) Chest Pain Placeholder,False
    Abdominal Pain,Abdominal Pain / Constipation,False
    Abdominal pain,Abdominal Pain / Constipation,False"""
    )


@pytest.fixture()
def latest_risk_protocol_mapping_version(s3, sample_csv):
    s3.create_bucket(Bucket=RISK_PROTOCOL_BUCKET_NAME)
    s3.put_bucket_versioning(Bucket=RISK_PROTOCOL_BUCKET_NAME, VersioningConfiguration={"Status": "Enabled"})
    s3.put_object(Bucket=RISK_PROTOCOL_BUCKET_NAME, Key=RISK_PROTOCOL_OBJECT_KEY, Body=sample_csv)
    resp = s3.list_object_versions(Bucket=RISK_PROTOCOL_BUCKET_NAME, Prefix=RISK_PROTOCOL_OBJECT_KEY)
    for row in resp["Versions"]:
        if row["IsLatest"]:
            return row["VersionId"]
