# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from unittest.mock import patch

import pytest
from model_utils.errors import MissingEvalMetricError
from model_utils.errors import ModelValidationError
from model_utils.errors import ModelValidationWarning
from model_utils.errors import UnsupportedMetricError
from model_utils.xgb_model import RAISE_TOLERANCE
from model_utils.xgb_model import WARN_TOLERANCE
from model_utils.xgb_model import XGBModel

# More for testing the model validation methods

logger = logging.getLogger()


class TestXGBModel:
    def test__predict_for_validation(self, toy_models, mock_model_name, column_transformer, x_train):
        xgbmodel = XGBModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=column_transformer, logger=logger
        )
        y_pred = xgbmodel._predict_for_validation(x_train)
        # make sure that y_pred falls within [0, 1]
        assert y_pred.max() <= 1
        assert y_pred.min() >= 0

    def test__get_evals_result(self, toy_models, mock_model_name, column_transformer):
        xgbmodel = XGBModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=column_transformer, logger=logger
        )
        evals_result = xgbmodel._get_evals_result()
        assert isinstance(evals_result, dict)

        # test exception when evals_result does not exist
        xgbmodel_no_eval = XGBModel(
            model=toy_models["no-evals"], version="test", transformer=column_transformer, logger=logger
        )
        with pytest.raises(MissingEvalMetricError):
            xgbmodel_no_eval._get_evals_result()

    def test__get_eval_set_name(self, toy_models, mock_model_name, column_transformer):
        xgbmodel = XGBModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=column_transformer, logger=logger
        )
        evals_result = xgbmodel._get_evals_result()
        eval_set_name = xgbmodel._get_eval_set_name(evals_result=evals_result)
        assert eval_set_name == "validation_0"

        # test when model has more than 1 eval sets
        xgbmodel2 = XGBModel(
            model=toy_models["two-evals"], version="test", transformer=column_transformer, logger=logger
        )
        evals_result2 = xgbmodel2._get_evals_result()
        with patch.object(xgbmodel2.logger, "warning"):
            eval_set_name2 = xgbmodel2._get_eval_set_name(evals_result=evals_result2)
            assert eval_set_name2 == "validation_1"
            xgbmodel2.logger.warning.assert_called_once()

    def test__get_eval_metric_name(self, toy_models, mock_model_name, column_transformer):
        xgbmodel = XGBModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=column_transformer, logger=logger
        )
        evals_result = xgbmodel._get_evals_result()
        eval_set_name = xgbmodel._get_eval_set_name(evals_result=evals_result)
        eval_metric_name = xgbmodel._get_eval_metric_name(evals_result=evals_result, eval_set_name=eval_set_name)
        assert eval_metric_name == "logloss"

        # try a different name
        xgbmodel2 = XGBModel(
            model=toy_models[mock_model_name.ON_SCENE], version="test", transformer=column_transformer, logger=logger
        )
        evals_result2 = xgbmodel2._get_evals_result()
        eval_set_name2 = xgbmodel2._get_eval_set_name(evals_result=evals_result2)
        eval_metric_name2 = xgbmodel2._get_eval_metric_name(evals_result=evals_result2, eval_set_name=eval_set_name2)
        assert eval_metric_name2 == "rmse"

        # test an unsupported metric name
        xgbmodel3 = XGBModel(
            model=toy_models["bad-evals"],
            version="test",
            transformer=column_transformer,
            logger=logger,
        )
        evals_result3 = xgbmodel3._get_evals_result()
        eval_set_name3 = xgbmodel3._get_eval_set_name(evals_result=evals_result3)
        with pytest.raises(UnsupportedMetricError):
            xgbmodel3._get_eval_metric_name(evals_result=evals_result3, eval_set_name=eval_set_name3)

    def test__get_eval_metric_value(self, toy_models, mock_model_name, column_transformer):
        xgbmodel = XGBModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=column_transformer, logger=logger
        )
        evals_result = xgbmodel._get_evals_result()
        eval_set_name = xgbmodel._get_eval_set_name(evals_result=evals_result)
        eval_metric_name = xgbmodel._get_eval_metric_name(evals_result=evals_result, eval_set_name=eval_set_name)
        eval_metric_value = xgbmodel._get_expected_eval_metric_value(
            evals_result=evals_result, eval_metric_name=eval_metric_name, eval_set_name=eval_set_name
        )
        assert isinstance(eval_metric_value, float)
        assert eval_metric_value == evals_result["validation_0"]["logloss"][-1]

    def test_validate_classification(
        self, x_train, training_labels, toy_models, column_transformer, rng, test_version, mock_model_name
    ):
        telep_model = XGBModel(
            model=toy_models[mock_model_name.IV],
            version=test_version,
            transformer=column_transformer,
            logger=logging.getLogger(),
        )
        # test that metric matches up exactly
        y_train = training_labels[mock_model_name.IV]
        assert (
            telep_model.validate(x_train, y_train, raise_tolerance=RAISE_TOLERANCE, warn_tolerance=WARN_TOLERANCE)
            is None
        )

        # test if validation metric differ by more than raise_tolerance
        expected_value = 1.0
        with patch.object(telep_model, "_get_expected_eval_metric_value", return_value=expected_value):

            with patch.object(telep_model, "_calculate_eval_metric_value", return_value=expected_value * 1.02):
                # test when metric difference > warn_tolerance but < raise tolerance
                x_train_resampled = rng.choice(x_train, axis=0, size=x_train.shape[0])
                with pytest.raises(ModelValidationWarning):
                    telep_model.validate(x_train_resampled, y_train)

            with patch.object(telep_model, "_calculate_eval_metric_value", return_value=expected_value * 1.06):
                # test when metric difference > raise tolerance
                x_train_resampled = rng.choice(x_train, axis=0, size=x_train.shape[0])
                with pytest.raises(ModelValidationError):
                    telep_model.validate(x_train_resampled, y_train)

    def test_validate_regression(
        self, x_train, training_labels, toy_models, column_transformer, test_version, mock_model_name
    ):
        os_model = XGBModel(
            model=toy_models[mock_model_name.ON_SCENE],
            version=test_version,
            transformer=column_transformer,
            logger=logging.getLogger(),
        )
        y_train = training_labels[mock_model_name.ON_SCENE]
        assert os_model.validate(x_train, y_train) is None
