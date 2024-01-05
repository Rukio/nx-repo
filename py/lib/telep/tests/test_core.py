# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from copy import deepcopy
from unittest.mock import call
from unittest.mock import MagicMock
from unittest.mock import patch

import pandas as pd
import pytest
from model_utils.errors import ConfigReadError
from model_utils.errors import ModelValidationError
from model_utils.errors import ModelValidationWarning
from model_utils.model_config import ModelConfig
from model_utils.reader import LocalConfigReader
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from monitoring.metrics import DataDogMetrics
from normalized_protocol_names.api import NormalizedProtocolNames
from sqlalchemy import Connection
from sqlalchemy.engine import Engine
from statsig import statsig
from telep.config.enums import ModelName
from telep.config.telep_model_config import TelepModelConfig
from telep.generated.db.models import MlPrediction
from telep.generated.db.telep_ml_prediction_queries import Querier
from telep.models.telep_model import TelepModel
from telep.service import errors
from telep.service.core import DBLookup
from telep.service.core import READ_CACHE_FLAG
from telep.service.core import TelepMLServiceV1Handler
from telep.service.core import TelepMLServiceV2Handler
from telep.service.core import TelepModelHandler
from telep.service.core import WRITE_CACHE_FLAG

from proto.ml_models.telep import service_pb2 as telep_proto


@pytest.fixture
def default_telep_model_config(default_telep_model_config_json):
    return TelepModelConfig(**default_telep_model_config_json)


@pytest.fixture
def risk_protocol_preprocessor(risk_protocol_mapping):
    return RiskProtocolPreprocessor(risk_protocol_mapping)


@pytest.fixture
def statsd():
    client = MagicMock(spec=DataDogMetrics)
    client.create_child_client = MagicMock(return_value=MagicMock(spec=DataDogMetrics))
    return client


@pytest.fixture
def normalized_protocol_names(s3):
    s3.create_bucket(Bucket="prd.risk-protocol-names")
    s3.put_object(Bucket="prd.risk-protocol-names", Body="", Key="seed__protocol_names.csv")
    names = NormalizedProtocolNames(s3)
    names.get_mapping = MagicMock(return_value={})
    return names


class TestDBLookup:

    conn = MagicMock(spec=Connection)
    db_lookup = DBLookup(Querier(conn))

    def test_lookup_cached_prediction(self, test_feature_hash):
        with patch.object(self.db_lookup.querier._conn, "execute", create=True):
            self.db_lookup.lookup_cached_prediction(feature_hash=test_feature_hash, request_id="random_id")
            self.db_lookup.querier._conn.execute.assert_called_once()

    def test_update_last_queried(self):
        with patch.object(self.db_lookup.querier._conn, "execute", create=True):
            self.db_lookup.update_last_queried(id=123, request_id="456")
            self.db_lookup.querier._conn.execute.assert_called_once()

    def test_insert_prediction(self, test_feature_hash):
        with patch.object(self.db_lookup.querier._conn, "execute", create=True):
            self.db_lookup.insert_prediction(
                feature_hash=test_feature_hash,
                prediction=True,
                care_request_id=456,
                request_id="random_id",
                model_version="v1",
            )
            self.db_lookup.querier._conn.execute.assert_called_once()


