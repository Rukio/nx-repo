# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import numpy as np
from beartype.typing import Dict
from beartype.typing import Union
from model_utils.base_ml_model import BaseMLModel
from model_utils.errors import MissingEvalMetricError
from model_utils.errors import ModelValidationError
from model_utils.errors import ModelValidationWarning
from model_utils.errors import UnsupportedMetricError
from model_utils.eval import EVAL_METRICS
from scipy.sparse import csr_matrix
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from xgboost.core import XGBoostError
from xgboost.sklearn import XGBClassifier
from xgboost.sklearn import XGBRegressor


# Nomenclature: note that XGBoost calls the validation set "evaluation set", so
# you will see these two terms used interchangeably in the context of XGBoost models.
# Similarly, "validation metric" and "evaluation metric" mean the same thing.


RAISE_TOLERANCE = 0.05
WARN_TOLERANCE = 0.01


class XGBModel(BaseMLModel):
    def __init__(
        self,
        model: Union[XGBClassifier, XGBRegressor],
        version: str,
        transformer: Union[ColumnTransformer, Pipeline],
        logger: logging.Logger,
    ) -> None:
        """A parent class for all models based on XGBoost models.

        We want a separate parent class in order to implement a few methods that
        fetch model validation data specifically from XGBoost models. These methods
        will not apply to other model types.

        Arguments
        ---------
        model
            Trained XGBoost model object
        version
            version string
        transformer
            Packaged feature transformation/preprocessing logic
        logger
            Logger object

        """
        super().__init__(model=model, version=version, transformer=transformer, logger=logger)

    def _predict_for_validation(self, x_transformed: csr_matrix | np.ndarray) -> np.ndarray:
        """Return predictions for model validation purposes.

        This could be different from what self.predict implements because
        self.predict could return value appropriate for business use case (e.g.,
        return predicted on-scene time in minutes although self._model predicts
        the logarithm of on-scene time). In this case, predict_for_validation
        should return log(on_scene_time) because this is what the model was
        trained on so it can be used for model validation.

        Arguments
        ---------
        x_transformed
            Transformed/preprocessed features

        Returns
        -------
        Raw predictions from self._model.predict
        """
        if isinstance(self._model, XGBClassifier):
            # predict probability of positive class; this works for binary
            # classification models
            return self._model.predict_proba(x_transformed)

        return self._model.predict(x_transformed)

    def _get_evals_result(self) -> Dict[str, Dict[str, np.ndarray]]:
        """Get validation results from XGBoost model objects.

        Returns
        ---------
        evals_result
            A dict that stores validation results (XGBoost calls it "evaluation set")
            that are stored in an attribute of the model object.
        """
        # retrieve evaluation results from XGBoost model
        try:
            evals_result = self._model.evals_result()
        except XGBoostError:
            err_msg = "Cannot find eval metric from self.model."
            self.logger.exception(err_msg)
            raise MissingEvalMetricError(err_msg)

        return evals_result

    def _get_eval_set_name(self, evals_result: Dict[str, Dict[str, np.ndarray]]) -> str:
        """Get the eval set name stored in self._model that we will compare to.

        When training XGBoost models, it's possible to pass multiple evaluation
        sets to the eval_set argument. We assume that the LAST eval_set passed is
        the one we want to compare against.

        evals_result.keys() should contain values such as 'validation_0',
        'validation_1', etc., and assuming there will be less than 10 evaluation
        sets (why would you use more than 10?), to get the LAST eval_set passed,
        we simply select the "largest" eval_set name in string comparison.

        Arguments
        ---------
        evals_result
            Dict storing evaluation set results in XGBoost models

        Returns
        -------
        eval_set_name
            Name of the LAST evaluation set passed to the model during training.

        """
        eval_set_name = max(evals_result.keys())
        if len(evals_result) > 1:
            self.logger.warning(f"Using '{eval_set_name}' among {list(evals_result.keys())} as the eval set.")

        return eval_set_name

    def _get_eval_metric_name(self, evals_result: Dict[str, Dict[str, np.ndarray]], eval_set_name: str) -> str:
        """Get evaluation metric name.

        Arguments
        ---------
        evals_result
            Dict storing evaluation set results in XGBoost models
        eval_set_name
            Name of evaluation set

        Returns
        -------
        eval_metric_name
            Name of evaluation metric used

        """
        eval_metric_name = list(evals_result[eval_set_name].keys())[0]

        if eval_metric_name not in EVAL_METRICS.keys():
            err_msg = f"Metric '{eval_metric_name}' not supported."
            self.logger.exception(err_msg)
            raise UnsupportedMetricError(err_msg)

        return eval_metric_name

    def _get_expected_eval_metric_value(
        self, evals_result: Dict[str, Dict[str, np.ndarray]], eval_set_name: str, eval_metric_name: str
    ) -> float:
        """Get expected evaluation metric value.

        We want the eval metric value after the final iteration, so always get
        the LAST evaluation metric value from evals_result[eval_set_name][metric_name].

        Arguments
        ---------
        evals_result
            Dict storing evaluation set results in XGBoost models
        eval_set_name
            Name of evaluation set
        eval_metric_name
            Name of evaluation metric

        Returns
        -------
        eval_metric_value
            Value of the evaluation metric at the last iteration of model fitting.

        """
        eval_metric_value = evals_result[eval_set_name][eval_metric_name][-1]
        return eval_metric_value

    def _calculate_eval_metric_value(self, eval_metric_name: str, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculate evaluation metric using y_true and y_pred.

        Making this a separate method so it's easier to mock in unit tests.

        Arguments
        ---------
        eval_metric_name
            Name of eval metric; used to look up eval metric function from
            EVAL_METRICS
        y_true
            Labels from the data
        y_pred
            Predictions from the model

        Returns
        -------
        Value of the evaluation metric

        """
        # metric_func
        metric_func = EVAL_METRICS[eval_metric_name]

        return metric_func(y_true, y_pred)

    def validate(
        self,
        x_test_transformed: Union[csr_matrix, np.ndarray],
        y_test: np.ndarray,
        raise_tolerance: float = RAISE_TOLERANCE,
        warn_tolerance: float = WARN_TOLERANCE,
    ) -> None:
        """Validates model against test set data.

        This method is usually called when a model is loaded from the model
        registry when the Tele-p ML service starts.

        NOTE: the expected metric name and value are loaded from within
        self.model, and it expects that only ONE `eval_metric` was set during
        training.

        Parameters
        ----------
        X_test_transformed
            Transformed test-set features (i.e., should be returned by
            self.transformer). This is usually stored with the model in model
            registry.
        y_test
            Test-set label.
        raise_tolerance
            Fractional tolerance between calculated and stored metric values
            above which we raise an exception.
            In other words, we expect
            abs((calculated_metric_value - stored_metric_value) / stored_metric_value) < tolerance,
            or model validation fails.
        warn_tolerance
            Fractional tolerance between calculated and stored metric values
            above which we print a warning statement but still pass model
            validation. It is a signal for us to look into why there is such
            a big difference.

        Raises
        ------
        MissingEvalMetricError
            If self.model was not trained with an eval_set so it does not store
            eval metric values.
        AmbiguousEvalSetError
            If self.model has more than one eval_set used during training, as it
            is unclear which one we should compare with.
        TooManyEvalMetricsError
            If self.model was trained with more than one eval_metric.
        UnsupportedMetricError
            If self.model was trained with a metric name not included in
            EVAL_METRICS.
        ModelValidationError
            If metric value does not match that stored in self.model within
            raise_tolerance.
        ModelValidationWarning
            If metric value does not match that stored in self.model within
            warn_tolerance.

        Examples
        --------
        >>> telep_model = TelepModel(model=xgb_model, transformer=transformer)
        >>> telep_model.validate(X_test, y_test, tolerance=1.e-4)

        """
        # get all evaluation results during fitting
        evals_result = self._get_evals_result()

        # get name of eval_set
        eval_set_name = self._get_eval_set_name(evals_result)

        # get name of evaluation metric
        eval_metric_name = self._get_eval_metric_name(evals_result, eval_set_name)

        # get value of evaluation metric
        stored_metric_value = self._get_expected_eval_metric_value(
            evals_result=evals_result, eval_metric_name=eval_metric_name, eval_set_name=eval_set_name
        )

        # evaluate on test set
        y_pred = self._predict_for_validation(x_test_transformed)
        calculated_metric_value = self._calculate_eval_metric_value(eval_metric_name, y_test, y_pred)

        frac_diff = abs((calculated_metric_value - stored_metric_value) / stored_metric_value)

        def _error_msg(tolerance: float) -> str:
            """Return a formatted error message."""
            msg = (
                f"Calculated value {calculated_metric_value:.3e} for metric '{eval_metric_name}' "
                f"exceeded expected value {stored_metric_value:.3e} by more than tolerance {tolerance} "
                f"(frac_diff = {frac_diff:.3e})"
            )
            return msg

        if frac_diff > raise_tolerance:
            msg = _error_msg(raise_tolerance)
            raise ModelValidationError(msg)
        elif frac_diff > warn_tolerance:
            msg = _error_msg(warn_tolerance)
            raise ModelValidationWarning(msg)
