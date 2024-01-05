# -*- coding: utf-8 -*-
from __future__ import annotations

from copy import deepcopy

import numpy as np
import pandas as pd
from sklearn.compose import make_column_transformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler


class ModelPrepare:
    def __init__(self, df: pd.DataFrame, id_col: str, label_col: str):
        """Constructor method for ModelPrepare

        Args:
            df (pd.DataFrame): model data, including features, response, and ID
            id_col (str): name of column holding row ID's
            LABEL_COL (str): name of column holding response
        """
        if (id_col not in df.columns) or (label_col not in df.columns):
            raise (ValueError(f"{id_col} or {label_col} not found in columns"))
        if df[id_col].nunique() != df.shape[0]:
            raise (RuntimeError(f"ID column {id_col} must be unique for sampling"))

        self.df = df
        self.id_col = id_col
        self.label_col = label_col

        self.feat_cols = list(set(df.columns) - {id_col} - {label_col})
        self.categ_cols = [col for col in self.feat_cols if df[col].dtype == "object"]

        # these variables will get instantiated in the `random_splitter` method
        self.train_x, self.valid_x, self.test_x = pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
        self.train_y, self.valid_y, self.test_y = np.array([]), np.array([]), np.array([])
        self.train_ids, self.valid_ids, self.test_ids = np.array([]), np.array([]), np.array([])

    def one_hot_encoder(self, drop_collinear: bool = False):
        """Applies one-hot-encoding to model data

        Args:
            drop_collinear (bool, optional): If True, drop levels which would
                cause collinearity. Defaults to False.
        """
        df, categ_cols = self.df, self.categ_cols

        # force categorical columns to be strings
        for col in categ_cols:
            df[col] = df[col].astype(str)

        # run one-hot-encoding
        if not drop_collinear:
            print("Keeping all categorical levels")
            ohe = OneHotEncoder()
        else:
            print("Dropping collinear categorical levels")
            ohe = OneHotEncoder(drop="first")
        transformer = make_column_transformer((ohe, categ_cols), remainder="passthrough")
        transformed = transformer.fit_transform(df)
        transformed_df = pd.DataFrame(transformed, columns=transformer.get_feature_names_out(list(df.columns)))
        # clean up column names
        transformed_df.columns = [col.split("__")[1] for col in transformed_df.columns]

        print(
            f"Converted {len(categ_cols)} categorical features into",
            f"{transformed_df.shape[1] - df.shape[1]} OHE columns",
            f"\nFinal number of features: {transformed_df.shape[1]}",
        )
        self.df = transformed_df
        self.feat_cols = list(set(self.df.columns) - {self.id_col} - {self.label_col})

        return None

    def random_splitter(self, seed: int = 123, split_frac: tuple = (0.7, 0.15, 0.15)):
        """Randomly split data into train, valid, and test sets

        Args:
            seed (int, optional): Random seed integer. Defaults to 123.
            split_frac (tuple, optional): Proportions to split data by. Defaults to (.7, .15, .15).
        """
        # process inputs
        train_split, valid_split, test_split = split_frac
        if train_split + valid_split + test_split != 1:
            raise ValueError("split_frac elements must sum to 1")
        df, id_col, label_col, feat_cols = self.df, self.id_col, self.label_col, self.feat_cols

        # shuffle ID's
        all_ids = deepcopy(df[id_col].values)
        print(f"Random seed: {seed}")
        np.random.seed(seed)
        np.random.shuffle(all_ids)
        N = all_ids.shape[0]

        # split indices
        train_size = int(train_split * N)
        train_valid_size = int((train_split + valid_split) * N)
        train_ids = all_ids[0:train_size]
        valid_ids = all_ids[train_size:train_valid_size]
        test_ids = all_ids[train_valid_size:N]

        # split data
        df = df.set_index(id_col, inplace=False)
        tr_df = df.loc[train_ids]
        va_df = df.loc[valid_ids]
        te_df = df.loc[test_ids]

        tr_x = tr_df[feat_cols]
        tr_y = tr_df[label_col].values

        va_x = va_df[feat_cols]
        va_y = va_df[label_col].values

        te_x = te_df[feat_cols]
        te_y = te_df[label_col].values

        # run checks
        if tr_x.shape[0] + va_x.shape[0] + te_x.shape[0] != N:
            raise ValueError("Number of rows in features don't match!")
        if tr_y.shape[0] + va_y.shape[0] + te_y.shape[0] != N:
            raise ValueError("Number of rows in responses don't match!")

        self.train_x, self.valid_x, self.test_x = tr_x, va_x, te_x
        self.train_y, self.valid_y, self.test_y = tr_y, va_y, te_y
        self.train_ids, self.valid_ids, self.test_ids = train_ids, valid_ids, test_ids

        return None

    def standard_scaler(self):
        """Standardize and scale data: each column has mean 0 and variance 1."""
        scaler = StandardScaler().fit(self.train_x)

        self.train_x = scaler.transform(self.train_x)
        self.valid_x = scaler.transform(self.valid_x)
        self.test_x = scaler.transform(self.test_x)

        return None

    def lgb_preparer(self):
        df, feat_cols = self.df, self.feat_cols
        for col in feat_cols:
            if df[col].dtype == "object" or df[col].dtype == "category":
                df[col] = df[col].astype("category")

    def return_features(self, return_pandas: bool = False) -> tuple:
        """Return tuple with train, valid, test features

        Args:
            return_pandas (bool, optional)
                whether to return data as dataframes; if False, return as np arrays
        """
        tr_x = self.train_x
        va_x = self.valid_x
        te_x = self.test_x

        # if required and needed, convert to numpy array:
        if not return_pandas and isinstance(tr_x, pd.DataFrame):
            tr_x, va_x, te_x = (_.values for _ in (tr_x, va_x, te_x))

        print("Feature rows:", tr_x.shape[0], va_x.shape[0], te_x.shape[0])
        return (tr_x, va_x, te_x)

    def return_responses(self) -> tuple:
        """Return tuple with train, valid, test responses"""
        print("Response rows:", self.train_y.shape[0], self.valid_y.shape[0], self.test_y.shape[0])
        return (self.train_y, self.valid_y, self.test_y)

    def get_split_ids(self) -> tuple:
        """Return tuple with ID's for train, valid, test splits"""
        return (self.train_ids, self.valid_ids, self.test_ids)

    def get_feature_cols(self) -> list:
        """Return list of feature column names

        Returns:
            list: List of feature column names
        """
        return self.feat_cols
