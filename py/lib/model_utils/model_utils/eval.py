# -*- coding: utf-8 -*-
from __future__ import annotations

import numpy as np
from beartype import beartype
from sklearn.metrics import log_loss
from sklearn.metrics import mean_squared_error


# We will define all evaluation functions used for validating models here


@beartype
class EvalFunctions:
    @staticmethod
    def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Return root mean squared error.

        Arguments
        ---------
        y_true
            True labels of the model
        y_pred
            Predictions from the model

        Returns
        -------
        Value of RMSE

        """
        mse = mean_squared_error(y_true=y_true, y_pred=y_pred)
        return np.sqrt(mse)


# maps xgboost metric name to scikit-learn metric function
EVAL_METRICS = {"logloss": log_loss, "rmse": EvalFunctions.rmse}
