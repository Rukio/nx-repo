# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import re
import warnings

import numpy as np
import pandas as pd
from beartype import beartype
from beartype.typing import Union
from scipy.sparse import csr_matrix
from sklearn.base import BaseEstimator
from sklearn.base import TransformerMixin
from sklearn.exceptions import NotFittedError
from sklearn.preprocessing import MultiLabelBinarizer
from spacy.lang.en import English

from .errors import InvalidTextInput


@beartype
class TextPreprocessor(BaseEstimator, TransformerMixin):
    def __init__(
        self,
        nlp: English,
        logger: logging.Logger,
        token_classes: list[str] | None = None,
        n_process: int = -1,
        sparse_output: bool = True,
    ) -> None:
        """Initialize the class

        There are several ways to call this class. For research, the user can call this class on its own, with or
        without token_classes:

        s = pd.Series(["pt c/o sneezing", "pt has severe headache", ""])
        token_classes = ["pt", "sneeze", ...] # optional list of predefined tokens
        nlp = spacy.load("en_core_web_sm", exclude=["senter", "parser"])

        preproc = TextPreprocessor(nlp=nlp, logger=logger)
        preproc.fit_transform(s) # preprocessor learns token classes from data
        preproc_cl =  TextPreprocessor(nlp, logger, token_classes)
        preproc_cl.fit_transform(s) # preprocessor only binarizes classes input by user

        The easiest way to use this class for training and inference is from a ColumnTransformer:

        trans = [("token", PreprocessText(nlp, logger, token_classes), "notes")]
        column_trans = ColumnTransformer(trans)
        column_trans.fit_transform(trainX) # 'notes' is a column in trainX and validX
        column_trans.transform(validX)

        Args:
            nlp (English): Language model from spacy
            token_classes (list[str] | None, optional): List of tokens to binarize into features. Defaults to None.
            n_process (int): Number of processors to use in tokenization. Defaults to -1 for all processors.
            sparse_output (bool): If True, output binary encoding as sparse matrix. Defaults to True.
        """
        super().__init__()
        self.nlp = nlp
        self.logger = logger
        self.token_classes = token_classes
        self.n_process = n_process
        self.sparse_output = sparse_output

    def fit(self, x: pd.Series, y=None):
        """Fit estimator

        Args:
            x (pd.Series): Input data
            y: Required by ColumnTransformer. Defaults to None.

        Returns:
            self:
        """
        # Validate data
        self.validate_input(x)

        # Tokenize text
        token_col = self.tokenize_series(x)

        # Fit binary encoding
        self.fit_token_encoding(token_col)

        return self

    def transform(self, x: pd.Series, y=None) -> Union[np.ndarray, csr_matrix]:
        """Transform input data

        Args:
            x (pd.Series): Input data
            y: Required by ColumnTransformer. Defaults to None.

        Returns:
            Union[np.ndarray, csr_matrix]: Output array
        """
        if not hasattr(self, "mlb"):
            raise NotFittedError(f"{type(self).__name__} has not been fitted")

        # Tokenize text
        token_col = self.tokenize_series(x)

        # Apply binary encoding
        token_arr = self.apply_token_encoding(token_col)
        return token_arr

    def validate_input(self, x: pd.Series) -> None:
        """Throws error if input isn't array of strings

        Args:
            x (pd.Series): Input array
        """
        self.logger.info(f"Validating series with length {len(x)}")
        for elem in x:
            if not isinstance(elem, str):
                err_msg = "Invalid type found in text input"
                self.logger.exception(err_msg)
                raise InvalidTextInput(err_msg)

    def tokenize_series(self, arr: pd.Series) -> list:
        """Convert array of strings into list of sets

        Args:
            arr (pd.Series): Input data

        Returns:
            list: List of sets, each element of which is a lemmatized token
        """
        self.logger.info(f"Start tokenizing and lemmatizing array of length {arr.shape[0]}...")
        n_process = self.n_process
        list_tokens = []
        for doc in self.nlp.pipe(arr, n_process=n_process):
            list_tokens.append(
                {
                    tok.lemma_
                    for tok in doc
                    if not (
                        tok.is_digit
                        or tok.is_punct
                        or tok.is_stop
                        or tok.is_bracket
                        or re.match(r".*\d.*", tok.text)
                        or re.match(r".*\n.*", tok.text)
                        or re.match(r".*\t.*", tok.text)
                        or re.match(r".*[-•~|,/].*", tok.text)
                        or (tok.ent_iob_ != "O")
                    )
                }
            )
        self.logger.info("Finished tokenizing array")
        return list_tokens

    def fit_token_encoding(self, list_tokens: list) -> None:
        """Fit MultiLabelBinarizer object

        Args:
            list_tokens (list): List of sets of tokens to fit against
        """
        mlb = MultiLabelBinarizer(classes=self.token_classes, sparse_output=self.sparse_output)
        mlb.fit(list_tokens)
        self.token_classes = list(mlb.classes_)
        self.mlb = mlb

    def apply_token_encoding(self, list_tokens: list) -> Union[np.ndarray, csr_matrix]:
        """Apply MultiLabelBinarizer object

        Args:
            list_tokens (list): List of sets of tokens to binarize

        Returns:
            Union[np.ndarray, csr_matrix]: Output array
        """
        self.logger.info("Start binary encoding array")
        # If unknown tokens are encountered, Python throws a UserWarning
        with warnings.catch_warnings():
            warnings.filterwarnings(
                action="ignore",
                category=UserWarning,
                message=".*unknown class.*will be ignored",
            )
            arr = self.mlb.transform(list_tokens)
        self.logger.info("Finished binary encoding array")
        return arr

    def get_feature_names_out(self, input_features=None):
        """Get feature names from transformer

        Args:
            input_features: Required by ColumnTransformer. Defaults to None.

        Returns:
            list: List of token feature names
        """
        return [f"token_{col}" for col in self.token_classes]
