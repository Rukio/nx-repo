# -*- coding: utf-8 -*-
from __future__ import annotations

import datetime
import hashlib
import logging
import os
from unittest.mock import MagicMock

import boto3
import botocore
import numpy as np
import pytest
from beartype.typing import Generator
from feature_store.query import QueryFeatureStore
from model_utils.model_config import ModelConfig
from model_utils.reader import StatsigConfigReader
from monitoring.metrics import DataDogMetrics
from moto import mock_s3
from on_scene.core import DBLookup
from on_scene.features import Featurizer
from on_scene.generated.db.models import MlPrediction
from on_scene.generated.db.on_scene_ml_prediction_queries import ADD_NEW_PREDICTION
from on_scene.generated.db.on_scene_ml_prediction_queries import Querier
from on_scene.user_lookup import User
from on_scene.user_lookup import UserLookup
from sklearn.pipeline import Pipeline
from sqlalchemy.engine import Connection
from xgboost.sklearn import XGBRegressor

from proto.common.date_pb2 import Date
from proto.ml_models.on_scene.service_pb2 import GetOnSceneTimeRequest
from proto.ml_models.on_scene.service_pb2 import ShiftTeam


# have to define this because SonarCloud is barking at me
CONTENT_TYPE = "application/json"
OBJECTIVE = "reg:squarederror"
EVAL_METRIC = "rmse"
N_ESTIMATORS = 30
APP_POSITION = "Advanced Practice Provider"
DHMT_POSITION = "DHMT"
ON_SCENE_SERVICE_CONFIG_NAME = "on_scene_model_service"


@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture
def s3(aws_credentials) -> Generator[botocore.client.BaseClient, None, None]:
    with mock_s3():
        yield boto3.client("s3")


@pytest.fixture
def app_score():
    return "-1.6424e-01"


@pytest.fixture
def slow_app_score():
    return "1.6424e01"


@pytest.fixture
def dhmt_score():
    return "-2.5651e-01"


@pytest.fixture
def doctor_score():
    return "1.23e01"


@pytest.fixture
def valid_app_user_id():
    return 19


@pytest.fixture
def valid_dhmt_user_id():
    return 20


@pytest.fixture
def valid_doctor_user_id():
    return 21


@pytest.fixture
def valid_slow_app_user_id():
    return 22


@pytest.fixture
def valid_record_app(app_score, valid_app_user_id):
    return {
        "ResponseMetadata": {
            "RequestId": "d8ac6d7d-9682-4dad-939e-b0f0c0270e62",
            "HTTPStatusCode": 200,
            "HTTPHeaders": {
                "x-amzn-requestid": "d8ac6d7d-9682-4dad-939e-b0f0c0270e62",
                "content-type": CONTENT_TYPE,
                "content-length": "553",
                "date": "Wed, 17 May 2023 22:13:55 GMT",
            },
            "RetryAttempts": 0,
        },
        "Record": [
            {"FeatureName": "shift_team_id", "ValueAsString": "146829"},
            {"FeatureName": "user_id", "ValueAsString": str(valid_app_user_id)},
            {"FeatureName": "first_name", "ValueAsString": "First"},
            {"FeatureName": "last_name", "ValueAsString": "Last"},
            {"FeatureName": "position", "ValueAsString": APP_POSITION},
            {"FeatureName": "prov_score", "ValueAsString": app_score},
            {"FeatureName": "shift_start_time", "ValueAsString": "1663164000"},
            {"FeatureName": "shift_end_time", "ValueAsString": "1663200000"},
            {"FeatureName": "event_time", "ValueAsString": "1684280181"},
        ],
    }


@pytest.fixture
def valid_record_slow_app(slow_app_score, valid_slow_app_user_id):
    """Record of a particularly slow APP."""
    return {
        "ResponseMetadata": {
            "RequestId": "d8ac6d7d-9682-4dad-939e-b0f0c0270e62",
            "HTTPStatusCode": 200,
            "HTTPHeaders": {
                "x-amzn-requestid": "d8ac6d7d-9682-4dad-939e-b0f0c0270e62",
                "content-type": CONTENT_TYPE,
                "content-length": "553",
                "date": "Wed, 17 May 2023 22:13:55 GMT",
            },
            "RetryAttempts": 0,
        },
        "Record": [
            {"FeatureName": "shift_team_id", "ValueAsString": "146830"},
            {"FeatureName": "user_id", "ValueAsString": str(valid_slow_app_user_id)},
            {"FeatureName": "first_name", "ValueAsString": "First"},
            {"FeatureName": "last_name", "ValueAsString": "Last"},
            {"FeatureName": "position", "ValueAsString": APP_POSITION},
            {"FeatureName": "prov_score", "ValueAsString": slow_app_score},
            {"FeatureName": "shift_start_time", "ValueAsString": "1663164000"},
            {"FeatureName": "shift_end_time", "ValueAsString": "1663200000"},
            {"FeatureName": "event_time", "ValueAsString": "1684280181"},
        ],
    }


