# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import logging
import os
import pickle
import shutil
from typing import Generator
from unittest.mock import create_autospec
from unittest.mock import MagicMock
from unittest.mock import patch

import grpc
import numpy as np
import pytest
import telep_model_server
from model_utils.reader import StatsigConfigReader
from monitoring.metrics import DataDogMetrics
from statsig import statsig
from telep.config.enums import ModelName

from proto.common import date_pb2 as date_proto
from proto.common import demographic_pb2 as demographic_proto
from proto.ml_models.telep import service_pb2 as telep_proto


XGB_MODEL_FILENAME = "model.json"
X_TRAIN_FILENAME = "trainX.npy"
Y_TRAIN_FILENAME = "trainY.npy"
X_TEST_FILENAME = "testX.npy"
Y_TEST_FILENAME = "testY.npy"
TRANSFORMER_FILENAME = "transformer.pkl"


_DEFAULT_TELEP_MODEL_CONFIG_JSON = {
    "name": "DEFAULT",
    "model_registry_home": "",
    "model_dirs": {
        "IV": "models/IV/20221229",
        "CATHETER": "models/CATHETER/20221229",
        "RX_ADMIN": "models/RX_ADMIN/20221229",
    },
    "ml_rules": {
        "IV": {"operator": "lt", "threshold": 0.6},
        "CATHETER": {"operator": "lt", "threshold": 0.8},
        "RX_ADMIN": {"operator": "le", "threshold": 0.8},
    },
    "clinical_overrides_risk_protocol": [
        "head_injury",
        "abdominal_pain",
        "bladder_catheter_issue",
        "confusion",
    ],
}

_ENHANCED_TELEP_MODEL_CONFIG_JSON = {
    "name": "PHX",
    "model_registry_home": "",
    "model_dirs": {
        "IV": "models/IV/20221229",
        "CATHETER": "models/CATHETER/20221229",
        "RX_ADMIN": "models/RX_ADMIN/20221229",
    },
    "ml_rules": {
        "IV": {"operator": "lt", "threshold": 0.2},
        "CATHETER": {"operator": "lt", "threshold": 0.2},
        "RX_ADMIN": {"operator": "le", "threshold": 0.2},
    },
    "clinical_overrides_risk_protocol": [
        "head_injury",
        "abdominal_pain",
        "bladder_catheter_issue",
        "confusion",
    ],
}

# initialize statsig with a dummy key; we will mock statsig calls later
statsig.initialize("secret-key")

# some mocked constants
STATSD_HOST = "statsd_host"
STATSD_PORT = 10000
STATSD_APP_NAME = "statsd_app"


@pytest.fixture()
def model_registry_home(
    s3,
    tmp_path_factory,
    test_bucket,
    x_train,
    training_labels,
    toy_models,
    column_transformer,
    descriptions,
    latest_risk_protocol_mapping_version,
) -> Generator[str, None, None]:
    """Sets up all model files in a test directory."""
    model_names_str = list(_DEFAULT_TELEP_MODEL_CONFIG_JSON["model_dirs"].keys())

    s3.create_bucket(Bucket=test_bucket)
    s3.put_bucket_versioning(Bucket=test_bucket, VersioningConfiguration={"Status": "Enabled"})
    model_registry_home = f"s3://{test_bucket}"
    local_tmp_dir = tmp_path_factory.mktemp("model_registry_home")

    for model_name_str in model_names_str:
        # get model_name enum
        model_name = getattr(ModelName, model_name_str)

        # create model directories
        model_dir = _DEFAULT_TELEP_MODEL_CONFIG_JSON["model_dirs"][model_name_str]
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
            "version": "20221229",
        }
        metadata_path = os.path.join(model_dir, "metadata.json")
        local_metadata_path = local_tmp_dir / "metadata.json"
        local_metadata_path.write_text(json.dumps(metadata))
        s3.upload_file(local_metadata_path, test_bucket, metadata_path)

    yield model_registry_home

    # clean up
    shutil.rmtree(local_tmp_dir)


def read_config(config_name):
    default_config_name_v1 = "default-telep-model-config"
    enhanced_config_name_v1 = "enhanced_telep-model-config"
    default_config_name_v2 = "hybrid-model-config-basic-v1p0"
    enhanced_config_name_v2 = "hybrid-model-config-enhanced-v1p0"
    if config_name == telep_model_server.SERVICE_CONFIG_NAME_V2:
        return {"factual": {"default": "basic-v1.0", "market_overrides": {"phx": "enhanced-v1.0"}}}
    elif config_name == telep_model_server.SERVICE_CONFIG_NAME_V1:
        return {"DEFAULT": default_config_name_v1, "PHX": enhanced_config_name_v1}
    elif config_name in (default_config_name_v1, default_config_name_v2):
        return _DEFAULT_TELEP_MODEL_CONFIG_JSON
    elif config_name in (enhanced_config_name_v1, enhanced_config_name_v2):
        return _ENHANCED_TELEP_MODEL_CONFIG_JSON
    else:
        return {}


