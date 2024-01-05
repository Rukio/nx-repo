# -*- coding: utf-8 -*-
from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from beartype import beartype
from beartype.typing import Dict
from beartype.typing import List
from beartype.typing import Optional
from beartype.typing import Union
from matplotlib.figure import Figure
from scipy.sparse import csr_matrix
from sklearn import metrics
from xgboost.sklearn import XGBClassifier
from xgboost.sklearn import XGBRegressor


class IncompatibleFeaturesError(Exception):
    pass


class ModelPredictMissingError(Exception):
    """model object missing predict method"""

    pass


class ModelFeatImpMissingError(Exception):
    """model object missing feature_importances_ attribute"""

    pass


class DimensionsIncorrectError(Exception):
    pass


@beartype
def assert_dimensions_align(valid_x: Union[np.ndarray, pd.DataFrame, csr_matrix], valid_y: np.ndarray):
    if valid_x.shape[0] != valid_y.shape[0]:
        err_msg = (
            f"Dimension mismatch: valid_x has {valid_x.shape[0]}" + f"rows but valid_y has {valid_y.shape[0]} rows"
        )
        raise DimensionsIncorrectError(err_msg)


@beartype
def plot_xgb_training_curves(
    model: Union[XGBRegressor, XGBClassifier], metric: str, names: Optional[Dict[str, str]]
) -> Figure:
    """Plot training curves from XGBoost models.

    Arguments
    ---------
    model
        An instance of XGBRegressor or XGBClassifier
    metric
        Name of metric stored in XGB model
    names
        Dict mapping key in model.evals_result() to the desired key in plot (e.g.,
        {'validation_0': 'train', 'validation_1': 'valid'}). If not provided, then
        a default mapping is created to map key to itself.

    Returns
    -------
    fig
        Resulting Figure object
    """
    fig = plt.figure()
    evals_result = model.evals_result()

    # create a default mapping if names is not provided
    if not names:
        names = {name: name for name in evals_result.keys()}

    df = pd.DataFrame({names.get(name, name): evals_result[name][metric] for name in evals_result})

    ax = sns.lineplot(data=df)
    plt.grid()
    ax.set_xlabel("Iterations")
    ax.set_ylabel(metric)
    plt.tight_layout()

    return fig


@beartype
def plot_feature_importance(model, feature_names: List[str], k: int = 20) -> Figure:
    """Plot model feature importance.

    Arguments
    ---------
    model
        Any model which follows the sklearn API
    feature_names
        List of feature names that match the order of features seen by model during
        training
    k
        Number of features to include; to include all features set k < 0 (not
        recommeded because it will really crowd the plot)

    Returns
    -------
    fig
        Resulting Figure object
    """
    if hasattr(model, "feature_importances_") is False:
        raise ModelFeatImpMissingError
    if len(model.feature_importances_) != len(feature_names):
        err_msg = (
            f"Number of feature_names ({len(feature_names)}) does not match "
            f"number of feature importances ({len(model.feature_importances_)})"
        )
        raise IncompatibleFeaturesError(err_msg)

    df = pd.DataFrame({"feature": feature_names, "importance": model.feature_importances_})

    # sort features from high to low
    df = df.sort_values("importance", ascending=True)
    if k > 0:
        df = df.iloc[-k:]
    df["feature_abbrev"] = df["feature"].str.slice(0, 40)

    N = df.shape[0]
    fig = plt.figure(figsize=(5, 10))
    plt.grid()
    plt.barh(y=range(N), width=df["importance"], height=0.3)
    plt.yticks(range(N), df["feature_abbrev"])
    plt.xlabel("Importance")
    plt.ylabel("")
    title_suffix = f": Top {N} features" if k > 0 else ": All nonzero features"
    plt.title("Feature Importance" + title_suffix)

    return fig


