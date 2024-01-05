# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import pathlib
from copy import deepcopy
from unittest.mock import call
from unittest.mock import MagicMock
from unittest.mock import patch

import numpy as np
import pytest
from model_utils.errors import ConfigReadError
from model_utils.errors import ModelValidationError
from model_utils.errors import ModelValidationWarning
from model_utils.file_utils import S3Storage
from model_utils.model_config import ModelConfig
from on_scene.config import OnSceneModelConfig
from on_scene.core import DBLookup
from on_scene.core import OnSceneRequestHandler
from on_scene.errors import InvalidVersionError
from on_scene.errors import MissingCareRequestError
from on_scene.errors import MissingShiftTeamsError
from on_scene.generated.db.on_scene_ml_prediction_queries import Querier
from on_scene.model import OnSceneModel
from sklearn.pipeline import Pipeline
from sqlalchemy import Connection
from statsig import statsig


ON_SCENE_SERVICE_CONFIG_NAME = "on_scene_model_service"

statsig.initialize("secret-key")


class TestDBLookup:
    conn = MagicMock(spec=Connection)
    db_lookup = DBLookup(Querier(conn))

    def test_lookup_cached_prediction(self, test_feature_hash):
        with patch.object(self.db_lookup.querier._conn, "execute", create=True):
            self.db_lookup.lookup_cached_prediction(feature_hash=test_feature_hash, request_id="abc")
            self.db_lookup.querier._conn.execute.assert_called_once()

    def test_insert_prediction(self, test_feature_hash):
        with patch.object(self.db_lookup.querier._conn, "execute", create=True):
            self.db_lookup.insert_prediction(
                feature_hash=test_feature_hash,
                care_request_id=12345,
                prediction=50,
                model_version="v1",
                request_id="abcde",
            )
            self.db_lookup.querier._conn.execute.assert_called_once()

    def test_update_last_queried(self):
        with patch.object(self.db_lookup.querier._conn, "execute", create=True):
            self.db_lookup.update_last_queried(id=1, request_id="abcde")
            self.db_lookup.querier._conn.execute.assert_called_once()


