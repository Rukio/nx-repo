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
from model_utils.enums import BaseModelName
from moto import mock_s3
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler
from xgboost.sklearn import XGBClassifier
from xgboost.sklearn import XGBRegressor

XGB_MODEL_FILENAME = "model.json"
X_TRAIN_FILENAME = "trainX.npy"
Y_TRAIN_FILENAME = "trainY.npy"
X_TEST_FILENAME = "testX.npy"
Y_TEST_FILENAME = "testY.npy"
TRANSFORMER_FILENAME = "transformer.pkl"
TOY_MODEL_OBJECTIVE = "binary:logistic"
TOY_REG_MODEL_OBJECTIVE = "reg:linear"


@pytest.fixture(scope="package")
def mock_model_name():
    class _MockModelName(BaseModelName):
        IV = "IV"
        CATHETER = "CATHETER"
        RX_ADMIN = "RX_ADMIN"
        ON_SCENE = "ON_SCENE"  # a regression model

    return _MockModelName


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
def sample_size():
    return 10000


@pytest.fixture(scope="package")
def test_version():
    return "test-version"


@pytest.fixture(scope="package")
def rng():
    return np.random.default_rng(seed=1000)


@pytest.fixture(scope="package")
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

    return pd.DataFrame(data=data)


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
def x_train(raw_features, column_transformer):
    return column_transformer.fit_transform(raw_features)


@pytest.fixture(scope="package")
def x_train_bad(x_train):
    x = deepcopy(x_train)
    return x[0:-1, :]


@pytest.fixture(scope="package")
def training_labels(rng, sample_size, mock_model_name):
    prevalences = {
        mock_model_name.IV: 0.057,
        mock_model_name.CATHETER: 0.018,
        mock_model_name.RX_ADMIN: 0.170,
    }
    labels = {}
    for model in prevalences.keys():
        prev = prevalences[model]
        labels[model] = rng.choice([0, 1], size=sample_size, p=[1 - prev, prev])

    # add regression labels
    labels[mock_model_name.ON_SCENE] = rng.uniform(0, 10, size=sample_size)

    return labels


@pytest.fixture(scope="package")
def y_train(training_labels, mock_model_name):
    return training_labels[mock_model_name.IV]


@pytest.fixture(scope="package")
def n_estimators():
    # define number of iterations for mock XGB models
    return 30


@pytest.fixture(scope="package")
def toy_models(x_train, training_labels, n_estimators, mock_model_name):
    """Train some toy XGBoost models."""
    models = {}
    for model_name in [mock_model_name.IV, mock_model_name.CATHETER, mock_model_name.RX_ADMIN]:
        y_train = training_labels[model_name]
        model = XGBClassifier(n_estimators=n_estimators, random_state=10, objective=TOY_MODEL_OBJECTIVE)
        model.fit(x_train, y_train, eval_set=[(x_train, y_train)])
        models[model_name] = model

    # also add a model with no eval_set
    model = XGBClassifier(n_estimators=n_estimators, random_state=10, objective=TOY_MODEL_OBJECTIVE)
    model.fit(x_train, y_train)
    models["no-evals"] = model

    # add a model with multiple eval sets
    model = XGBClassifier(n_estimators=n_estimators, random_state=10, objective=TOY_MODEL_OBJECTIVE)
    model.fit(x_train, y_train, eval_set=[(x_train, y_train), (x_train, y_train)])
    models["two-evals"] = model

    # add a model with unsupported eval metrics by telep_model
    model = XGBClassifier(n_estimators=n_estimators, random_state=10, objective=TOY_MODEL_OBJECTIVE, eval_metric="auc")
    model.fit(
        x_train,
        y_train,
        eval_set=[(x_train, y_train)],
    )
    models["bad-evals"] = model

    # add a regression model
    reg_model = XGBRegressor(
        n_estimators=n_estimators, random_state=10, objective=TOY_REG_MODEL_OBJECTIVE, eval_metric="rmse"
    )
    y_train_reg = training_labels[mock_model_name.ON_SCENE]
    reg_model.fit(x_train, y_train_reg, eval_set=[(x_train, y_train_reg)])
    models[mock_model_name.ON_SCENE] = reg_model

    return models


