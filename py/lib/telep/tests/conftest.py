# -*- coding: utf-8 -*-
from __future__ import annotations

import csv
import json
import os
import pickle
import shutil
from copy import deepcopy
from typing import Any
from typing import Dict
from typing import Generator

import boto3
import botocore
import numpy as np
import pandas as pd
import pytest
from model_utils.model_config import ModelConfig
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from moto import mock_s3
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score  # noqa: F401
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler
from statsig import statsig
from statsig import StatsigOptions
from telep.config.enums import ModelName
from telep.service.clinical_overrides import TelepClinicalOverrideMetadata
from xgboost.sklearn import XGBClassifier

from proto.common import date_pb2 as date_proto
from proto.common import demographic_pb2 as demog_proto
from proto.ml_models.telep import service_pb2 as telep_proto


XGB_MODEL_FILENAME = "model.json"
X_TRAIN_FILENAME = "trainX.npy"
Y_TRAIN_FILENAME = "trainY.npy"
X_TEST_FILENAME = "testX.npy"
Y_TEST_FILENAME = "testY.npy"
TRANSFORMER_FILENAME = "transformer.pkl"

statsig.initialize("secret-key", options=StatsigOptions(local_mode=True))


@pytest.fixture(scope="package")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture(scope="package")
def s3(aws_credentials) -> Generator[botocore.client.BaseClient, None, None]:
    with mock_s3():
        yield boto3.client("s3")


@pytest.fixture(scope="package")
def test_bucket():
    return "test-ml-model-registry"


@pytest.fixture(scope="package")
def test_version() -> str:
    return "basic-v1.0"


@pytest.fixture(scope="package")
def latest_risk_protocol_mapping_version():
    return "b5fdc72ea5019ede38e048d39e58b71f"


@pytest.fixture(scope="package")
def _default_telep_model_config_json(tmp_path_factory):
    tmp_path = tmp_path_factory.mktemp("model-registry")
    _default_telep_model_config_json = {
        "name": "DEFAULT",
        "model_registry_home": tmp_path.as_posix(),
        "model_dirs": {
            ModelName.IV: "models/IV/20221229",
            ModelName.CATHETER: "models/CATHETER/20221229",
            ModelName.RX_ADMIN: "models/RX_ADMIN/20221229",
        },
        "ml_rules": {
            ModelName.IV: {"operator": "lt", "threshold": 0.6},
            ModelName.CATHETER: {"operator": "lt", "threshold": 0.8},
            ModelName.RX_ADMIN: {"operator": "lt", "threshold": 0.8},
        },
        "clinical_overrides_risk_protocol": [
            "head_injury",
            "abdominal_pain",
            "bladder_catheter_issue",
            "confusion",
        ],
    }
    return _default_telep_model_config_json


@pytest.fixture(scope="package")
def default_telep_model_config_json(_default_telep_model_config_json, model_registry_home):
    config_json = deepcopy(_default_telep_model_config_json)
    config_json["model_registry_home"] = model_registry_home
    return config_json


@pytest.fixture(scope="package")
def sample_size():
    return 10000


@pytest.fixture(scope="package")
def rng():
    return np.random.default_rng(seed=1000)


@pytest.fixture(scope="package")
def raw_features(rng, sample_size):
    """Mock training features"""
    data = {}
    # here we mock a few possible values of final risk protocol keywords
    data["risk_protocol"] = rng.choice(
        [
            "Head Injury",
            "Abdominal Pain",
            "Seizure",
            "Confusion",
            "Nausea/Vomiting",
        ],
        size=sample_size,
    )
    data["patient_age"] = rng.triangular(0, 40, 100, size=sample_size).astype("int")
    data["risk_score"] = rng.uniform(0, 55, size=sample_size)
    data["place_of_service"] = rng.choice(["A", "B", "C", "D"], size=sample_size)
    data["market_short_name"] = rng.choice(["DEN", "PHX", "LAX", "ORD"])
    data["month"] = rng.choice(range(1, 13), size=sample_size)
    data["patient_gender"] = rng.choice([1, 2, 3], p=[0.49, 0.49, 0.02], size=sample_size)

    return pd.DataFrame(data=data)


@pytest.fixture(scope="package")
def x_train(raw_features, preproc_pipeline):
    return preproc_pipeline.fit_transform(raw_features)


@pytest.fixture(scope="package")
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