@pytest.mark.asyncio
async def test_get_telep_valid_request_v1(model_registry_home, s3):
    """Test server with V1 service config."""
    with patch.object(statsig, "check_gate", return_value=False):
        # mock config reader
        config_reader = MagicMock(spec=StatsigConfigReader)

        # create a wrapper function
        def _read_config(config_name):
            config = read_config(config_name)

            # update model_registry_home if it's a Telep model config, not a service config
            if "model_registry_home" in config.keys():
                config["model_registry_home"] = model_registry_home

            return config

        config_reader.read = MagicMock(wraps=_read_config)

        # mock DataDogMetrics
        statsd = MagicMock(spec=DataDogMetrics)
        statsd.create_child_client = MagicMock(return_value=DataDogMetrics(STATSD_HOST, STATSD_PORT, STATSD_APP_NAME))

        service = telep_model_server.TelepService(
            logger=logging.getLogger(),
            statsd=statsd,
            config_reader=config_reader,
            s3=s3,
        )
        params1 = {
            "risk_protocol": "risky",
            "patient_age": 32,
            "risk_score": 0.2,
            "place_of_service": "",
            "market_name": "XYZ",
            "timestamp": date_proto.DateTime(),
            "gender": demographic_proto.Sex.SEX_MALE,
        }
        telep_request1 = telep_proto.GetEligibilityRequest(**params1)
        expected_eligibility1 = True
        expected_model_version1 = read_config(telep_model_server.SERVICE_CONFIG_NAME_V1)["DEFAULT"]
        expected_telep_response1 = telep_proto.GetEligibilityResponse(
            eligible=expected_eligibility1, model_version=expected_model_version1
        )
        mock_context1 = create_autospec(spec=grpc.aio.ServicerContext)
        response1 = await service.GetEligibility(telep_request1, mock_context1)
        assert response1 == expected_telep_response1

        # try one request that should be ruled out by clinical override
        params2 = {
            "risk_protocol": "Head Injury",
            "patient_age": 1,
            "risk_score": 0.2,
            "place_of_service": "",
            "market_name": "DEN",
            "timestamp": date_proto.DateTime(),
            "gender": demographic_proto.Sex.SEX_MALE,
        }
        telep_request2 = telep_proto.GetEligibilityRequest(**params2)
        expected_eligibility2 = False
        expected_model_version2 = read_config(telep_model_server.SERVICE_CONFIG_NAME_V1)["DEFAULT"]
        expected_telep_response2 = telep_proto.GetEligibilityResponse(
            eligible=expected_eligibility2, model_version=expected_model_version2
        )
        mock_context2 = create_autospec(spec=grpc.aio.ServicerContext)
        response2 = await service.GetEligibility(telep_request2, mock_context2)
        assert response2 == expected_telep_response2


@pytest.mark.asyncio
async def test_get_telep_valid_request_v2(model_registry_home, s3):
    """Test server with V2 service config."""
    with patch.object(statsig, "check_gate", return_value=True):
        # mock config reader
        config_reader = MagicMock(spec=StatsigConfigReader)

        # create a wrapper function
        def _read_config(config_name):
            config = read_config(config_name)

            # update model_registry_home if it's a Telep model config, not a service config
            if "model_registry_home" in config.keys():
                config["model_registry_home"] = model_registry_home

            return config

        config_reader.read = MagicMock(wraps=_read_config)

        # mock DataDogMetrics
        statsd = MagicMock(spec=DataDogMetrics)
        statsd.create_child_client = MagicMock(return_value=DataDogMetrics(STATSD_HOST, STATSD_PORT, STATSD_APP_NAME))

        service = telep_model_server.TelepService(
            logger=logging.getLogger(),
            statsd=statsd,
            config_reader=config_reader,
            s3=s3,
        )
        params1 = {
            "risk_protocol": "risky",
            "patient_age": 32,
            "risk_score": 0.2,
            "place_of_service": "",
            "market_name": "XYZ",
            "timestamp": date_proto.DateTime(),
            "gender": demographic_proto.Sex.SEX_MALE,
        }
        telep_request1 = telep_proto.GetEligibilityRequest(**params1)
        expected_eligibility1 = True
        expected_model_version1 = read_config(telep_model_server.SERVICE_CONFIG_NAME_V2)["factual"]["default"]
        expected_telep_response1 = telep_proto.GetEligibilityResponse(
            eligible=expected_eligibility1, model_version=expected_model_version1
        )
        mock_context1 = create_autospec(spec=grpc.aio.ServicerContext)
        response1 = await service.GetEligibility(telep_request1, mock_context1)
        assert response1 == expected_telep_response1

        # try one request that should be ruled out by clinical override
        params2 = {
            "risk_protocol": "Head Injury",
            "patient_age": 1,
            "risk_score": 0.2,
            "place_of_service": "",
            "market_name": "DEN",
            "timestamp": date_proto.DateTime(),
            "gender": demographic_proto.Sex.SEX_MALE,
        }
        telep_request2 = telep_proto.GetEligibilityRequest(**params2)
        expected_eligibility2 = False
        expected_model_version2 = read_config(telep_model_server.SERVICE_CONFIG_NAME_V2)["factual"]["default"]
        expected_telep_response2 = telep_proto.GetEligibilityResponse(
            eligible=expected_eligibility2, model_version=expected_model_version2
        )
        mock_context2 = create_autospec(spec=grpc.aio.ServicerContext)
        response2 = await service.GetEligibility(telep_request2, mock_context2)
        assert response2 == expected_telep_response2