@pytest.fixture(scope="package")
def descriptions(toy_models):
    """Model descriptions"""
    desc = {}
    for model_name in toy_models.keys():
        if isinstance(model_name, BaseModelName):
            desc[model_name] = f"{model_name.name} model for unit tests."
        else:
            desc[model_name] = f"{model_name} model for unit tests."
    return desc


@pytest.fixture(scope="package")
def latest_risk_protocol_mapping_version():
    return "b5fdc72ea5019ede38e048d39e58b71f"


@pytest.fixture(scope="package")
def test_bucket():
    return "test-ml-model-registry"


@pytest.fixture(scope="package")
def base_market_config_json(tmp_path_factory, mock_model_name):
    tmp_path = tmp_path_factory.mktemp("model-registry")
    _default_market_config_json = {
        "name": "DEFAULT",
        "model_registry_home": tmp_path.as_posix(),
        "model_dirs": {
            mock_model_name.IV: "models/IV/20221229",
            mock_model_name.CATHETER: "models/CATHETER/20221229",
            mock_model_name.RX_ADMIN: "models/RX_ADMIN/20221229",
        },
        "ml_rules": {
            mock_model_name.IV: {"operator": "lt", "threshold": 0.6},
            mock_model_name.CATHETER: {"operator": "lt", "threshold": 0.8},
            mock_model_name.RX_ADMIN: {"operator": "lt", "threshold": 0.8},
        },
        "clinical_overrides_risk_protocol": [
            "head_injury",
            "abdominal_pain",
            "bladder_catheter_issue",
            "confusion",
        ],
    }
    return _default_market_config_json


@pytest.fixture(scope="package")
def default_telep_model_config_json(base_market_config_json, model_registry_home):
    config_json = deepcopy(base_market_config_json)
    config_json["model_registry_home"] = model_registry_home
    return config_json


@pytest.fixture(scope="package")
def model_registry_home(
    s3,
    tmp_path_factory,
    base_market_config_json,
    x_train,
    training_labels,
    toy_models,
    column_transformer,
    descriptions,
    latest_risk_protocol_mapping_version,
    test_version,
) -> Generator[str, None, None]:
    """Sets up all model files in a test directory."""
    model_names = list(base_market_config_json["model_dirs"].keys())

    test_bucket = "test-ml-model-registry"
    s3.create_bucket(Bucket=test_bucket)
    model_registry_home = f"s3://{test_bucket}"
    local_tmp_dir = tmp_path_factory.mktemp("model_registry_home")

    for model_name in model_names:
        # create model directories
        model_dir = base_market_config_json["model_dirs"][model_name]
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
def local_config_dir(tmp_path_factory):
    tmp_path = tmp_path_factory.mktemp("local-configs")
    yield tmp_path

    # clean up
    shutil.rmtree(tmp_path)


def prepare_market_config_for_json(config: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare market config for writing to JSON. Mostly converting model name enum to str."""
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
def default_telep_model_config_file(default_telep_model_config_json, local_config_dir):
    # has all three sub-models: IV, CATHETER, RX_ADMIN
    filename = "default-telep-model-config.json"
    market_config_path = local_config_dir / filename
    prepared_config_json = prepare_market_config_for_json(default_telep_model_config_json)
    market_config_path.write_text(json.dumps(prepared_config_json))

    return filename


@pytest.fixture(scope="package")
def risk_protocol_mapping():
    cur_dir = os.path.dirname(os.path.realpath(__file__))
    mapping = {}
    with open(os.path.join(cur_dir, "seed__protocol_names.csv")) as f:
        reader = csv.reader(f)
        header = False
        for row in reader:
            if not header:
                header = True
            else:
                mapping[row[0]] = row[1]

    return mapping


@pytest.fixture(scope="package")
def raw_features_rp(rng, raw_features, sample_size):
    # raw_features df but with raw risk protocols
    raw_features_rp = deepcopy(raw_features)
    raw_features_rp["risk_protocol"] = rng.choice(
        [
            "Head Injury (Non Covid-19)",
            "Abdominal Pain (Non Covid-19)",
            "Seizure (Non Covid-19)",
            "Confusion (other)",
            "diarrhea",
        ],
        size=sample_size,
    )
    del raw_features_rp["protocol_keyword"]
    return raw_features_rp