@pytest.fixture(scope="package")
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


@pytest.fixture(scope="package")
def preproc_pipeline(column_transformer, risk_protocol_mapping):
    """Get the full preproc pipeline of Telep model."""
    risk_protocol_preprocessor = RiskProtocolPreprocessor(rp_map=risk_protocol_mapping)
    risk_protocol_transformer = FunctionTransformer(risk_protocol_preprocessor.run)
    pipeline = Pipeline(
        steps=[
            (
                "risk_protocol_mapping",
                risk_protocol_transformer,
            ),
            ("column_transformer", column_transformer),
        ]
    )
    return pipeline


@pytest.fixture(scope="package")
def n_estimators():
    return 30


@pytest.fixture(scope="package")
def toy_models(x_train, training_labels, n_estimators):
    """Train some toy XGBoost models."""
    models = {}
    objective = "binary:logistic"
    for model_name, y_train in training_labels.items():
        model = XGBClassifier(n_estimators=n_estimators, random_state=10, objective=objective)
        model.fit(x_train, y_train, eval_set=[(x_train, y_train)])
        models[model_name] = model

    # also add a model with no eval_set
    model = XGBClassifier(n_estimators=n_estimators, random_state=10, objective=objective)
    model.fit(x_train, y_train)
    models["no-evals"] = model

    # add a model with unsupported eval metrics by telep_model
    model = XGBClassifier(n_estimators=n_estimators, random_state=10, objective=objective, eval_metric="auc")
    model.fit(
        x_train,
        y_train,
        eval_set=[(x_train, y_train)],
    )
    models["bad-evals"] = model

    return models


@pytest.fixture(scope="package")
def descriptions(toy_models):
    """Model descriptions"""
    desc = {}
    for model_name in toy_models.keys():
        if isinstance(model_name, ModelName):
            desc[model_name] = f"{model_name.name} model for unit tests."
        else:
            desc[model_name] = f"{model_name} model for unit tests."
    return desc


@pytest.fixture(scope="package")
def model_registry_home(
    s3,
    tmp_path_factory,
    _default_telep_model_config_json,
    x_train,
    training_labels,
    toy_models,
    column_transformer,
    descriptions,
    latest_risk_protocol_mapping_version,
    test_version,
) -> Generator[str, None, None]:
    """Sets up all model files in a test directory."""
    model_names = list(_default_telep_model_config_json["model_dirs"].keys())

    test_bucket = "test-ml-model-registry"
    s3.create_bucket(Bucket=test_bucket)
    model_registry_home = f"s3://{test_bucket}"
    local_tmp_dir = tmp_path_factory.mktemp("model_registry_home")

    for model_name in model_names:
        # create model directories
        model_dir = _default_telep_model_config_json["model_dirs"][model_name]
        print(f"model_dir = {model_dir}")

        # save models
        model_path = os.path.join(model_dir, XGB_MODEL_FILENAME)
        local_model_path = local_tmp_dir / XGB_MODEL_FILENAME
        toy_models[model_name].save_model(local_model_path)
        s3.upload_file(local_model_path, test_bucket, model_path)

        # save training data
        x_train_path = os.path.join(model_dir, X_TRAIN_FILENAME)
        local_x_train_path = local_tmp_dir / X_TRAIN_FILENAME
        with open(local_x_train_path, "wb") as f1:
            np.save(f1, x_train, allow_pickle=True)
        s3.upload_file(local_x_train_path, test_bucket, x_train_path)

        y_train = training_labels[model_name]
        y_train_path = os.path.join(model_dir, Y_TRAIN_FILENAME)
        local_y_train_path = local_tmp_dir / Y_TRAIN_FILENAME
        with open(local_y_train_path, "wb") as f2:
            np.save(f2, y_train, allow_pickle=True)
        s3.upload_file(local_y_train_path, test_bucket, y_train_path)

        # save test set data (duplicate training set)
        x_test_path = os.path.join(model_dir, X_TEST_FILENAME)
        local_x_test_path = local_tmp_dir / X_TEST_FILENAME
        with open(local_x_test_path, "wb") as f3:
            np.save(f3, x_train, allow_pickle=True)
        s3.upload_file(local_x_test_path, test_bucket, x_test_path)

        y_test_path = os.path.join(model_dir, Y_TEST_FILENAME)
        local_y_test_path = local_tmp_dir / Y_TEST_FILENAME
        with open(local_y_test_path, "wb") as f4:
            np.save(f4, y_train, allow_pickle=True)
        s3.upload_file(local_y_test_path, test_bucket, y_test_path)

        # save column transformer
        transformer_path = os.path.join(model_dir, TRANSFORMER_FILENAME)
        local_transformer_path = local_tmp_dir / TRANSFORMER_FILENAME
        with open(local_transformer_path, "wb") as f5:
            pickle.dump(column_transformer, f5)
        s3.upload_file(local_transformer_path, test_bucket, transformer_path)

        # save metadata.json
        metadata = {
            "model_name": model_name.name,
            "model_filename": XGB_MODEL_FILENAME,
            "model_class": "XGBClassifier",
            "training_set_filenames": [X_TRAIN_FILENAME, Y_TRAIN_FILENAME],
            "test_set_filenames": [X_TEST_FILENAME, Y_TEST_FILENAME],
            "column_transformer_filename": TRANSFORMER_FILENAME,
            "risk_protocol_mapping_version": latest_risk_protocol_mapping_version,
            "author_email": "author@*company-data-covered*.com",
            "description": descriptions[model_name],
            "version": test_version,
        }
        metadata_path = os.path.join(model_dir, "metadata.json")
        local_metadata_path = local_tmp_dir / "metadata.json"
        local_metadata_path.write_text(json.dumps(metadata))
        s3.upload_file(local_metadata_path, test_bucket, metadata_path)

    yield model_registry_home

    # clean up
    shutil.rmtree(local_tmp_dir)