class TestTelepModelHandler:

    flags = {READ_CACHE_FLAG: False, WRITE_CACHE_FLAG: False}
    model_config_name = "default-config"

    @pytest.fixture
    def handler(
        self,
        default_telep_model_config,
        risk_protocol_preprocessor,
        statsd,
        s3,
        normalized_protocol_names,
    ):
        # initialize statsig SDK with a dummy secret key
        statsig.initialize("secret-key")

        return TelepModelHandler(
            telep_model_config=default_telep_model_config,
            risk_protocol_preprocessor=risk_protocol_preprocessor,
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
            pg_engine=MagicMock(spec=Engine),
            model_version=self.model_config_name,
        )

    def test_model_version_property(self, handler):
        assert handler.model_version == handler._model_version

    def mock_check_gate(self, user, gate):
        return self.flags[gate]

    @pytest.fixture
    def model_configs(
        self,
        default_telep_model_config,
        latest_risk_protocol_mapping_version,
        toy_models,
        test_version,
        column_transformer,
        x_train,
        training_labels,
    ):
        output = {}
        for model_name in default_telep_model_config.model_dirs.keys():
            model_config = MagicMock(spec=ModelConfig)
            model_config.risk_protocol_mapping_version = latest_risk_protocol_mapping_version
            model_config.model = toy_models[model_name]
            model_config.version = test_version
            model_config.column_transformer = column_transformer
            model_config.test_set = [x_train, training_labels[model_name]]
            output[model_name] = model_config

        return output

    def test_load_models(self, default_telep_model_config, handler, model_configs, s3):
        def load_model_config_wrapper(model_name, s3=None):
            return model_configs[model_name]

        # test that it calls TelepModelConfig.load_model_config for each model name
        with patch.object(TelepModelConfig, "load_model_config", wraps=load_model_config_wrapper):
            handler.load_models(model_cache={})
            for model_name in default_telep_model_config.model_dirs.keys():
                TelepModelConfig.load_model_config.assert_any_call(model_name, s3=s3)

        # test that it catches ModelValidationWarning
        e1 = ModelValidationWarning()
        with patch.object(TelepModel, "validate", side_effect=e1):
            with patch.object(handler.logger, "warning"):
                handler.load_models(model_cache={})
                for model_name in default_telep_model_config.model_dirs.keys():
                    msg = f"Model validation for {model_name.name} model returned a warning: {e1}"
                    handler.logger.warning.assert_any_call(msg)

        # test that it catches ModelValidatinoError
        with patch.object(TelepModel, "validate", side_effect=ModelValidationError()):
            with pytest.raises(ModelValidationError):
                handler.load_models(model_cache={})

    def test_valid_market_handler(self, default_telep_model_config, handler):
        model_cache = {}

        with patch.object(handler.statsd, "increment") as increment:
            handler.load_models(model_cache=model_cache)
            calls = []
            for model_name in default_telep_model_config.model_dirs:
                calls.append(call("end_load_model", tags=[f"model:{model_name.name}"]))
            increment.assert_has_calls(calls, any_order=True)
            # each model should call increment 3 times
            assert increment.call_count == 3

        assert len(handler.models) == 3
        assert isinstance(handler.models[ModelName.IV], TelepModel)

    def test_run_steps(self, default_telep_model_config, default_request, handler, telep_clinical_override_metadata):
        model_cache = {}
        handler.load_models(model_cache=model_cache)

        with patch.object(handler.statsd, "increment") as increment:
            # preprocessing
            df_preproc = handler._preprocess(default_request)
            assert isinstance(df_preproc, pd.DataFrame)
            assert len(df_preproc.shape) == 2  # must be 2-d array
            assert df_preproc.shape[0] == 1

            # predictions
            model_scores = handler._get_model_scores(df_preproc, default_request)
            pred_calls = []
            for model_name in default_telep_model_config.model_dirs:
                pred_calls.append(
                    call(
                        "end_transform_features",
                        tags=handler.base_tags + [f"market:{default_request.market_name}", f"model:{model_name.name}"],
                    )
                )
                pred_calls.append(
                    call(
                        "end_model_predict",
                        tags=handler.base_tags + [f"market:{default_request.market_name}", f"model:{model_name.name}"],
                    )
                )
                assert model_name in model_scores
                assert model_scores[model_name] >= 0 and model_scores[model_name] <= 1
            increment.assert_has_calls(pred_calls, any_order=True)

            # apply thresholds
            ml_rule_decisions = handler._apply_thresholds(model_scores, default_request)
            assert len(ml_rule_decisions) == 3
            ml_rule_calls = []
            for model_name in default_telep_model_config.model_dirs:
                ml_rule_calls.append(
                    call(
                        "end_apply_threshold",
                        tags=handler.base_tags + [f"market:{default_request.market_name}", f"model:{model_name.name}"],
                    )
                )
            increment.assert_has_calls(ml_rule_calls, any_order=True)

            # combine ML decisions
            ml_decision = handler._combine_ml_decisions(ml_rule_decisions, default_request)
            increment.assert_called_with(
                "end_combine_ml_decisions", tags=handler.base_tags + [f"market:{default_request.market_name}"]
            )
            assert ml_decision is True

            # apply clinical overrides
            clinical_decision = handler._apply_clinical_overrides(default_request, telep_clinical_override_metadata)
            # risk protocol is confusion, so we expect it to be overridden by clinical rules
            assert clinical_decision is False
            override_calls = []
            for rule in default_telep_model_config.clinical_overrides_enums:
                override_calls.append(
                    call(
                        "end_clinical_override",
                        tags=handler.base_tags
                        + [f"market:{default_request.market_name}", f"clinical_rule:{rule.name}"],
                    )
                )
            increment.assert_has_calls(override_calls, any_order=True)

    def test_run(self, default_request, handler):
        dummy_req_id = "some_req_id"
        model_cache = {}
        handler.load_models(model_cache=model_cache)
        result1 = handler.run(default_request, dummy_req_id)
        assert result1 is False

        # test if there is a cache hit
        cached_prediction = MagicMock(spec=MlPrediction)
        cached_prediction.id = 123
        cached_prediction.prediction = result1
        X_df_dict = handler._preprocess(default_request).iloc[0].to_dict()
        with patch.object(DBLookup, "hash_features", return_value=memoryview(bytes("12345".encode("utf-8")))):
            result2 = handler.run(default_request, dummy_req_id)
            assert result2 is False
            DBLookup.hash_features.assert_called_once_with(
                row_input=X_df_dict,
                care_request_id=default_request.care_request_id,
                model_version=handler._model_version,
            )


