# -*- coding: utf-8 -*-
from __future__ import annotations

import os
import pickle
from typing import List
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import xgboost as xgb
from sklearn import metrics

plt.rcParams["axes.grid"] = True

LINEAR_MODULE = "sklearn.linear_model"
LIGHTGBM_MODULE = "lightgbm.sklearn"


class ModelTrain:
    """ModelTrain class: used for tuning hyperparameters and plotting model performance"""

    def __init__(self, mdl_class, **mdl_init_args: dict) -> None:
        """Constructor method for ModelTrain

        Args:
            mdl_class: Model class following sklearn API
            **mdl_init_args: Keyword arguments passed onto model's `__init__()` method
        """
        self.mdl_class = mdl_class
        self.mdl_init_args = mdl_init_args
        self.mdl = self.mdl_class(**mdl_init_args)

        mdl_module = mdl_class.__dict__["__module__"]
        mdl_module = LINEAR_MODULE if mdl_module.startswith(LINEAR_MODULE) else mdl_module
        self.mdl_module = mdl_module

        self.hyper_grid = pd.DataFrame()

        self.hyper_perf = pd.DataFrame()
        self.hyper_best: Optional[int] = None
        self.hyper_probs: Optional[pd.DataFrame] = None
        self.mdl_list: List[xgb.XGBClassifier] = []
        self.coefs_list: List[np.ndarray] = []

        self.eval_metric: Optional[str] = None
        self.valid_y = np.array([])

        self.plot_generic_save_path: Optional[str] = None
        self.plot_save_prefix: Optional[str] = None
        self.plot_save_type: Optional[str] = None
        self.plot_save_kwargs: Optional[dict] = None

    def set_hyper_grid(self, hyper_grid: pd.DataFrame) -> None:
        """Set hyperparameters to search over

        Args:
            hyper_grid (pd.DataFrame): Dataframe: each column is a different hyperparameter.
        """
        if type(hyper_grid) != pd.DataFrame:
            raise (ValueError("hyperparams must be pd.DataFrame"))
        self.hyper_grid = hyper_grid

        return None

    def _create_default_hyper(self) -> dict:
        hps = self.mdl.get_params()
        return pd.DataFrame(hps, index=[0])

    def tune_hyperparams(
        self,
        train_x,
        train_y,
        valid_x,
        valid_y,
        hyper_eval_metric: str = "auroc",
        hyper_eval_metric_max: bool = True,
        **fit_kwargs: dict,
    ) -> None:
        """Search over hyperparameters for best fit

        Args:
            train_x (np.ndarray, pd.DataFrame): Training set feature matrix
            train_y (np.ndarray): Training set labels
            valid_x (np.ndarray, pd.DataFrame): Validation set feature matrix
            valid_y (np.ndarray): Validation set labels
            hyper_eval_metric (str, optional): Metric to optimize. Defaults to 'auroc'.
            hyper_eval_metric_max (bool, optional): Whether or not to maximize `hyper_eval_metric`. Defaults to True.
            fit_kwargs (dict): Other keyword arguments passed to model's `.fit()` method
        """
        # process hypergrid and arguments
        hyper_grid = self.hyper_grid
        if not len(hyper_grid):
            hyper_grid = self._create_default_hyper()
        num_hypers = hyper_grid.shape[0]
        if hyper_eval_metric not in ("auroc", "log_loss", "brier"):
            raise (ValueError(f"eval_metric {hyper_eval_metric} not recognized"))
        mdl = self.mdl

        # loop through hyper grid and log performance metrics
        hyper_perf = pd.DataFrame(columns=["i", "hyper_param", "auroc", "log_loss", "brier"])
        hyper_probs = pd.DataFrame(columns=["i", "prob"])
        for i in range(num_hypers):
            # set hyper params
            print(f"\nTraining hyperparameter set {i+1}/{num_hypers}")
            hps = dict(hyper_grid.iloc[i])

            # annoying hack to get int hyperparams to behave correctly
            if self.mdl_module == LIGHTGBM_MODULE:
                hps = {
                    key: (np.int64(val) if (type(val) == np.float64 and np.mod(val, 1) == 0) else val)
                    for key, val in hps.items()
                }

            mdl.set_params(**hps)

            # fit model
            mdl.fit(train_x, train_y, **fit_kwargs)

            # log performance metrics and probabilities
            p = mdl.predict_proba(valid_x)[:, 1]
            auroc = metrics.roc_auc_score(valid_y, p)
            log_loss = metrics.log_loss(valid_y, p)
            brier = metrics.brier_score_loss(valid_y, p)

            metrics_row = pd.DataFrame(
                [[i, hps, auroc, log_loss, brier]],
                columns=["i", "hyper_param", "auroc", "log_loss", "brier"],
                index=[i],
            )
            hyper_perf = pd.concat([hyper_perf, metrics_row], ignore_index=True)

            prob_df = pd.DataFrame({"i": i, "prob": p})
            hyper_probs = pd.concat([hyper_probs, prob_df], ignore_index=True)
            m_ = np.round(metrics_row.iloc[0][hyper_eval_metric], 3)
            print(f"Finished hyperparameter set {i+1}/{num_hypers}; valid {hyper_eval_metric}={m_}")

            self.mdl_list.append(mdl)

            if self.mdl_module == LINEAR_MODULE:
                self.coefs_list.append(mdl.coef_.ravel().copy())

        hyper_eval_metric = hyper_perf[hyper_eval_metric]
        hyper_best = np.argmax(hyper_eval_metric) if hyper_eval_metric_max else np.argmin(hyper_eval_metric)

        self.hyper_perf = hyper_perf
        self.hyper_probs = hyper_probs
        self.eval_metric = hyper_eval_metric
        self.hyper_best = int(hyper_best)
        self.valid_y = valid_y

        return None

    def get_hyperperf(self) -> pd.DataFrame:
        """Return dataframe of hyperparameter performance

        Returns:
            pd.DataFrame: Each row gives hyperparameter performance on variety of metrics
        """
        return self.hyper_perf

    def get_model(self, i: int = None):
        """Get model artifact

        Args:
            i (int): Return `i`-th hyperparameter combination (defaults to best)
        """
        if i is None:
            i = self.hyper_best
        return self.mdl_list[i]

    def _process_arg_hyper_iter(self, hyper_iter):
        if hyper_iter is None:
            hyper_iter = self.hyper_best
        else:
            if 0 > hyper_iter or hyper_iter > len(self.mdl_list):
                raise (ValueError("hyper_iter must be in [0, num_hypers]"))
        return hyper_iter

    def predict(self, new_x, hyper_iter: int = None, probs=True) -> np.ndarray:
        """Score selected model against given features

        Args:
            newX (np.ndarray): New feature matrix
            hyper_iter (int): Hyperparameter iteration to predict with

        Returns:
            np.ndarray: Predictions
        """
        hyper_iter = self._process_arg_hyper_iter(hyper_iter)
        mdl = self.mdl_list[hyper_iter]
        if probs:
            p = mdl.predict_proba(new_x)[:, 1]
        else:
            p = mdl.predict(new_x)
        return p

    def save_model(self, save_path: str, hyper_iter: int = None):
        """
        Save selected model in JSON format
        """
        hyper_iter = self._process_arg_hyper_iter(hyper_iter)
        mdl = self.mdl_list[hyper_iter]

        save_dir = os.path.dirname(save_path)
        if not os.path.exists(save_dir):
            raise (ValueError(f"{save_dir} does not exist"))
        print(f"Saving model to: {save_path}")

        mdl.save_model(save_path)

        return None

    @staticmethod
    def read_pickle(read_path: str):
        with open(read_path, "rb") as f:
            x = pickle.load(f)
        return x

    @staticmethod
    def read_json(read_path: str):
        mdl = xgb.XGBClassifier()
        mdl.load_model(read_path)
        return mdl

    def confusion_matrix(self, prob_thresh=0.5, normalize=None):
        """Return confusion matrix at given threshold

        Args:
            prob_thresh (float, optional): Threshold to binarize. Defaults to 0.5.
            normalize (_type_, optional): {'true', 'pred', 'all'}. Defaults to None.
        """
        valid_y = self.valid_y
        hyper_probs = self.hyper_probs
        hyper_best = self.hyper_best

        # Binarize the probabilities
        probs = hyper_probs[hyper_probs["i"] == hyper_best]["prob"]
        probs_bin = np.where(probs >= prob_thresh, 1, 0)

        conf_mat = metrics.confusion_matrix(valid_y, probs_bin, normalize=normalize)
        return conf_mat

    def set_plot_options(self, save_path: str, save_prefix: str, save_type: str, save_kwargs: dict = None):
        self.plot_generic_save_path = save_path
        self.plot_save_prefix = save_prefix
        self.plot_save_type = save_type
        self.plot_save_kwargs = save_kwargs

    def plot_roc(self) -> None:
        """Plot ROC curve using best hyperparameter combination"""
        valid_y = self.valid_y
        hyper_probs = self.hyper_probs
        hyper_perf = self.hyper_perf
        hyper_best = self.hyper_best

        probs = hyper_probs[hyper_probs["i"] == hyper_best]["prob"]
        fpr, tpr, _ = metrics.roc_curve(valid_y, probs)
        auroc = np.round(hyper_perf.iloc[hyper_best]["auroc"], 2)

        plt.figure(figsize=(10, 6))
        plt.plot(fpr, tpr)
        plt.axline(xy1=(0, 0), slope=1, linestyle="--")
        plt.title(f"Area under the Receiver-Operating Curve\nAUROC={auroc}")
        plt.ylabel("TPR")
        plt.xlabel("FPR")

        if self.plot_generic_save_path is not None:
            self._save_plot("_roc")

        return None

    def plot_prec_rec(self, invert=False) -> None:
        """Plot precision-recall curve using best hyperparameter combination

        Args:
            invert (bool, optional): Invert classes and probabilities. Defaults to False.
        """
        valid_y = self.valid_y
        hyper_probs = self.hyper_probs
        hyper_best = self.hyper_best
        probs = hyper_probs[hyper_probs["i"] == hyper_best]["prob"]

        if invert:
            valid_y = 1 - valid_y
            probs = 1 - probs

        prec, rec, _ = metrics.precision_recall_curve(valid_y, probs)
        auprc = np.round(metrics.average_precision_score(valid_y, probs), 2)

        plt.figure(figsize=(10, 6))
        plt.plot(rec, prec)
        plt.axhline(y=valid_y.mean(), color="black", linestyle=":")
        plt.annotate(
            f"Baseline precision={np.round(valid_y.mean(), 2)}",
            (1.0, valid_y.mean()),
            textcoords="offset points",
            xytext=(0, 10),
            ha="right",
        )
        title_txt = f"Precision-Recall Curve\nAUPRC={auprc}"
        title_txt = "Inverted " + title_txt if invert else title_txt
        plt.title(title_txt)
        plt.ylabel("Precision")
        plt.xlabel("Recall")

        if self.plot_generic_save_path is not None:
            suffix = "_prec_rec"
            if invert:
                suffix += "_inverted"
            self._save_plot(suffix)

        return None

    def plot_reliab(self) -> None:
        """Plot reliability curve using best hyperparameter combination"""
        valid_y = self.valid_y
        hyper_probs = self.hyper_probs
        hyper_perf = self.hyper_perf
        hyper_best = self.hyper_best

        preds_best = hyper_probs[hyper_probs["i"] == hyper_best]
        preds_best["resp"] = valid_y

        preds_best["prob_bin"] = pd.cut(
            preds_best["prob"], bins=np.arange(0, 1.1, 0.1), labels=[str(np.round(x, 1)) for x in np.arange(0, 1, 0.1)]
        )
        reliab = preds_best.groupby("prob_bin", as_index=False).agg(mean_resp=("resp", "mean"), count=("resp", "count"))
        reliab["prob_bin_center"] = reliab["prob_bin"].astype(float) + 0.05

        plt.figure(figsize=(10, 6))
        sns.scatterplot(data=reliab, x="prob_bin_center", y="mean_resp", size="count")
        plt.axline(xy1=(0, 0), xy2=(1, 1), linestyle="--")
        plt.xlabel("Mean predicted probability")
        plt.ylabel("Mean response value")
        plt.title(f"Reliability plot\nBrier score={np.round(hyper_perf.iloc[hyper_best]['brier'], 2)}")

        if self.plot_generic_save_path is not None:
            self._save_plot("_reliab")

        return None

    def check_feat_cols_present(self, feat_cols):
        """Check if feature names are supplied

        Args:
            feat_cols (list): List of feature names

        Raises:
            ValueError: If required feature names are not supplied by user
        """
        if feat_cols is None:
            raise ValueError("feat_cols param must be supplied for this model class")

    def plot_feat_imp(
        self,
        max_num_feats: int = 20,
        feat_cols: str = None,
    ) -> None:
        """Plot feature importance using best hyperparameter combination

        Args:
            feat_cols (str, optional): List of feature names (only necessary for linear models). Defaults to None.
            max_num_feats (int): Max number of features to include in importance plot. Defaut=20.

        Raises:
            ValueError: feat_cols must be given for linear models.
        """
        mdl_module = self.mdl_module

        if mdl_module not in ["xgboost.sklearn", LIGHTGBM_MODULE, LINEAR_MODULE]:
            raise (ValueError("Method plot_feat_imp does not currently support given model class"))

        # LGB
        if mdl_module == LIGHTGBM_MODULE:
            mdl = self.mdl_list[self.hyper_best]
            imp = pd.DataFrame({"col": mdl.feature_name_, "imp": mdl.feature_importances_})

        # Linear_model
        if mdl_module == LINEAR_MODULE:
            self.check_feat_cols_present(feat_cols)
            imp = pd.DataFrame({"col": feat_cols, "imp": self.coefs_list[self.hyper_best]})
            imp["imp"] = np.abs(imp["imp"])

        # XGB
        if mdl_module == "xgboost.sklearn":
            self.check_feat_cols_present(feat_cols)
            mdl = self.mdl_list[self.hyper_best]
            imp = pd.DataFrame({"col": feat_cols, "imp": mdl.feature_importances_})

        imp = imp[imp["imp"] > 0]
        num_nz_coefs = imp.shape[0]
        imp.sort_values("imp", ascending=True, inplace=True)
        imp["col_abbrev"] = imp["col"].str.slice(0, 40)

        # Filter to `num_feats` most important features
        num_feats = min(max_num_feats, num_nz_coefs)
        imp = imp.iloc[-num_feats:num_nz_coefs]

        plt.figure(figsize=(5, 15))
        plt.barh(y=range(num_feats), width=imp["imp"], height=0.3)
        plt.yticks(range(num_feats), imp["col_abbrev"])
        plt.xlabel("Importance")
        plt.ylabel("")
        title_suffix = f": Top {num_feats} features" if num_feats < max_num_feats else ": All nonzero features"
        plt.title("Feature Importance" + title_suffix)

        if self.plot_generic_save_path is not None:
            self._save_plot("_feat_imp")

        return None

    def _save_plot(self, plot_name: str):
        """Internal method for saving matplotlib figures

        Args:
            plot_name (str): Name of plot to be saved
        """
        save_path = self.plot_generic_save_path + self.plot_save_prefix + plot_name + "." + self.plot_save_type
        plt.savefig(save_path, **self.plot_save_kwargs)
