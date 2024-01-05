# -*- coding: utf-8 -*-
from __future__ import annotations

from unittest.mock import MagicMock
from unittest.mock import Mock
from unittest.mock import patch

import matplotlib.pyplot as plt
import pytest
import seaborn
from matplotlib.figure import Figure
from model_utils.training.plotting import DimensionsIncorrectError
from model_utils.training.plotting import IncompatibleFeaturesError
from model_utils.training.plotting import ModelFeatImpMissingError
from model_utils.training.plotting import ModelPredictMissingError
from model_utils.training.plotting import plot_feature_importance
from model_utils.training.plotting import plot_precision_recall
from model_utils.training.plotting import plot_reliability
from model_utils.training.plotting import plot_roc
from model_utils.training.plotting import plot_xgb_training_curves


def test_plot_training_curves(toy_models, mock_model_name):
    names = {"validation_0": "validation_0"}
    model = toy_models[mock_model_name.IV]
    with patch.object(plt, "figure", return_value=MagicMock(spec=Figure)):
        with patch.object(model, "evals_result"):
            with patch.object(seaborn, "lineplot"):
                plot_xgb_training_curves(model=model, metric="rmse", names=names)
                plt.figure.assert_called()
                model.evals_result.assert_called_once()
                seaborn.lineplot.assert_called()


def test_plot_feature_importance(toy_models, mock_model_name, x_train):
    model = toy_models[mock_model_name.IV]
    n_features = x_train.shape[1]
    model_no_feat_imp = Mock(spec=[])

    with patch.object(plt, "figure", return_value=MagicMock(spec=Figure)):
        with patch.object(model, "evals_result"):
            with patch.object(plt, "barh"):
                feature_names = [str(i) for i in range(n_features)]
                plot_feature_importance(model=model, feature_names=feature_names, k=10)
                plt.figure.assert_called()
                plt.barh.assert_called_once()

                with pytest.raises(ModelFeatImpMissingError):
                    plot_feature_importance(model=model_no_feat_imp, feature_names=feature_names, k=10)

                with pytest.raises(IncompatibleFeaturesError):
                    feature_names_bad = [str(i) for i in range(n_features + 1)]
                    plot_feature_importance(model=model, feature_names=feature_names_bad, k=10)


def test_plot_roc(toy_models, mock_model_name, x_train, y_train, x_train_bad):
    model = toy_models[mock_model_name.IV]
    model_no_predict = Mock(spec=[])

    with patch.object(plt, "figure", return_value=MagicMock(spec=Figure)):
        with patch.object(plt, "plot"):
            plot_roc(model, x_train, y_train)
            plt.figure.assert_called()
            plt.plot.assert_called_once()

            with pytest.raises(DimensionsIncorrectError):
                plot_roc(model, x_train_bad, y_train)

            with pytest.raises(ModelPredictMissingError):
                plot_roc(model_no_predict, x_train, y_train)


def test_plot_precision_recall(toy_models, mock_model_name, x_train, y_train, x_train_bad):
    model = toy_models[mock_model_name.IV]
    model_no_predict = Mock(spec=[])

    with patch.object(plt, "figure", return_value=MagicMock(spec=Figure)):
        with patch.object(plt, "plot"):
            plot_precision_recall(model, x_train, y_train)
            plt.figure.assert_called()
            plt.plot.assert_called_once()

            with pytest.raises(DimensionsIncorrectError):
                plot_precision_recall(model, x_train_bad, y_train)

            with pytest.raises(ModelPredictMissingError):
                plot_precision_recall(model_no_predict, x_train, y_train)


def test_plot_reliability(toy_models, mock_model_name, x_train, y_train, x_train_bad):
    model = toy_models[mock_model_name.IV]
    model_no_predict = Mock(spec=[])

    with patch.object(plt, "figure", return_value=MagicMock(spec=Figure)):
        with patch.object(seaborn, "scatterplot"):
            plot_reliability(model, x_train, y_train)
            plt.figure.assert_called()
            seaborn.scatterplot.assert_called_once()

            with pytest.raises(DimensionsIncorrectError):
                plot_reliability(model, x_train_bad, y_train)

            with pytest.raises(ModelPredictMissingError):
                plot_reliability(model_no_predict, x_train, y_train)