class TestTelepMLServiceV1Handler:
    def test_valid_service_handler(
        self, local_config_dir, service_config_file_v1, statsd, s3, normalized_protocol_names
    ):
        handler = TelepMLServiceV1Handler(
            service_config_name=service_config_file_v1,
            config_reader=LocalConfigReader(config_dir=local_config_dir),
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )
        assert "DEFAULT" in handler.telep_model_handlers
        assert isinstance(handler.telep_model_handlers["DEFAULT"], TelepModelHandler)
        # this handler should load all three models
        assert handler.telep_model_handlers["DEFAULT"]._loaded_new_models == 3
        assert "DEN" in handler.telep_model_handlers
        assert isinstance(handler.telep_model_handlers["DEN"], TelepModelHandler)
        # this Telep model handler's two models should have already been loaded by the
        # default handler, so it does not load new models
        assert handler.telep_model_handlers["DEN"]._loaded_new_models == 0

    def test_config_read_error(self, service_config_file_v1, statsd, s3, normalized_protocol_names):
        config_reader = MagicMock(spec=LocalConfigReader)
        config_reader.read = MagicMock(side_effect=FileNotFoundError)
        with pytest.raises(ConfigReadError):
            TelepMLServiceV1Handler(
                service_config_name=service_config_file_v1,
                config_reader=config_reader,
                statsd=statsd,
                s3=s3,
                normalized_protocol_names=normalized_protocol_names,
                logger=logging.getLogger(),
            )

    def test_run(
        self,
        default_request,
        local_config_dir,
        service_config_file_v1,
        statsd,
        s3,
        normalized_protocol_names,
    ):
        handler = TelepMLServiceV1Handler(
            service_config_name=service_config_file_v1,
            config_reader=LocalConfigReader(config_dir=local_config_dir),
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )
        result = handler.run(default_request, "some_request_id")
        assert result[0] is False
        assert result[1] == handler._service_config_json[default_request.market_name]

    def test__lookup(
        self,
        default_proto,
        default_request,
        local_config_dir,
        service_config_file_v1,
        statsd,
        s3,
        normalized_protocol_names,
    ):
        handler = TelepMLServiceV1Handler(
            service_config_name=service_config_file_v1,
            config_reader=LocalConfigReader(config_dir=local_config_dir),
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )
        with patch.object(handler.statsd, "increment") as increment:
            assert handler._lookup_market(default_request) == "DEN"
            increment.assert_has_calls([call("end_market_lookup")])

            custom_proto = deepcopy(default_proto)
            custom_proto["market_name"] = "PHX"
            custom_request = telep_proto.GetEligibilityRequest(**custom_proto)
            assert handler._lookup_market(custom_request) == "DEFAULT"
            increment.assert_has_calls([call("unknown_market_set_to_default")])

    def test__validate(
        self, default_proto, local_config_dir, service_config_file_v1, statsd, s3, normalized_protocol_names
    ):
        handler = TelepMLServiceV1Handler(
            service_config_name=service_config_file_v1,
            config_reader=LocalConfigReader(config_dir=local_config_dir),
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )

        with patch.object(handler.statsd, "increment") as increment:
            valid_request = telep_proto.GetEligibilityRequest(**default_proto)
            _ = handler._validate_request(valid_request)
            increment.assert_has_calls([call("start_request_validation", tags=[f"market:{valid_request.market_name}"])])

            custom_proto = deepcopy(default_proto)
            custom_proto["patient_age"] = -1
            custom_request = telep_proto.GetEligibilityRequest(**custom_proto)
            with pytest.raises(errors.RequestValidationError):
                handler._validate_request(custom_request)
                increment.assert_has_calls(
                    [
                        call("start_request_validation"),
                        call("patient_age_validation_error"),
                    ]
                )

            custom_proto2 = deepcopy(default_proto)
            custom_proto2["market_name"] = "PHOENIX"
            custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
            with pytest.raises(errors.RequestValidationError):
                handler._validate_request(custom_request2)
                increment.assert_has_calls(
                    [
                        call("start_request_validation"),
                        call("market_name_validation_error"),
                    ]
                )