@pytest.fixture(scope="package")
def iv_model_config(
    toy_models, x_train, training_labels, column_transformer, latest_risk_protocol_mapping_version, test_version
):
    model_name = ModelName.IV
    config = ModelConfig(
        model_name=model_name,
        model=toy_models[model_name],
        column_transformer=column_transformer,
        training_set=(x_train, training_labels[model_name]),
        test_set=(x_train, training_labels[model_name]),
        risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
        author_email="test@*company-data-covered*.com",
        description="some description",
    )
    return config


@pytest.fixture(scope="package")
def risk_protocol_mapping():
    cur_dir = os.path.dirname(os.path.realpath(__file__))
    mapping = {}
    with open(os.path.join(cur_dir, "../../model_utils/tests/seed__protocol_names.csv")) as f:
        reader = csv.reader(f)
        header = False
        for row in reader:
            if not header:
                header = True
            else:
                mapping[row[0]] = row[1]

    return mapping


@pytest.fixture(scope="package")
def local_config_dir(tmp_path_factory):
    tmp_path = tmp_path_factory.mktemp("local-configs")
    yield tmp_path

    # clean up
    shutil.rmtree(tmp_path)


def prepare_telep_model_config_for_json(config: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare Telep model config for writing to JSON. Mostly converting model name enum to str."""
    new_config = {}
    for key, old_values in config.items():
        if key in ("model_dirs", "ml_rules"):
            new_values = {}
            for model_name_enum in old_values:
                model_name_str = model_name_enum.name
                new_values[model_name_str] = old_values[model_name_enum]
            new_config[key] = new_values
        else:
            new_values = old_values
        new_config[key] = new_values
    return new_config


@pytest.fixture(scope="package")
def default_telep_model_config_file_v1(default_telep_model_config_json, local_config_dir):
    # has all three sub-models: IV, CATHETER, RX_ADMIN
    json_filename = "telep-ml-default-model-config.json"
    telep_model_config_path = local_config_dir / json_filename
    prepared_config_json = prepare_telep_model_config_for_json(default_telep_model_config_json)
    telep_model_config_path.write_text(json.dumps(prepared_config_json))

    return json_filename


@pytest.fixture(scope="package")
def enhanced_telep_model_config_file_v1(default_telep_model_config_json, local_config_dir):
    # has only two sub-models: IV, CATHETER
    json_filename = "enhanced-telep-model-config.json"
    enhanced_telep_model_config_path = local_config_dir / json_filename
    enhanced_telep_model_config_json = deepcopy(default_telep_model_config_json)

    # assume that the enhanced model does not use rx_admin model
    del enhanced_telep_model_config_json["model_dirs"][ModelName.RX_ADMIN]
    del enhanced_telep_model_config_json["ml_rules"][ModelName.RX_ADMIN]

    prepared_config_json = prepare_telep_model_config_for_json(enhanced_telep_model_config_json)
    enhanced_telep_model_config_path.write_text(json.dumps(prepared_config_json))

    return json_filename


@pytest.fixture(scope="package")
def default_telep_model_config_file_v2(default_telep_model_config_json, local_config_dir):
    # has all three sub-models: IV, CATHETER, RX_ADMIN
    json_filename = "hybrid-model-config-basic-v1p0"
    telep_model_config_path = local_config_dir / json_filename
    prepared_config_json = prepare_telep_model_config_for_json(default_telep_model_config_json)
    telep_model_config_path.write_text(json.dumps(prepared_config_json))

    return json_filename


@pytest.fixture(scope="package")
def enhanced_telep_model_config_file_v2(default_telep_model_config_json, local_config_dir):
    # has only two sub-models: IV, CATHETER
    json_filename = "hybrid-model-config-enhanced-v1p0"
    enhanced_telep_model_config_path = local_config_dir / json_filename
    enhanced_telep_model_config_json = deepcopy(default_telep_model_config_json)

    # assume that the enhanced model does not use rx_admin model
    del enhanced_telep_model_config_json["model_dirs"][ModelName.RX_ADMIN]
    del enhanced_telep_model_config_json["ml_rules"][ModelName.RX_ADMIN]

    prepared_config_json = prepare_telep_model_config_for_json(enhanced_telep_model_config_json)
    enhanced_telep_model_config_path.write_text(json.dumps(prepared_config_json))

    return json_filename


@pytest.fixture(scope="package")
def service_config_filename_v1():
    return "telep-ml-service-config-v1.json"


@pytest.fixture(scope="package")
def service_config_file_v1(
    local_config_dir,
    default_telep_model_config_file_v1,
    enhanced_telep_model_config_file_v1,
    service_config_filename_v1,
) -> str:
    service_config_json = {
        "DEFAULT": default_telep_model_config_file_v1,
        "DEN": enhanced_telep_model_config_file_v1,
    }
    service_config_file = local_config_dir / service_config_filename_v1
    service_config_file.write_text(json.dumps(service_config_json))

    return service_config_filename_v1


@pytest.fixture(scope="package")
def service_config_filename_v2():
    return "telep-ml-service-config-v2.json"


@pytest.fixture(scope="package")
def basic_v1():
    return "basic-v1.0"


@pytest.fixture(scope="package")
def enhanced_v1():
    return "enhanced-v1.0"


@pytest.fixture(scope="package")
def service_config_file_v2(
    local_config_dir,
    service_config_filename_v2,
    default_telep_model_config_file_v2,
    enhanced_telep_model_config_file_v2,
    basic_v1,
    enhanced_v1,
) -> str:
    service_config_json = {
        "factual": {
            "default": basic_v1,
            "market_overrides": {
                "phx": enhanced_v1,
            },
        }
    }
    service_config_file = local_config_dir / service_config_filename_v2
    service_config_file.write_text(json.dumps(service_config_json))

    return service_config_filename_v2


@pytest.fixture
def default_proto() -> dict:
    return {
        "risk_protocol": "confusion",
        "patient_age": 30,
        "risk_score": 10,
        "place_of_service": "A",
        "market_name": "DEN",
        "timestamp": date_proto.DateTime(year=2023, month=1, day=3),
        "gender": demog_proto.Sex.SEX_FEMALE,
        "care_request_id": 12345,
        "dispatcher_notes": ["patient needs secondary screening"],
        "secondary_screening_notes": ["patient is safe to see"],
    }


@pytest.fixture
def enhanced_proto(default_proto):
    proto = deepcopy(default_proto)
    proto["market_name"] = "PHX"
    return proto


@pytest.fixture
def default_request(default_proto) -> telep_proto.GetEligibilityRequest:
    return telep_proto.GetEligibilityRequest(**default_proto)


@pytest.fixture
def enhanced_request(enhanced_proto):
    return telep_proto.GetEligibilityRequest(**enhanced_proto)


@pytest.fixture
def test_feature_hash():
    return memoryview("abcde".encode("utf-8"))


@pytest.fixture
def telep_clinical_override_metadata(test_version) -> TelepClinicalOverrideMetadata:
    return TelepClinicalOverrideMetadata(model_version=test_version)