@pytest.fixture
def valid_record_dhmt(dhmt_score, valid_dhmt_user_id):
    return {
        "ResponseMetadata": {
            "RequestId": "36cc3fb6-853f-4724-afba-9cbc77176916",
            "HTTPStatusCode": 200,
            "HTTPHeaders": {
                "x-amzn-requestid": "36cc3fb6-853f-4724-afba-9cbc77176916",
                "content-type": CONTENT_TYPE,
                "content-length": "542",
                "date": "Wed, 17 May 2023 23:29:04 GMT",
            },
            "RetryAttempts": 0,
        },
        "Record": [
            {"FeatureName": "shift_team_id", "ValueAsString": "193551"},
            {"FeatureName": "user_id", "ValueAsString": str(valid_dhmt_user_id)},
            {"FeatureName": "first_name", "ValueAsString": "First"},
            {"FeatureName": "last_name", "ValueAsString": "Last"},
            {"FeatureName": "position", "ValueAsString": DHMT_POSITION},
            {"FeatureName": "prov_score", "ValueAsString": dhmt_score},
            {"FeatureName": "shift_start_time", "ValueAsString": "1684594800"},
            {"FeatureName": "shift_end_time", "ValueAsString": "1684627200"},
            {"FeatureName": "event_time", "ValueAsString": "1684280181"},
        ],
    }


@pytest.fixture
def valid_record_doctor(doctor_score, valid_doctor_user_id):
    """To test a position other than APP or DHMT."""
    return {
        "ResponseMetadata": {
            "RequestId": "36cc3fb6-853f-4724-afba-9cbc77176916",
            "HTTPStatusCode": 200,
            "HTTPHeaders": {
                "x-amzn-requestid": "36cc3fb6-853f-4724-afba-9cbc77176916",
                "content-type": CONTENT_TYPE,
                "content-length": "542",
                "date": "Wed, 17 May 2023 23:29:04 GMT",
            },
            "RetryAttempts": 0,
        },
        "Record": [
            {"FeatureName": "shift_team_id", "ValueAsString": "1935"},
            {"FeatureName": "user_id", "ValueAsString": str(valid_doctor_user_id)},
            {"FeatureName": "first_name", "ValueAsString": "First"},
            {"FeatureName": "last_name", "ValueAsString": "Last"},
            {"FeatureName": "position", "ValueAsString": "Doctor"},
            {"FeatureName": "prov_score", "ValueAsString": doctor_score},
            {"FeatureName": "shift_start_time", "ValueAsString": "1684594800"},
            {"FeatureName": "shift_end_time", "ValueAsString": "1684627200"},
            {"FeatureName": "event_time", "ValueAsString": "1684280181"},
        ],
    }


@pytest.fixture
def invalid_record():
    return {
        "ResponseMetadata": {
            "RequestId": "cd1e0a78-b4dc-4565-b71f-f8f944aac13b",
            "HTTPStatusCode": 200,
            "HTTPHeaders": {
                "x-amzn-requestid": "cd1e0a78-b4dc-4565-b71f-f8f944aac13b",
                "content-type": CONTENT_TYPE,
                "content-length": "32",
                "date": "Wed, 17 May 2023 22:13:18 GMT",
            },
            "RetryAttempts": 0,
        }
    }


@pytest.fixture
def user_lookup(
    valid_record_app,
    valid_record_dhmt,
    valid_record_doctor,
    valid_record_slow_app,
    invalid_record,
    valid_app_user_id,
    valid_dhmt_user_id,
    valid_doctor_user_id,
    valid_slow_app_user_id,
    logger,
):
    def wrapper(user_id):
        """Wrapper to return valid record if user_id == 19"""
        if str(user_id) == str(valid_app_user_id):
            return valid_record_app
        if str(user_id) == str(valid_dhmt_user_id):
            return valid_record_dhmt
        if str(user_id) == str(valid_doctor_user_id):
            return valid_record_doctor
        if str(user_id) == str(valid_slow_app_user_id):
            return valid_record_slow_app
        return invalid_record

    def wrapper_batch(user_ids):
        records = {"Records": []}
        for id_ in user_ids:
            record = wrapper(id_)
            if record != invalid_record:
                records["Records"].append(record)
        return records

    querier = MagicMock(spec=QueryFeatureStore)
    querier.get_record = MagicMock(wraps=wrapper)
    querier.get_features_records = MagicMock(wraps=wrapper_batch)

    user_lookup = UserLookup(querier=querier, logger=logger)
    return user_lookup


@pytest.fixture
def featurizer(user_lookup, statsd):
    return Featurizer(user_lookup=user_lookup, logger=MagicMock(spec=logging.Logger), statsd=statsd)


