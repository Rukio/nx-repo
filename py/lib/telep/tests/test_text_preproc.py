# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest
import spacy
from numpy.testing import assert_array_equal
from scipy.sparse import csr_matrix
from sklearn.compose import ColumnTransformer
from sklearn.exceptions import NotFittedError
from sklearn.preprocessing import MultiLabelBinarizer
from telep.preprocessing import errors
from telep.preprocessing.text import TextPreprocessor

x1 = "pt c/o sneezing"
x2 = "pt has severe headache"


@pytest.fixture()
def spacy_nlp():
    return spacy.load("en_core_web_sm", exclude=["senter", "parser"])


@pytest.fixture()
def input_token_classes():
    return ["pt", "sneeze"]


@pytest.fixture()
def dummy_series():
    return pd.Series([x1, x2, ""])


@pytest.fixture()
def dummy_tokens():
    """Manually return expected tokens from dummy_series in order to save time"""
    return [{"sneeze", "pt", "c", "o"}, {"pt", "headache", "severe"}, set()]


@pytest.fixture()
def dummy_df(dummy_series):
    return pd.DataFrame({"notes": dummy_series})


@pytest.fixture()
def dummy_df_bad_1():
    return pd.DataFrame({"notes": [x1, x2, 1]})


@pytest.fixture()
def dummy_df_bad_2():
    return pd.DataFrame({"notes": [x1, x2, None]})


class TestTextPreprocessor:
    def test_tokenize_series(self, spacy_nlp, dummy_series):
        preproc = TextPreprocessor(nlp=spacy_nlp, logger=logging.getLogger())
        list_tokens = preproc.tokenize_series(dummy_series)

        assert len(list_tokens) == 3
        s0, s1, s2 = list_tokens
        assert isinstance(s0, set)
        assert isinstance(s1, set)
        assert isinstance(s2, set)
        assert s0 == {"pt", "c", "o", "sneeze"}
        assert s1 == {"pt", "severe", "headache"}
        assert s2 == set()

    def test_fit_token_encoding(self, spacy_nlp, input_token_classes, dummy_tokens):
        # without input tokens
        preproc = TextPreprocessor(nlp=spacy_nlp, logger=logging.getLogger())
        # use pre-processed tokens to save time
        preproc.fit_token_encoding(dummy_tokens)
        returned_tokens = preproc.token_classes
        mlb = preproc.mlb

        assert isinstance(returned_tokens, list)
        assert isinstance(mlb, MultiLabelBinarizer)
        exp_set_classes = {"pt", "c", "o", "sneeze", "severe", "headache"}
        assert set(returned_tokens) == exp_set_classes
        assert set(mlb.classes_) == exp_set_classes

        # with input tokens
        preproc_cl = TextPreprocessor(nlp=spacy_nlp, logger=logging.getLogger(), token_classes=input_token_classes)
        preproc_cl.fit_token_encoding(dummy_tokens)
        returned_tokens = preproc_cl.token_classes
        mlb = preproc_cl.mlb

        assert isinstance(returned_tokens, list)
        assert isinstance(mlb, MultiLabelBinarizer)
        exp_set_classes = {"pt", "sneeze"}
        assert set(returned_tokens) == exp_set_classes
        assert set(mlb.classes_) == set(input_token_classes)

    def test_apply_token_encoding(self, spacy_nlp, input_token_classes, dummy_tokens):
        # Dense
        preproc = TextPreprocessor(
            nlp=spacy_nlp, logger=logging.getLogger(), token_classes=input_token_classes, sparse_output=False
        )
        preproc.fit_token_encoding(dummy_tokens)
        arr = preproc.apply_token_encoding(dummy_tokens)

        assert isinstance(arr, np.ndarray)
        exp_out_arr = np.array([[1, 1], [1, 0], [0, 0]])
        assert_array_equal(arr, exp_out_arr)

        # Sparse
        preproc = TextPreprocessor(
            nlp=spacy_nlp, logger=logging.getLogger(), token_classes=input_token_classes, sparse_output=True
        )
        preproc.fit_token_encoding(dummy_tokens)
        mat_sp = preproc.apply_token_encoding(dummy_tokens)

        assert isinstance(mat_sp, csr_matrix)
        assert_array_equal(mat_sp.todense(), exp_out_arr)

    def test_get_feature_names_out(self, spacy_nlp, input_token_classes, dummy_tokens):
        preproc = TextPreprocessor(nlp=spacy_nlp, logger=logging.getLogger(), token_classes=input_token_classes)
        preproc.fit_token_encoding(dummy_tokens)
        feat_names = preproc.get_feature_names_out()

        assert feat_names == ["token_pt", "token_sneeze"]

    def test_run_in_column_transformer(
        self, spacy_nlp, dummy_df, dummy_df_bad_1, dummy_df_bad_2, input_token_classes, dummy_tokens
    ):
        with patch.object(TextPreprocessor, "tokenize_series", return_value=dummy_tokens):
            # Dense
            trans = [
                (
                    "token",
                    TextPreprocessor(
                        nlp=spacy_nlp,
                        logger=logging.getLogger(),
                        token_classes=input_token_classes,
                        sparse_output=False,
                    ),
                    "notes",
                )
            ]
            ct = ColumnTransformer(trans, verbose_feature_names_out=False)
            out_arr = ct.fit_transform(dummy_df)

            assert isinstance(out_arr, np.ndarray)
            exp_out_arr = np.array([[1, 1], [1, 0], [0, 0]])
            assert_array_equal(out_arr, exp_out_arr)

            with pytest.raises(errors.InvalidTextInput):
                ct_bad_1 = ColumnTransformer(trans, verbose_feature_names_out=False, sparse_threshold=0)
                ct_bad_1.fit_transform(dummy_df_bad_1)

            with pytest.raises(errors.InvalidTextInput):
                ct_bad_2 = ColumnTransformer(trans, verbose_feature_names_out=False, sparse_threshold=0)
                ct_bad_2.fit_transform(dummy_df_bad_2)

            # Sparse
            trans = [
                (
                    "token",
                    TextPreprocessor(
                        nlp=spacy_nlp, logger=logging.getLogger(), token_classes=input_token_classes, sparse_output=True
                    ),
                    "notes",
                )
            ]
            ct = ColumnTransformer(trans, verbose_feature_names_out=False, sparse_threshold=1)
            mat_sp = ct.fit_transform(dummy_df)

            assert isinstance(mat_sp, csr_matrix)
            assert_array_equal(mat_sp.todense(), exp_out_arr)

    def test_not_fitted(self, spacy_nlp, dummy_series, input_token_classes):
        preproc = TextPreprocessor(nlp=spacy_nlp, logger=logging.getLogger())
        with pytest.raises(NotFittedError):
            preproc.transform(dummy_series)

        preproc_cl = TextPreprocessor(nlp=spacy_nlp, logger=logging.getLogger(), token_classes=input_token_classes)
        with pytest.raises(NotFittedError):
            preproc_cl.transform(dummy_series)
