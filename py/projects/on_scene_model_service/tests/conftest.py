# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import os
from typing import Generator
from unittest.mock import MagicMock

import boto3
import botocore
import numpy as np
import pytest
from moto import mock_s3
from on_scene.model import OnSceneModel
from on_scene.user_lookup import User
from sklearn.pipeline import Pipeline
from xgboost.sklearn import XGBRegressor


APP_POSITION = "Advanced Practice Provider"
DHMT_POSITION = "DHMT"


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


@pytest.fixture
def service_config_json():
    return {
        "factual_model_version": "v1.0",
        "shadow_model_versions": ["v1.1"],
    }


@pytest.fixture
def model_config_json():
    config_json = {
        "model_name": "ON_SCENE",
        "model_version": "some_version",
        "description": "some description",
        "prediction_adjustment": 0,
        "minimum_on_scene_time": 5,
    }
    return config_json


@pytest.fixture
def xgb_model():
    def wrapper(x):
        return np.sqrt(np.max(x, axis=1))

    model = MagicMock(spec=XGBRegressor)
    model.predict = MagicMock(wraps=wrapper)

    return model


@pytest.fixture
def os_model(xgb_model):
    transformer = MagicMock(spec=Pipeline)
    transformer.transform = MagicMock(return_value=np.random.uniform(size=(1, 7)))

    os_model = OnSceneModel(
        model=xgb_model,
        version="test",
        transformer=transformer,
        logger=logging.getLogger(),
    )
    return os_model


@pytest.fixture
def users_dict():
    users = {}
    users[19] = User(user_id=19, position=APP_POSITION, prov_score=float("-1.6424e-01"))
    users[20] = User(user_id=20, position=DHMT_POSITION, prov_score=float("-2.5651e-01"))
    return users