@pytest.fixture
def shift_teams(valid_app_user_id, valid_dhmt_user_id, valid_doctor_user_id, valid_slow_app_user_id):
    teams = []
    teams.append(ShiftTeam(id=1, member_ids=[valid_app_user_id, valid_dhmt_user_id]))
    teams.append(ShiftTeam(id=2, member_ids=[1, 2]))
    teams.append(ShiftTeam(id=3, member_ids=[valid_app_user_id, 2]))
    teams.append(ShiftTeam(id=4, member_ids=[1, valid_dhmt_user_id]))
    teams.append(ShiftTeam(id=5, member_ids=[valid_dhmt_user_id, valid_doctor_user_id]))
    teams.append(ShiftTeam(id=6, member_ids=[valid_dhmt_user_id, valid_slow_app_user_id]))
    return {st.id: st for st in teams}


@pytest.fixture
def users_dict(
    valid_app_user_id,
    valid_dhmt_user_id,
    valid_doctor_user_id,
    valid_slow_app_user_id,
    app_score,
    dhmt_score,
    slow_app_score,
    doctor_score,
):
    users = {}
    users[valid_app_user_id] = User(user_id=valid_app_user_id, position=APP_POSITION, prov_score=float(app_score))
    users[valid_dhmt_user_id] = User(user_id=valid_dhmt_user_id, position=DHMT_POSITION, prov_score=float(dhmt_score))
    users[valid_doctor_user_id] = User(
        user_id=valid_doctor_user_id, position="Virtual Doctor", prov_score=float(doctor_score)
    )
    users[valid_slow_app_user_id] = User(
        user_id=valid_slow_app_user_id, position=APP_POSITION, prov_score=float(slow_app_score)
    )
    return users


@pytest.fixture
def test_request(shift_teams):
    request = GetOnSceneTimeRequest(
        care_request_id=12345,
        protocol_name="Head Injury",
        service_line="Acute",
        place_of_service="Home",
        num_crs=1,
        patient_dob=Date(year=1991, month=3, day=11),
        risk_assessment_score=1.0,
        shift_teams=list(shift_teams.values()),
    )
    return request


@pytest.fixture
def bad_request_no_shift_team():
    request = GetOnSceneTimeRequest(
        care_request_id=12345,
        protocol_name="Head Injury",
        service_line="Acute",
        place_of_service="Home",
        num_crs=1,
        patient_dob=Date(year=1991, month=3, day=11),
        risk_assessment_score=1.0,
        shift_teams=[],
    )
    return request


@pytest.fixture
def logger():
    logger = MagicMock(spec=logging.Logger)
    logger.getChild = MagicMock(return_value=logger)
    return logger


@pytest.fixture
def statsd():
    client = MagicMock(spec=DataDogMetrics)
    client.create_child_client = MagicMock(return_value=client)
    return client


@pytest.fixture
def service_config_json():
    return {
        "factual_model_version": "v1.0",
        "shadow_model_versions": ["v1.1"],
    }


@pytest.fixture
def service_config_json_w_adjustment():
    return {
        "factual_model_version": "v1.2",
        "shadow_model_versions": ["v1.1"],
    }


@pytest.fixture
def model_config_json_v1p0():
    config_json = {
        "model_name": "ON_SCENE",
        "model_version": "v1.0",
        "description": "some description",
        "prediction_adjustment": 0,
        "minimum_on_scene_time": 5,
    }
    return config_json


@pytest.fixture
def model_config_json_v1p1(model_config_json_v1p0):
    return model_config_json_v1p0


@pytest.fixture
def model_config_json_v1p2():
    config_json = {
        "model_name": "ON_SCENE",
        "model_version": "v1.1",
        "description": "some description",
        "prediction_adjustment": 10,
        "minimum_on_scene_time": 5,
    }
    return config_json


@pytest.fixture
def config_reader(
    service_config_json,
    service_config_json_w_adjustment,
    model_config_json_v1p0,
    model_config_json_v1p1,
    model_config_json_v1p2,
):
    reader = MagicMock(spec=StatsigConfigReader)

    def read_config(config_name):
        if config_name == "on_scene_model_service":
            return service_config_json
        elif config_name == "on_scene_model_service_w_adjustment":
            return service_config_json_w_adjustment
        elif config_name == "on_scene_model_v1p0":
            return model_config_json_v1p0
        elif config_name == "on_scene_model_v1p1":
            return model_config_json_v1p1
        elif config_name == "on_scene_model_v1p2":
            return model_config_json_v1p2

        raise ValueError(f"Config name {config_name} not recognized.")

    reader.read = MagicMock(wraps=read_config)
    return reader


@pytest.fixture
def test_set_size():
    return 1000


@pytest.fixture
def x_test(test_set_size, rng):
    return rng.uniform(size=(test_set_size, 7))


