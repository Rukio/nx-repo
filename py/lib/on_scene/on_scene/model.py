# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import numpy as np
from beartype import beartype
from beartype.typing import Union
from model_utils.xgb_model import XGBModel
from scipy.sparse import csr_matrix
from sklearn.pipeline import Pipeline
from xgboost.sklearn import XGBRegressor


@beartype
class OnSceneModel(XGBModel):
    def __init__(
        self,
        model: XGBRegressor,
        version: str,
        transformer: Pipeline,
        logger: logging.Logger,
    ):
        super().__init__(model=model, version=version, transformer=transformer, logger=logger)

    def predict(self, x_transformed: Union[csr_matrix, np.ndarray]) -> np.ndarray:
        """Predict on-scene time for each shift team.

        Note that since self.model (an XGBRegressor model) was trained to predict
        np.log(on_scene_time_in_minutes), to return on-scene time in minutes
        we need to exponentiate the predictions by self.model.

        Arguments
        ---------
        x_transformed
            Input feature that has been transformed/preprocessed.

        Returns
        -------
        Predictions of on-scene time in minutes.
        """
        pred_log_os_time = super().predict(x_transformed=x_transformed)
        return np.exp(pred_log_os_time)
