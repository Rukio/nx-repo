# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import numpy as np
from model_utils.base_ml_model import BaseMLModel
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from xgboost.sklearn import XGBClassifier

logger = logging.getLogger()


class TestBaseMLModel:
    def test_valid_base_model(self, toy_models, mock_model_name, column_transformer):
        base_model = BaseMLModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=column_transformer, logger=logger
        )
        assert isinstance(base_model._model, XGBClassifier)
        assert base_model.version == "test"
        assert isinstance(base_model._transformer, ColumnTransformer)

    def test_base_model_transform_predict(
        self, toy_models, mock_model_name, column_transformer, raw_features, sample_size
    ):
        base_model = BaseMLModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=column_transformer, logger=logger
        )
        X_transformed = base_model.transform_features(raw_features)
        assert isinstance(X_transformed, np.ndarray)
        assert X_transformed.shape[0] == sample_size

        y_pred = base_model.predict(X_transformed)
        assert isinstance(y_pred, np.ndarray)
        assert len(y_pred) == sample_size
        assert y_pred[0] in (0, 1)  # should be a binary classifier

        y_pred_from_raw = base_model.transform_predict(raw_features)
        assert len(y_pred_from_raw) == sample_size
        assert y_pred_from_raw[0] in (0, 1)  # should be a binary classifier

    def test_base_model_with_pipeline(self, toy_models, mock_model_name, column_transformer, raw_features, sample_size):
        pipeline = Pipeline(steps=[("col_transform", column_transformer)])
        base_model = BaseMLModel(
            model=toy_models[mock_model_name.IV], version="test", transformer=pipeline, logger=logger
        )
        assert isinstance(base_model._transformer, Pipeline)

        # test transform_predict
        y_pred_from_raw = base_model.transform_predict(raw_features)
        assert len(y_pred_from_raw) == sample_size
        assert y_pred_from_raw[0] in (0, 1)  # should be a binary classifier
