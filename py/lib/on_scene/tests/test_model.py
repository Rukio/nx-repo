# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from unittest.mock import MagicMock

import numpy as np
import pytest
from on_scene.model import OnSceneModel
from sklearn.pipeline import Pipeline
from xgboost.sklearn import XGBRegressor


class TestOSModel:
    def test_valid_model(self):
        model = MagicMock(spec=XGBRegressor)
        preproc_pipeline = MagicMock(spec=Pipeline)
        os_model = OnSceneModel(model=model, version="test", transformer=preproc_pipeline, logger=logging.getLogger())
        assert os_model.version == "test"

    def test_predict(self):
        model = MagicMock(spec=XGBRegressor)
        # mock the model to return a prediction of np.log(10)
        model.predict = MagicMock(return_value=np.array([np.log(10.0)]))
        preproc_pipeline = MagicMock(spec=Pipeline)
        os_model = OnSceneModel(model=model, version="test", transformer=preproc_pipeline, logger=logging.getLogger())

        # test that prediction returns the exponentiated value returned by the
        # XGBRegressor model
        # mock one row of data with 7 features
        mock_features = np.zeros((1, 7))
        pred = os_model.predict(mock_features)
        assert pytest.approx(pred) == 10.0