@beartype
def plot_roc(model, valid_x: Union[np.ndarray, pd.DataFrame, csr_matrix], valid_y: np.ndarray) -> Figure:
    """Plot Receiver Operating Curve (ROC) and AUROC

    Args:
        model: Any model which follows the sklearn API
        valid_x (np.ndarray or pd.DataFrame): Validation feature set
        valid_y (np.ndarray): Validation label set

    Returns:
        Figure: Resulting Figure object
    """
    assert_dimensions_align(valid_x, valid_y)
    if hasattr(model, "predict") is False:
        raise ModelPredictMissingError

    valid_probs = model.predict_proba(valid_x)[:, 1]
    fpr, tpr, _ = metrics.roc_curve(valid_y, valid_probs)
    auroc = metrics.roc_auc_score(valid_y, valid_probs)

    fig = plt.figure(figsize=(10, 6))
    plt.grid()
    plt.plot(fpr, tpr)
    plt.axline(xy1=(0, 0), slope=1, linestyle="--", color="black")
    plt.title(f"Area under the Receiver-Operating Curve\nAUROC={auroc:.2f}")
    plt.ylabel("TPR")
    plt.xlabel("FPR")

    return fig


@beartype
def plot_precision_recall(model, valid_x: Union[np.ndarray, pd.DataFrame, csr_matrix], valid_y: np.ndarray) -> Figure:
    """Plot precision recall curve

    Args:
        model: Any model which follows the sklearn API
        valid_x (np.ndarray or pd.DataFrame): Validation feature set
        valid_y (np.ndarray): Validation label set

    Returns:
        Figure: Resulting Figure object
    """
    assert_dimensions_align(valid_x, valid_y)
    if hasattr(model, "predict") is False:
        raise ModelPredictMissingError

    valid_probs = model.predict_proba(valid_x)[:, 1]
    prec, rec, _ = metrics.precision_recall_curve(valid_y, valid_probs)
    auprc = metrics.average_precision_score(valid_y, valid_probs)

    fig = plt.figure(figsize=(10, 6))
    plt.plot(rec, prec)
    plt.grid()
    plt.axhline(y=valid_y.mean(), color="black", linestyle="--")
    plt.annotate(
        f"Baseline precision={np.round(valid_y.mean(), 2)}",
        (1.0, valid_y.mean()),
        textcoords="offset points",
        xytext=(0, 10),
        ha="right",
    )
    plt.title(f"Precision-Recall Curve\nAUPRC={auprc:.2f}")
    plt.ylabel("Precision")
    plt.xlabel("Recall")

    return fig


@beartype
def plot_reliability(model, valid_x: Union[np.ndarray, pd.DataFrame, csr_matrix], valid_y: np.ndarray) -> Figure:
    """Plot reliability curve and Brier score

    Reliability plots assess the calibration of the model probabilities (e.g.
    do 90% of the rows with 90% probability actually have a positive label).
    Brier score summarizes the entire calibration over the whole validation set,
    with 0 being perfect and higher as worse. Formula:

    Brier Score = (1/n)*∑_i (p_i - r_i)^2
        where r_i = {
            0 for negative label
            1 for positive label
        }

    Args:
        model: Any model which follows the sklearn API
        valid_x (np.ndarray or pd.DataFrame): Validation feature set
        valid_y (np.ndarray): Validation label set

    Returns:
        Figure: Resulting Figure object
    """
    assert_dimensions_align(valid_x, valid_y)
    if hasattr(model, "predict") is False:
        raise ModelPredictMissingError

    valid_probs = model.predict_proba(valid_x)[:, 1]
    preds = pd.DataFrame({"prob": valid_probs, "resp": valid_y})
    preds["prob_bin"] = pd.cut(
        preds["prob"], bins=np.arange(0, 1.1, 0.1), labels=[str(np.round(x, 1)) for x in np.arange(0, 1, 0.1)]
    )
    reliab = preds.groupby("prob_bin", as_index=False).agg(mean_resp=("resp", "mean"), count=("resp", "count"))
    reliab["prob_bin_center"] = reliab["prob_bin"].astype(float) + 0.05

    brier_score = metrics.brier_score_loss(valid_y, valid_probs)

    fig = plt.figure(figsize=(10, 6))
    plt.grid()
    sns.scatterplot(data=reliab, x="prob_bin_center", y="mean_resp", size="count", color="C0")
    plt.axline(xy1=(0, 0), xy2=(1, 1), linestyle="--", color="black")
    plt.xlabel("Mean predicted probability")
    plt.ylabel("Mean response value")
    plt.title(f"Reliability plot\nBrier score={brier_score:.2f}")

    return fig
