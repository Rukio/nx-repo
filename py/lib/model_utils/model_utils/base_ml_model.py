# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import numpy as np
import pandas as pd
from beartype import beartype
from beartype.typing import Any
from beartype.typing import Union
from scipy.sparse import csr_matrix
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


@beartype
class BaseMLModel:
    """Please DO NOT instantiate this class directly, use one of its children
    classes instead."""

    def __init__(
        self,
        model: Any,
        version: str,
        transformer: Union[ColumnTransformer, Pipeline],
        logger: logging.Logger,
    ) -> None:
        self._model = model
        self._version = version
        self._transformer = transformer
        self.logger = logger

    @property
    def version(self) -> str:
        return self._version

    def transform_features(self, x_df: pd.DataFrame) -> Union[csr_matrix, np.ndarray]:
        """Apply feature transformation pipeline on input X_df.

        Parameters
        ----------
        x_df
            Input (raw) feature dataframe.

        Returns
        -------
        A numpy array or scipy sparse matrix as the transformed features with
        the same number of rows as X_df.
        """
        # Use sklearn column transformation
        x_transformed = self._transformer.transform(x_df)

        return x_transformed

    def predict(self, x_transformed: Union[csr_matrix, np.ndarray]) -> np.ndarray:
        """Returns predicted probability by self._model.

        Parameters
        ----------
        x_transformed
            Features for the model, needs to have been transformed/preprocessed.

        Returns
        -------
        Numpy array containing predictions, length will be the same as x_transformed.
        """
        # simply call the predict method of self._model; to be overridden by
        # child classes if a different method should be used.
        return self._model.predict(x_transformed)

    def transform_predict(self, x_df: pd.DataFrame) -> np.ndarray:
        """One-stop method that combines feature transformation and prediction.

        Parameters
        ----------
        x_df
            Raw input features.

        Returns
        -------
        Numpy array containing predictions, length will be the same as x_transformed.
        """
        x_transformed = self.transform_features(x_df)
        return self.predict(x_transformed)

    def validate(self, *args, **kwargs) -> bool:
        """Placeholder for model validation logic."""
        raise NotImplementedError