class TestOnSceneRequestHandler:
    def test_init(self, logger, statsd, s3, config_reader, user_lookup, model_config_v1p1):
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            _ = OnSceneRequestHandler(
                service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
                logger=logger,
            )
            calls = [call(ON_SCENE_SERVICE_CONFIG_NAME), call("on_scene_model_v1p0"), call("on_scene_model_v1p1")]
            config_reader.read.assert_has_calls(calls)
            ModelConfig.load_from_model_registry.assert_called()

        # test that if config reader raises an exception, it rases a ConfigReadError
        with patch.object(config_reader, "read", side_effect=Exception):
            with pytest.raises(ConfigReadError):
                OnSceneRequestHandler(
                    service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=logger,
                )

    def test__verify_version(self):
        assert OnSceneRequestHandler._verify_version("v1") is None
        assert OnSceneRequestHandler._verify_version("v1.1") is None
        with pytest.raises(InvalidVersionError):
            OnSceneRequestHandler._verify_version("test-version")

    def test__get_config_name_from_version(self):
        assert OnSceneRequestHandler._get_config_name_from_version("v2.0") == "on_scene_model_v2p0"
        assert OnSceneRequestHandler._get_config_name_from_version("v2") == "on_scene_model_v2"

    def test__load_model_version(self, s3, config_reader, model_config_v1p1, statsd, user_lookup, logger):
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            handler = OnSceneRequestHandler(
                service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
                logger=logger,
            )
            model_config, model = handler._load_model_version("v1.1", config_reader=config_reader, s3=s3)
            assert isinstance(model_config, OnSceneModelConfig)
            assert model_config.model_version == "v1.0"
            assert isinstance(model, OnSceneModel)

    def test__validate_request(self, logger, statsd, s3, config_reader, user_lookup, model_config_v1p1, test_request):
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            handler = OnSceneRequestHandler(
                service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
                logger=logger,
            )
            assert handler._validate_request(test_request) is None

    def test__validate_request_missing_shift_team(
        self, statsd, config_reader, s3, user_lookup, logger, bad_request_no_shift_team, model_config_v1p1
    ):
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            handler = OnSceneRequestHandler(
                service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
                logger=logger,
            )
            with pytest.raises(MissingShiftTeamsError):
                handler._validate_request(bad_request_no_shift_team)

    def test_invalid_num_crs(self, logger, statsd, s3, config_reader, user_lookup, model_config_v1p1, test_request):
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            handler = OnSceneRequestHandler(
                service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
                logger=logger,
            )
            # test some bad requests
            bad_request1 = deepcopy(test_request)
            bad_request1.num_crs = 0
            with pytest.raises(MissingCareRequestError):
                handler._validate_request(bad_request1)

    def test_invalid_risk_assessment_score(
        self, logger, statsd, s3, config_reader, user_lookup, model_config_v1p1, test_request
    ):
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            handler = OnSceneRequestHandler(
                service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
                logger=logger,
            )
            bad_request2 = deepcopy(test_request)
            bad_request2.risk_assessment_score = 1000
            with pytest.raises(ValueError):
                handler._validate_request(bad_request2)

    def test__load_model(
        self,
        model_metadata,
        xgbmodel_v1p2,
        logger,
        statsd,
        s3,
        config_reader,
        user_lookup,
        x_test,
        y_test,
        model_config_v1p1,
    ):
        """
        Here we want to test whether OnSceneRequestHandler._load_model() is calling
        ModelConfig.load_from_model_registry() properly. So instead of mocking
        ModelConfig.load_from_model_registry(), we carefully mock the internals of
        ModelConfig.load_from_model_registry() to make sure we are testing
        OnSceneRequestHandler._load_model().
        """

        def load_npy(filename):
            data = {
                "trainX.npy": np.random.uniform(size=(10, 7)),
                "trainY.npy": np.random.uniform(size=10),
                "testX.npy": x_test,
                "testY.npy": y_test,
            }
            name = pathlib.Path(filename).name
            return data[name]

        with patch.multiple(
            S3Storage,
            load_json=MagicMock(return_value=model_metadata),
            load_xgb_model=MagicMock(return_value=xgbmodel_v1p2),
            load_npy=MagicMock(wraps=load_npy),
            load_pickle=MagicMock(return_value=MagicMock(spec=Pipeline)),
        ):
            _ = OnSceneRequestHandler(
                service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
                logger=logger,
            )
            S3Storage.load_json.assert_called()
            S3Storage.load_xgb_model.assert_called()
            S3Storage.load_npy.assert_called()
            S3Storage.load_pickle.assert_called()

        # test that model is being validated
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            with patch.object(OnSceneModel, "validate", return_value=None):
                handler = OnSceneRequestHandler(
                    service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=logger,
                )
                for model in handler.models.values():
                    model.validate.assert_called()

    def test__load_models_validation_warning(self, model_config_v1p1, statsd, config_reader, user_lookup, s3, logger):

        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            # test if validation errors are handled
            e1 = ModelValidationWarning()
            with patch.object(OnSceneModel, "validate", side_effect=e1):
                new_logger = MagicMock(spec=logging.Logger)
                new_logger.getChild = MagicMock(return_value=MagicMock(spec=logging.Logger))
                _ = OnSceneRequestHandler(
                    service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=new_logger,
                )
                new_logger.warning.assert_called_with(f"Model validation for ON_SCENE model returned a warning: {e1}")

    def test__load_models_validation_error(self, statsd, config_reader, s3, user_lookup, logger, model_config_v1p0):

        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p0):
            e2 = ModelValidationError()
            with patch.object(OnSceneModel, "validate", side_effect=e2):
                with pytest.raises(ModelValidationError):
                    OnSceneRequestHandler(
                        service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                        statsd=statsd,
                        config_reader=config_reader,
                        s3=s3,
                        user_lookup=user_lookup,
                        logger=logger,
                    )

    def test_run_not_cached(
        self,
        logger,
        statsd,
        s3,
        config_reader,
        user_lookup,
        model_config_v1p0,
        test_request,
        request_id,
        mock_db_lookup,
        random_feature_hash,
        users_dict,
    ):
        """
        Try to match the result of OnSceneRequestHandler.run() with expected
        prediction values. This requires that we mock the XGBRegressor model
        and column_transformer objects to return expected values. See conftest.py
        for details.

        NOTE: with caching logic added, we must mock db_lookup such that it does NOT
        return a cached result.
        """
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p0):
            with patch.object(user_lookup, "get_users", return_value=users_dict):
                handler = OnSceneRequestHandler(
                    service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=logger,
                )

                # to get expected predicted on-scene time for each shift team, let's
                # calculate them by hand here
                features = handler.featurizer.get_features(test_request)

                # get expected prediction
                expected_predictions = {}
                factual_version = config_reader.read(ON_SCENE_SERVICE_CONFIG_NAME)["factual_model_version"]
                for id in features:
                    expected_predictions[id] = int(
                        round(handler.models[factual_version].transform_predict(features[id])[0])
                    )

                with patch.multiple(
                    mock_db_lookup,
                    lookup_cached_prediction=MagicMock(return_value=None),
                    insert_prediction=MagicMock(return_value=None),
                    hash_features=MagicMock(return_value=random_feature_hash),
                    update_last_queried=MagicMock(return_value=None),
                ):
                    # get result from handler.run
                    result = handler.run(request=test_request, request_id=request_id, db_lookup=mock_db_lookup)
                    # test the correct methods were called
                    mock_db_lookup.hash_features.assert_called()
                    mock_db_lookup.lookup_cached_prediction.assert_called()
                    mock_db_lookup.insert_prediction.assert_called()
                    mock_db_lookup.update_last_queried.assert_not_called()

                    # try to match result with expected_predictions
                    for id in result.keys():
                        assert result[id] == expected_predictions[id]

                # do not patch methods of mock_db_lookup to test if they are called
                # correctly
                with patch.object(mock_db_lookup, "lookup_cached_prediction", return_value=None):
                    _ = handler.run(request=test_request, request_id=request_id, db_lookup=mock_db_lookup)

    def test_run_cached(
        self,
        logger,
        statsd,
        s3,
        config_reader,
        user_lookup,
        model_config_v1p0,
        test_request,
        request_id,
        mock_db_lookup,
        users_dict,
    ):
        """Test when cached predictions are found."""
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p0):
            with patch.object(user_lookup, "get_users", return_value=users_dict):
                handler = OnSceneRequestHandler(
                    service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=logger,
                )

                with patch.multiple(
                    mock_db_lookup,
                    insert_prediction=MagicMock(return_value=None),
                    update_last_queried=MagicMock(return_value=None),
                ):
                    # make sure that if cached results return something (which is how mock_db_lookup
                    # is set up), we update last_queried_at but not insert a new prediction
                    _ = handler.run(request=test_request, request_id=request_id, db_lookup=mock_db_lookup)
                    # test the correct methods were called
                    mock_db_lookup.insert_prediction.assert_not_called()
                    mock_db_lookup.update_last_queried.assert_called()

    def test_run_w_adjustment_not_cached(
        self,
        logger,
        statsd,
        s3,
        config_reader,
        user_lookup,
        model_config_v1p2,
        test_request,
        request_id,
        mock_db_lookup,
        users_dict,
    ):
        """
        Try to match the result of OnSceneRequestHandler.run() with expected
        prediction values. This requires that we mock the XGBRegressor model
        and column_transformer objects to return expected values. See conftest.py
        for details.

        NOTE: make sure we're mocking DBLookup to not return cached results.
        """
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p2):
            with patch.object(user_lookup, "get_users", return_value=users_dict):
                handler = OnSceneRequestHandler(
                    service_config_name="on_scene_model_service_w_adjustment",
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=logger,
                )

                # to get expected predicted on-scene time for each shift team, let's
                # calculate them by hand here
                features = handler.featurizer.get_features(test_request)
                # get expected prediction
                expected_predictions = {}
                factual_version = config_reader.read("on_scene_model_service_w_adjustment")["factual_model_version"]
                for id in features:
                    expected_predictions[id] = int(
                        round(handler.models[factual_version].transform_predict(features[id])[0])
                    )

                with patch.object(mock_db_lookup, "lookup_cached_prediction", return_value=None):
                    # get result from handler.run
                    result = handler.run(request=test_request, request_id=request_id, db_lookup=mock_db_lookup)

                    # try to match result with expected_predictions
                    for id in result.keys():
                        assert result[id] == expected_predictions[id] + 10

    def test_run_low_not_cached(
        self,
        logger,
        statsd,
        s3,
        config_reader,
        user_lookup,
        model_config_v1p1,
        test_request,
        request_id,
        mock_db_lookup,
        users_dict,
    ):
        """
        Try to match the result of OnSceneRequestHandler.run() with expected
        prediction values. This requires that we mock the XGBRegressor model
        and column_transformer objects to return expected values. See conftest.py
        for details.
        """
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            with patch.object(user_lookup, "get_users", return_value=users_dict):
                handler = OnSceneRequestHandler(
                    service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=logger,
                )

                # to get expected predicted on-scene time for each shift team, let's
                # calculate them by hand here
                features = handler.featurizer.get_features(test_request)
                # get expected prediction
                expected_predictions = {}
                factual_version = config_reader.read(ON_SCENE_SERVICE_CONFIG_NAME)["factual_model_version"]
                factual_version_str = factual_version.replace(".", "p")
                factual_model_config_name = f"on_scene_model_{factual_version_str}"
                for id in features:
                    expected_predictions[id] = int(
                        round(handler.models[factual_version].transform_predict(features[id])[0])
                    )
                    # make sure models return predictions less than minimum allowed on-scene time so
                    # the tests later are meaningful
                    assert (
                        expected_predictions[id]
                        < config_reader.read(factual_model_config_name)["minimum_on_scene_time"]
                    )

                with patch.object(mock_db_lookup, "lookup_cached_prediction", return_value=None):
                    # get result from handler.run
                    result = handler.run(request=test_request, request_id=request_id, db_lookup=mock_db_lookup)

                    # try to match result with expected_predictions
                    for id in result.keys():
                        assert result[id] == max(
                            expected_predictions[id],
                            config_reader.read(factual_model_config_name)["minimum_on_scene_time"],
                        )

    def test_run_one_bad_version(
        self, model_config_v1p1, user_lookup, users_dict, statsd, config_reader, s3, logger, mock_db_lookup
    ):
        with patch.object(ModelConfig, "load_from_model_registry", return_value=model_config_v1p1):
            with patch.object(user_lookup, "get_users", return_value=users_dict):
                handler = OnSceneRequestHandler(
                    service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
                    statsd=statsd,
                    config_reader=config_reader,
                    s3=s3,
                    user_lookup=user_lookup,
                    logger=logger,
                )
                with pytest.raises(InvalidVersionError):
                    handler.run_one(
                        semantic_model_version="v2.0",
                        features={},
                        care_request_id=1234,
                        request_id="random_id",
                        db_lookup=mock_db_lookup,
                    )
