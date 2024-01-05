# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import numpy as np
import pytest
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from sklearn.pipeline import Pipeline
from telep.config.enums import ModelName
from telep.models.telep_model import TelepModel
from xgboost.sklearn import XGBClassifier


@pytest.fixture()
def risk_protocol_preprocessor(risk_protocol_mapping):
    return RiskProtocolPreprocessor(risk_protocol_mapping)


class TestTelepModel:
    def test_valid_telep_model(self, toy_models, column_transformer, risk_protocol_preprocessor, test_version):
        telep_model = TelepModel(
            model=toy_models[ModelName.IV],
            version=test_version,
            transformer=column_transformer,
            risk_protocol_preprocessor=risk_protocol_preprocessor,
            logger=logging.getLogger(),
        )
        assert isinstance(telep_model.model, XGBClassifier)
        assert isinstance(telep_model.transformer, Pipeline)
        assert isinstance(telep_model.risk_protocol_preprocessor, RiskProtocolPreprocessor)

    def test_transform_features(
        self, raw_features, sample_size, toy_models, column_transformer, risk_protocol_preprocessor, test_version
    ):
        telep_model = TelepModel(
            model=toy_models[ModelName.IV],
            version=test_version,
            transformer=column_transformer,
            risk_protocol_preprocessor=risk_protocol_preprocessor,
            logger=logging.getLogger(),
        )
        X_transformed = telep_model.transform_features(raw_features)
        assert X_transformed.shape[0] == sample_size
        assert X_transformed.shape[1] >= raw_features.shape[1]

    def test_predict(self, raw_features, toy_models, column_transformer, risk_protocol_preprocessor, test_version):
        telep_model = TelepModel(
            model=toy_models[ModelName.IV],
            version=test_version,
            transformer=column_transformer,
            risk_protocol_preprocessor=risk_protocol_preprocessor,
            logger=logging.getLogger(),
        )
        X_transformed = telep_model.transform_features(raw_features)

        y_pred_batch = telep_model.predict(X_transformed)
        assert y_pred_batch.shape[0] == X_transformed.shape[0]
        assert np.all((y_pred_batch >= 0) & (y_pred_batch <= 1))

    def test_transform_predict(
        self, raw_features, toy_models, column_transformer, risk_protocol_preprocessor, test_version
    ):
        telep_model = TelepModel(
            model=toy_models[ModelName.IV],
            version=test_version,
            transformer=column_transformer,
            risk_protocol_preprocessor=risk_protocol_preprocessor,
            logger=logging.getLogger(),
        )
        y_pred_batch = telep_model.transform_predict(raw_features)
        assert y_pred_batch.shape[0] == raw_features.shape[0]
        assert np.all((y_pred_batch >= 0) & (y_pred_batch <= 1))
        # make sure it's predicting probabilities
        assert np.sum((y_pred_batch > 0) & (y_pred_batch < 1)) > 0
