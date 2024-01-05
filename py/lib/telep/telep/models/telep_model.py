# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import numpy as np
from beartype import beartype
from beartype.typing import Union
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from model_utils.xgb_model import XGBModel
from scipy.sparse import csr_matrix
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer
from xgboost.sklearn import XGBClassifier


@beartype
class TelepModel(XGBModel):
    def __init__(
        self,
        model: XGBClassifier,
        version: str,
        transformer: ColumnTransformer,
        risk_protocol_preprocessor: RiskProtocolPreprocessor,
        logger: logging.Logger,
    ) -> None:
        preproc_pipeline = self._build_preproc_pipeline(transformer, risk_protocol_preprocessor)
        super().__init__(
            model=model,
            version=version,
            transformer=preproc_pipeline,
            logger=logger,
        )
        self._risk_protocol_preprocessor = risk_protocol_preprocessor

    @property
    def model(self) -> XGBClassifier:
        """The XGBoost model."""
        return self._model

    @property
    def transformer(self) -> Pipeline:
        """The feature column transformer."""
        return self._transformer

    @property
    def risk_protocol_preprocessor(self) -> RiskProtocolPreprocessor:
        return self._risk_protocol_preprocessor

    def _build_preproc_pipeline(
        self,
        column_transformer: ColumnTransformer,
        risk_protocol_preprocessor: RiskProtocolPreprocessor,
    ) -> Pipeline:
        """Build feature preproc pipeline.

        This combines mapping risk protocol into keywords with the transformation
        of other columns. Can consider combining these two into a single ColumnTransformer
        in the training pipeline in the future?

        Parameters
        ----------
        column_transformer
            A ColumnTransformer instance that transforms features but does not
            apply risk protocol standardization & mapping them to keywords.
        risk_protocol_preprocessor
            Performs the logic that standarizes risk protocol and maps them to
            keywords for the model.

        Returns
        -------
        A scikit-learn Pipeline that combines all feature preprocessing steps.
        """
        risk_protocol_transformer = FunctionTransformer(risk_protocol_preprocessor.run)

        pipeline = Pipeline(
            steps=[
                (
                    "risk_protocol_mapping",
                    risk_protocol_transformer,
                ),
                ("column_transformer", column_transformer),
            ]
        )
        return pipeline

    def predict(self, X_transformed: Union[csr_matrix, np.ndarray]) -> np.ndarray:
        """Returns predicted probability by self.model.

        This assumes that X has been preprocessed and has the same columns as
        what the model was trained with.

        Parameters
        ----------
        X_transformed
            Features for the model, needs to have been transformed/preprocessed.

        Returns
        -------
        Numpy array containing predictions, length will be the same as X_transformed.

        Examples
        --------
        >>> telep_model = TelepModel(
                model=xgb_model,
                transformer=transformer,
                risk_protocol_preprocessor=risk_protocol_preprocessor)
        >>> X_transformed = telep_model.transform_features(X_df)
        >>> telep_model.predict(X_transformed)

        """
        # get predicted probabilities for the positive class
        predicted_proba = self._model.predict_proba(X_transformed)[:, 1]
        return predicted_proba