class TestTelepMLServiceV2Handler:
    def test_valid_service_handler(
        self,
        local_config_dir,
        service_config_file_v2,
        statsd,
        s3,
        normalized_protocol_names,
        default_telep_model_config_file_v2,
        enhanced_telep_model_config_file_v2,
        basic_v1,
        enhanced_v1,
    ):
        handler = TelepMLServiceV2Handler(
            service_config_name=service_config_file_v2,
            config_reader=LocalConfigReader(config_dir=local_config_dir),
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )
        assert basic_v1 in handler.telep_model_handlers
        assert isinstance(handler.telep_model_handlers[basic_v1], TelepModelHandler)
        assert enhanced_v1 in handler.telep_model_handlers
        assert isinstance(handler.telep_model_handlers[enhanced_v1], TelepModelHandler)

    def test_model_cache(
        self,
        service_config_file_v2,
        local_config_dir,
        normalized_protocol_names,
        s3,
        statsd,
        iv_model_config,
    ):
        """Test that each unique sub-model is only loaded once. Sine there are
        three unique sub-models, ModelConfig.load_model_config() should only have
        been called three times.
        """
        with patch.object(TelepModelConfig, "load_model_config", return_value=iv_model_config):

            handler = TelepMLServiceV2Handler(
                service_config_name=service_config_file_v2,
                config_reader=LocalConfigReader(config_dir=local_config_dir),
                statsd=statsd,
                s3=s3,
                normalized_protocol_names=normalized_protocol_names,
                logger=logging.getLogger(),
            )
            num_loads = 0
            for _, model_handler in handler._telep_model_handlers.items():
                num_loads += model_handler._loaded_new_models
            assert num_loads == 3

    def test_run(
        self,
        default_request,
        local_config_dir,
        service_config_file_v2,
        statsd,
        s3,
        normalized_protocol_names,
        default_telep_model_config_file_v2,
        basic_v1,
    ):
        handler = TelepMLServiceV2Handler(
            service_config_name=service_config_file_v2,
            config_reader=LocalConfigReader(config_dir=local_config_dir),
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )
        result, model_version = handler.run(default_request, "some_request_id")
        assert result is False
        assert model_version == basic_v1

    def test_run_correct_models(
        self,
        default_request,
        local_config_dir,
        service_config_file_v2,
        statsd,
        s3,
        normalized_protocol_names,
        enhanced_request,
        default_telep_model_config_file_v2,
        enhanced_telep_model_config_file_v2,
        basic_v1,
        enhanced_v1,
    ):
        mock_default_model_handler = MagicMock(spec=TelepModelHandler)
        mock_default_model_handler.run = MagicMock(return_value=True)

        mock_enhanced_model_handler = MagicMock(spec=TelepModelHandler)
        mock_enhanced_model_handler.run = MagicMock(return_value=True)

        handler = TelepMLServiceV2Handler(
            service_config_name=service_config_file_v2,
            config_reader=LocalConfigReader(config_dir=local_config_dir),
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )

        handler._telep_model_handlers[basic_v1] = mock_default_model_handler
        handler._telep_model_handlers[enhanced_v1] = mock_enhanced_model_handler

        _ = handler.run(default_request, "id1")
        handler._telep_model_handlers[basic_v1].run.assert_called_once()
        _ = handler.run(enhanced_request, "id2")
        handler._telep_model_handlers[enhanced_v1].run.assert_called_once()

    def test_invalid_init(self, service_config_file_v2, statsd, s3, normalized_protocol_names):
        config_reader = MagicMock(spec=LocalConfigReader)
        config_reader.read = MagicMock(side_effect=FileNotFoundError)
        with pytest.raises(ConfigReadError):
            TelepMLServiceV2Handler(
                service_config_name=service_config_file_v2,
                config_reader=config_reader,
                statsd=statsd,
                s3=s3,
                normalized_protocol_names=normalized_protocol_names,
                logger=logging.getLogger(),
            )

    def test__create_model_handler(
        self,
        local_config_dir,
        service_config_file_v2,
        statsd,
        s3,
        normalized_protocol_names,
        default_telep_model_config_file_v2,
    ):
        config_reader = LocalConfigReader(config_dir=local_config_dir)
        handler = TelepMLServiceV2Handler(
            service_config_name=service_config_file_v2,
            config_reader=config_reader,
            statsd=statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=logging.getLogger(),
        )
        with patch.object(TelepModelConfig, "load_from_json", return_value=MagicMock(spec=TelepModelConfig)):
            with patch.object(config_reader, "read", return_value={}):
                with patch.object(TelepModelHandler, "load_models", return_value={}):
                    handler._create_model_handler(
                        model_version="test_version",
                        config_reader=config_reader,
                        risk_protocol_preprocessor=MagicMock(spec=RiskProtocolPreprocessor),
                        normalized_protocol_names=normalized_protocol_names,
                        s3=s3,
                        model_cache={},
                    )
                    TelepModelConfig.load_from_json.assert_called_once()
                    TelepModelHandler.load_models.assert_called_once()

            with patch.object(config_reader, "read", side_effect=FileNotFoundError):
                with pytest.raises(ConfigReadError):
                    handler._create_model_handler(
                        model_version="test_version",
                        config_reader=config_reader,
                        risk_protocol_preprocessor=MagicMock(spec=RiskProtocolPreprocessor),
                        normalized_protocol_names=normalized_protocol_names,
                        s3=s3,
                        model_cache={},
                    )