@pytest.fixture
def y_test(test_set_size, rng):
    return rng.uniform(np.log(30), np.log(100), size=test_set_size)


@pytest.fixture
def y_test_low(test_set_size, rng):
    return rng.uniform(np.log(1), np.log(5), size=test_set_size)


@pytest.fixture
def xgbmodel_v1p0(x_test, y_test):
    model = XGBRegressor(objective=OBJECTIVE, n_estimators=N_ESTIMATORS)

    model.fit(x_test, y_test, eval_metric=EVAL_METRIC, eval_set=[(x_test, y_test)])

    return model


@pytest.fixture
def xgbmodel_v1p1(x_test, y_test_low):
    """Mock a model that always predicts less than 5 minutes in order to test
    minimum pred time."""
    model = XGBRegressor(objective=OBJECTIVE, n_estimators=N_ESTIMATORS)

    model.fit(x_test, y_test_low, eval_metric=EVAL_METRIC, eval_set=[(x_test, y_test_low)])

    return model


@pytest.fixture
def xgbmodel_v1p2(xgbmodel_v1p0):
    return xgbmodel_v1p0


@pytest.fixture
def column_transformer():
    transformer = MagicMock(spec=Pipeline)

    def transform(df):
        seed = int(round(abs(1000 * df["shift_team_score"].iloc[0])))
        rng = np.random.default_rng(seed=seed)
        return rng.uniform(size=(1, 7))

    transformer.transform = MagicMock(wraps=transform)
    return transformer


@pytest.fixture
def model_config_v1p0(model_config_json_v1p0, xgbmodel_v1p0, column_transformer, x_test, y_test):
    # v1.0 config, v1.1 model that always predicts very low on-scene time
    config = MagicMock(spec=ModelConfig)
    config.model = xgbmodel_v1p0
    config.version = model_config_json_v1p0["model_version"]
    config.column_transformer = column_transformer
    config.test_set = [x_test, y_test]
    return config


@pytest.fixture
def model_config_v1p1(model_config_json_v1p1, xgbmodel_v1p1, column_transformer, x_test, y_test_low):
    # v1.1 config,
    config = MagicMock(spec=ModelConfig)
    config.model = xgbmodel_v1p1
    config.version = model_config_json_v1p1["model_version"]
    config.column_transformer = column_transformer
    config.test_set = [x_test, y_test_low]
    return config


@pytest.fixture
def model_config_v1p2(model_config_json_v1p0, xgbmodel_v1p2, column_transformer, x_test, y_test):
    config = MagicMock(spec=ModelConfig)
    config.model = xgbmodel_v1p2
    config.version = model_config_json_v1p0["model_version"]
    config.column_transformer = column_transformer
    config.test_set = [x_test, y_test]
    return config


@pytest.fixture
def model_metadata(model_config_json_v1p0):
    return {
        "model_name": "ON_SCENE",
        "model_filename": "model.json",
        "model_class": "XGBRegressor",
        "training_set_filenames": ["trainX.npy", "trainY.npy"],
        "test_set_filenames": ["testX.npy", "testY.npy"],
        "column_transformer_filename": "transformer.pkl",
        "risk_protocol_mapping_version": "kmgCeh1LCHk32GnFzRd2Mfc_YfslOc8F",
        "author_email": "anne.morrow@*company-data-covered*.com",
        "version": model_config_json_v1p0["model_version"],
        "description": "V3.0 with minimal features + shift team score and separate preproc pipeline & model.",
    }


@pytest.fixture
def request_id():
    return "abcde"


@pytest.fixture
def random_feature_hash():
    return memoryview(hashlib.sha256("random text".encode("utf-8")).digest())


def conn_execute(query, *args, **kwargs):
    if query.text == ADD_NEW_PREDICTION:
        row = MagicMock()
        row.first = MagicMock(
            return_value=(
                1,
                12345,
                memoryview("abc".encode("utf-8")),
                30,
                datetime.datetime.now(),
                datetime.datetime.now(),
                "test_version",
            )
        )
        return row
    return None


@pytest.fixture
def mock_db_lookup(random_feature_hash):
    conn = MagicMock(spec=Connection)
    conn.execute = MagicMock(wraps=conn_execute)
    querier = Querier(conn)
    querier.lookup_prediction = MagicMock(
        return_value=MlPrediction(
            id=1,
            care_request_id=12345,
            feature_hash=random_feature_hash,
            prediction=30,
            created_at=datetime.datetime(2023, 1, 1),
            last_queried_at=datetime.datetime(2023, 1, 2),
            model_version="test_version",
        )
    )
    querier.update_last_queried = MagicMock(return_value=None)
    db_lookup = DBLookup(querier=querier)

    return db_lookup


@pytest.fixture
def test_feature_hash():
    return memoryview("abcde".encode("utf-8"))
