# -*- coding: utf-8 -*-
from __future__ import annotations

import argparse
import datetime
import logging
import os
import pickle
from os import environ
from pathlib import Path

import boto3
import numpy as np
import pandas as pd
import psycopg2
from beartype import beartype
from beartype.typing import List
from beartype.typing import Optional
from beartype.typing import Tuple
from decouple import config
from feature_store.query import QueryFeatureStore
from model_utils.model_config import MODEL_REGISTRY_HOME
from model_utils.model_config import ModelConfig
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from model_utils.training.plotting import plot_feature_importance
from model_utils.training.plotting import plot_xgb_training_curves
from normalized_protocol_names.api import NormalizedProtocolNames
from on_scene.enums import ModelName
from sagemaker.session import Session
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error as mae
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import Binarizer
from sklearn.preprocessing import FunctionTransformer
from sklearn.preprocessing import KBinsDiscretizer  # noqa: F401
from sklearn.preprocessing import OneHotEncoder
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

# get logger
logger = logging.getLogger(__name__)
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)

logger.info(f"curdir = {os.getcwd()}")

# ---------------------------------------------
# PLEASE UPDATE THESE CONSTANTS
# ---------------------------------------------
# some training parameters
START_TIME = datetime.datetime(2022, 5, 1)
END_TIME = datetime.datetime(2023, 6, 1)
START_DATE = START_TIME.date()
END_DATE = END_TIME.date()
EVAL_METRIC = "mae"
NITER = 2000


# Define constants
# SCRIPT_DIR = Path(os.path.realpath(__file__)).parent
SCRIPT_DIR = Path(os.getcwd())
# for testing locally
# MODEL_REGISTRY_HOME = '/Users/kuanghan.huang/risk-strat-dev/model_registry'
PROV_SCORE_FEATURE_GROUP = "on_scene_model_user_lookup"
FEATURE_STORE_ROLE = config(
    "FEATURE_STORE_ROLE",
    default="arn:aws:iam::792470144447:role/sagemaker_feature_store",
)

MODEL_OUTPUT_DIRECTORY = config("ON_SCENE_MODEL_OUTPUT_DIR", default=os.getcwd())
logger.info(f"MODEL_OUTPUT_DIRECTORY = {MODEL_OUTPUT_DIRECTORY}")

SOCIAL_HISTORY_COLS = [
    "has_advance_directive",
    "has_alcohol_use_education",
    "has_lacks_transportation",
    "has_food_insecurity",
    "has_food_insecurity_worry",
    "has_activities_daily_living",
    "has_fall_risk_unsteady",
    "has_fall_risk_worry",
    "has_fall_risk_provider",
    "has_feels_unsafe",
    "has_social_support_taking_advantage",
    "has_lacks_social_interactions",
    "has_excessive_alcohol_drug_use",
    "has_cost_concerns",
    "has_housing_insecurity",
    "has_resource_help_requested",
]

MEDICATION_COLUMNS = [
    "a_med",
    "b_med",
    "c_med",
    "d_med",
    "f_med",
    "g_med",
    "h_med",
    "j_med",
    "l_med",
    "m_med",
    "n_med",
    "p_med",
    "q_med",
    "r_med",
    "s_med",
    "u_med",
    "v_med",
    "w_med",
    "x_med",
    "y_med",
    "z_med",
]

COMORBIDITY_BOOL_COLUMNS = [
    "has_hypertension",
    "has_high_cholesterol",
    "has_diabetes",
    "has_asthma",
    "has_copd",
    "has_cancer",
    "has_coronary_artery_disease",
    "has_stroke",
    "has_kidney_disease",
    "has_depression",
    "has_pulmonary_embolism",
]
AWS_PROFILE = config("AWS_PROFILE", default=None)

# Redshift connection parameters; use env var names that DWH uses here:
# https://github.com/*company-data-covered*/dwh/blob/stg/.github/workflows/dbt_actions_prd.yml
REDSHIFT_CONNECTION_ARGS = {
    "host": environ["REDSHIFT_HOST"],
    "database": environ["REDSHIFT_DBNAME"],
    "user": environ["REDSHIFT_USERNAME"],
    "password": environ["REDSHIFT_PASSWORD"],
    "port": environ["REDSHIFT_PORT"],
}

# Define risk protocol normalization
# get S3 client and risk protocol mapping version
sess = boto3.Session(profile_name=AWS_PROFILE)
s3 = sess.client("s3")
names = NormalizedProtocolNames(s3)
risk_protocol_mapping = names.get_latest_mapping()
RISK_PROTOCOL_MAPPER = RiskProtocolPreprocessor(risk_protocol_mapping)

LATEST_RP_VERSION = NormalizedProtocolNames(s3).get_latest_version()
logger.info(f"latest risk protocol mapping version = {LATEST_RP_VERSION}")

# Define list of transformers
TRANSFORMERS = [
    # process risk protocol
    (
        "protocol",
        Pipeline(
            steps=[
                (
                    "onehot_encode_protocol_keyword",
                    OneHotEncoder(handle_unknown="ignore"),
                ),
            ]
        ),
        ["protocol_keyword"],
    ),
    (
        "age",
        Pipeline([("impute", SimpleImputer()), ("scaler", StandardScaler())]),
        ["patient_age"],
    ),
    (
        "risk_score",
        Pipeline([("impute", SimpleImputer()), ("scaler", StandardScaler())]),
        ["risk_score"],
    ),
    ("new_patient", SimpleImputer(), ["first_visit"]),
    ("num", StandardScaler(), ["max_num_care_requests"]),
    (
        "service",
        OneHotEncoder(
            categories=[
                [
                    "Acute Care",
                    "Tele-presentation",
                    "BridgeCare",
                    "Bridge Care (HPN- Case Management Initiated)",
                    "Acute Care (Patient Initiated)",
                ]
            ],
            handle_unknown="ignore",
        ),
        ["service_line_name"],
    ),
    (
        "pos",
        OneHotEncoder(
            categories=[
                [
                    "Home",
                    "Virtual Visit",
                    "Assisted Living Facility",
                    "Independent Living Facility",
                    "Hotel",
                    "Work",
                    "Long-term Care Facility",
                ]
            ],
            handle_unknown="ignore",
        ),
        ["place_of_service_original"],
    ),
    ("market", OneHotEncoder(handle_unknown="ignore"), ["market_name"]),
    ("month", StandardScaler(), ["month"]),
    (
        "home_health",
        OneHotEncoder(handle_unknown="ignore"),
        ["high_level_home_health_provider"],
    ),
    ("social", SimpleImputer(strategy="most_frequent"), SOCIAL_HISTORY_COLS),
    (
        "med",
        Pipeline(
            [
                ("impute", SimpleImputer(strategy="constant", fill_value=0)),
                ("scaler", StandardScaler()),
            ]
        ),
        MEDICATION_COLUMNS,
    ),
    ("gender", SimpleImputer(), ["female"]),
    ("prev_time", SimpleImputer(), ["avg_prev_stop_time"]),
    (
        "comorbid",
        SimpleImputer(strategy="constant", fill_value=False),
        COMORBIDITY_BOOL_COLUMNS,
    ),
    (
        "comorbid_counts",
        Pipeline([("impute", SimpleImputer()), ("scaler", StandardScaler())]),
        ["comorbidities_count"],
    ),
    ("shift_team", SimpleImputer(), ["shift_team_score"]),
    ("is_tele", Binarizer(threshold=0.5), ["is_tele_presentation_visit"]),
]


# Define util functions
# function to pull data from redshift
def get_df_from_query(query: str, params=None) -> pd.DataFrame:
    """Run a SQL query and return results in a dataframe.

    Arguments
    ---------
    query
        SQL query string
    params
        Additional params for pd.read_sql

    Returns
    -------
    df
        SQL query results in a dataframe
    """
    with psycopg2.connect(**REDSHIFT_CONNECTION_ARGS) as conn:
        df = pd.read_sql(query, conn, params=params)
    return df


@beartype
def load_raw_data(
    start_date: datetime.date = START_TIME.date(),
    end_date: datetime.date = END_TIME.date(),
    add_derived: bool = True,
    kept_cols: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Load raw training data.

    Getting data from redshift for now, but will refactor to get data from feature
    store instead.

    Arguments
    ---------
    start_date
        Start date of training data
    end_date
        End date of training data
    add_derived
        Whether to add derived features
    kept_cols
        Output columns

    """
    query_path = SCRIPT_DIR / "data.sql"
    with open(query_path) as f:
        query = f.read()
    args = {"start_date": start_date, "end_date": end_date}
    raw_df = get_df_from_query(query, args)
    # remove rows with missing risk protocols
    raw_df = raw_df.dropna(subset=["risk_protocol"])

    if add_derived:
        raw_df = add_derived_features(raw_df)

    if kept_cols is None:
        return raw_df

    return raw_df[kept_cols]


@beartype
def add_derived_features(
    raw_df: pd.DataFrame,
) -> pd.DataFrame:
    """Add some derived features to the dataframe.

    Here is the list of derived features:
    - shift_team_score

    Arguments
    ---------
    raw_df
        raw features

    Returns
    -------
    df
        Dataframe with derived features
    """
    df = raw_df.copy()
    # add event date to merge with shift team score from feature store
    df["event_date"] = df["complete_datetime"].apply(lambda x: x.date().strftime("%Y-%m-%d"))

    shift_team_scores = load_shift_team_scores_feature_store(START_TIME, END_TIME)
    df = df.merge(shift_team_scores, on=["shift_team_id", "event_date"], how="left")
    return df


def prov_score_event_time_to_date(event_time: int) -> str:
    """Convert event_time (timestamp) to date string YYYY-MM-DD

    But also we should account for the fact that prov_score on DATE will be
    used by care requests on DATE + 1 day, so we should subtract event_time by
    1 day in order to join with care requests' date to get the correct prov_score
    that a care request would have seen.
    """
    event_date = datetime.datetime.fromtimestamp(event_time) - datetime.timedelta(days=1)
    return event_date.strftime("%Y-%m-%d")


def load_shift_team_scores_feature_store(
    start_time: datetime.datetime = START_TIME, end_time: datetime.datetime = END_TIME
) -> pd.DataFrame:
    """Load shift team scores from feature store within a time range.

    Arguments
    ---------
    start_time
        Start of training data time range
    end_time
        End of training data time range

    Returns
    -------
    df_team
        Dataframe containing avg shift team score per team
    """
    sm_session = Session()

    qfs = QueryFeatureStore(
        sagemaker_session=sm_session,
        feature_group_name=PROV_SCORE_FEATURE_GROUP,
        role=FEATURE_STORE_ROLE,
    )
    # get offline features within start_time and end_time
    df, _ = qfs.get_features_records_with_event_time_range(
        start_time=start_time,
        end_time=end_time,
    )
    # filter by only DHMTs and APPs
    df = df.loc[df.position.str.lower().isin(["dhmt", "advanced practice provider"])]

    # get event date from event_time
    df["event_date"] = df["event_time"].apply(prov_score_event_time_to_date)

    # get avg prov_score per shift team
    df_team = (
        df.groupby(["shift_team_id", "event_date"])
        .agg({"prov_score": np.mean})
        .reset_index()
        .rename(columns={"prov_score": "shift_team_score"})
    )

    return df_team


def xgb_regressor():
    return XGBRegressor(
        learning_rate=0.01,
        objective="reg:squarederror",
        n_estimators=NITER,
        max_depth=6,
        min_child_weight=5,
        gamma=0,
        subsample=0.8,
        colsample_bytree=0.8,
        seed=27,
        eval_metric=EVAL_METRIC,
        early_stopping_rounds=25,
    )


@beartype
def get_transformers_from_list(transformer_list: List[str]) -> List[Tuple]:
    """Select a list of transformers to use for feature preprocessing.

    Arguments
    ---------
    transformer_list
        List of transformer names

    Returns
    -------
    ts
        List of tuples that specify sklearn transformers
    """
    ts = [t for t in TRANSFORMERS if t[0] in transformer_list]
    assert len(ts) == len(transformer_list)
    return ts


def get_expected_columns(transformers):
    """Get list of required columns in the raw training dataframe."""
    # get and print expected columns in the input dataframe -- this informs the
    # server which columns it should construct out of the request
    expected_columns = set(["risk_protocol"])
    for transformer in transformers:
        expected_columns = expected_columns.union(set(transformer[2]))

    # but take protocol_keyword column out of expected_columns because this
    # column will only be created by the first step of the pipeline
    expected_columns.remove("protocol_keyword")
    logger.info(f"Expected columns: {expected_columns}")
    return list(expected_columns)


# Define main function
def main(
    *, register: bool = False, description: str = "", logt: bool = True, raw_df_file: Optional[str] = None
) -> None:
    """Main model training function.

    NOTE: we're using log(on_scene_time) as label, so predicted on-scene time
    from the model is np.exp(prediction).

    Arguments
    ---------
    register
        Whether to register the model in model registry or not
    description
        Description of model (only IF register = True)
    logt
        Whether to train on np.log(on_scne_time) or just on_scene_time

    """
    # check that description is not empty if we are registering the model
    if register:
        assert description

    logger.info(f"Training on log(t)? {logt}")

    # raw data comes straight from redshift query -- most similar to what will be available in prod
    # ALSO: needs VPN connection to run
    kept_cols = [
        "care_request_id",
        "risk_protocol",
        # "risk_protocol_standardized",
        "patient_age",
        "risk_score",
        "max_num_care_requests",
        "service_line_name",
        "place_of_service_original",
        "stop_time_per_care_request",
        "shift_team_score",
        "is_tele_presentation_visit",
    ]

    # load raw training data
    if raw_df_file is None:
        raw_df = load_raw_data(START_DATE, END_DATE, add_derived=True, kept_cols=kept_cols)
        raw_df.to_pickle(SCRIPT_DIR / "raw_df.pkl")
        logger.info("Saved raw_df to disk.")
    else:
        raw_df = pd.read_pickle(raw_df_file)

    # split into train/validation/test sets
    raw_train_df = raw_df[raw_df["care_request_id"].apply(lambda cr: cr % 10 > 1)]
    raw_val_df = raw_df[raw_df["care_request_id"].apply(lambda cr: cr % 10 == 1)]
    raw_test_df = raw_df[raw_df["care_request_id"].apply(lambda cr: cr % 10 == 0)]

    # save data to disk
    with open("raw_train_df.pkl", "wb") as f:
        pickle.dump(raw_train_df, f)
    with open("raw_val_df.pkl", "wb") as f:
        pickle.dump(raw_val_df, f)
    with open("raw_test_df.pkl", "wb") as f:
        pickle.dump(raw_test_df, f)

    # choose which transformers are used -- in particular to limit to those features we want to use
    transformer_list = [
        "age",
        "num",
        "protocol",
        "risk_score",
        "pos",
        "service",
        "shift_team",
        # "is_tele",
    ]
    used_transformers = get_transformers_from_list(transformer_list)
    logger.info(f"{len(used_transformers)} are selected.")

    # get and print expected columns in the input dataframe -- this informs the
    expected_columns = get_expected_columns(used_transformers)

    # also make sure raw_df has all the expected columns
    for col in expected_columns:
        assert col in raw_df.columns

    logger.info("*" * 60)
    logger.info("Here are the expected columns in training data:")
    for col in expected_columns:
        logger.info(f"- {col}")
    logger.info("*" * 60)

    # define preproc pipeline; we will pickle the whole thing with model
    preproc_pipeline = Pipeline(
        steps=[
            # ("risk_protocol", FunctionTransformer(convert_df_to_protocol_keyword)),
            ("risk_protocol", FunctionTransformer(RISK_PROTOCOL_MAPPER.run)),
            ("prep", ColumnTransformer(transformers=used_transformers)),
        ]
    )
    xgb_model = xgb_regressor()

    x_train_raw = raw_train_df.loc[:, expected_columns]
    x_val_raw = raw_val_df.loc[:, expected_columns]
    x_test_raw = raw_test_df.loc[:, expected_columns]
    y_train = raw_train_df["stop_time_per_care_request"]
    y_val = raw_val_df["stop_time_per_care_request"]
    y_test = raw_test_df["stop_time_per_care_request"]

    if logt:
        y_train = np.log(y_train)
        y_val = np.log(y_val)
        y_test = np.log(y_test)

    logger.info(f"Training set has {len(y_train)} examples.")
    logger.info(f"Validation set has {len(y_val)} examples.")
    logger.info(f"Test set has {len(y_test)} examples.")

    x_train = preproc_pipeline.fit_transform(x_train_raw)
    x_val = preproc_pipeline.transform(x_val_raw)
    x_test = preproc_pipeline.transform(x_test_raw)
    feature_names = preproc_pipeline[-1].get_feature_names_out()
    logger.info(f"X_train.shape = {x_train.shape}")
    logger.info(f"X_val.shape = {x_val.shape}")
    logger.info(f"X_test.shape = {x_test.shape}")

    # fit model with validation set
    xgb_model.fit(
        x_train,
        y_train,
        eval_set=[(x_train, y_train), (x_val, y_val)],
        verbose=25,
    )

    # save preproc pipeline
    with open(os.path.join(MODEL_OUTPUT_DIRECTORY, "preproc_pipeline.pkl"), "wb") as f1:
        pickle.dump(preproc_pipeline, f1)

    # save model in JSON format
    xgb_model.save_model(os.path.join(MODEL_OUTPUT_DIRECTORY, "model.json"))

    # to calculate eval metrics
    y_train_pred = xgb_model.predict(x_train)
    y_val_pred = xgb_model.predict(x_val)
    y_test_pred = xgb_model.predict(x_test)

    # Evaluate on on-scene time, NOT log(on_scene_time)
    if logt:
        y_train_pred_eval = np.exp(y_train_pred)
        y_train_eval = np.exp(y_train)
        y_val_pred_eval = np.exp(y_val_pred)
        y_val_eval = np.exp(y_val)
        y_test_pred_eval = np.exp(y_test_pred)
        y_test_eval = np.exp(y_test)
    else:
        y_train_pred_eval = y_train_pred
        y_train_eval = y_train
        y_val_pred_eval = y_val_pred
        y_val_eval = y_val
        y_test_pred_eval = y_test_pred
        y_test_eval = y_test

    mae_train = mae(y_train_pred_eval, y_train_eval)
    mae_val = mae(y_val_pred_eval, y_val_eval)
    mae_test = mae(y_test_pred_eval, y_test_eval)
    logger.info(f"MAE for training set is {mae_train}")
    logger.info(f"MAE for validation set is {mae_val}")
    logger.info(f"MAE for test set is {mae_test}")

    # Evaluate for hybrid (telep) vs. non-hybrid visits
    is_tele_test = raw_test_df.is_tele_presentation_visit.values
    logger.info(f"{is_tele_test.sum()} CRs in test set were tele visits.")
    mae_test_is_tele = mae(y_test_pred_eval[is_tele_test], y_test_eval.loc[is_tele_test])
    mae_test_not_tele = mae(
        y_test_pred_eval[is_tele_test == False], y_test_eval.loc[is_tele_test == False]  # noqa: E712
    )
    logger.info(f"MAE for tele visits in test set is {mae_test_is_tele}")
    logger.info(f"MAE for non-tele visits in test set is {mae_test_not_tele}")

    # plot training curves
    fig_tc = plot_xgb_training_curves(
        model=xgb_model,
        metric=EVAL_METRIC,
        names={"validation_0": "train", "validation_1": "valid"},
    )
    fig_tc.savefig(SCRIPT_DIR / "training_curve.png")

    # plot feature importance
    fig_fi = plot_feature_importance(model=xgb_model, feature_names=list(feature_names), k=20)
    fig_fi.savefig(SCRIPT_DIR / "feature_importance.png")

    if register:
        # register new model
        description = (
            "V2.0 with (1) minimal features + shift team score from "
            "feature store, (2) separate preproc pipeline & model."
        )
        model_config = ModelConfig(
            model_name=ModelName.ON_SCENE,
            model=xgb_model,
            training_set=(x_train, y_train.values),
            test_set=(x_val, y_val.values),
            column_transformer=preproc_pipeline,
            risk_protocol_mapping_version=LATEST_RP_VERSION,
            author_email="anne.morrow@*company-data-covered*.com",
            description=description,
        )

        model_config.save_to_model_registry(model_registry_home=MODEL_REGISTRY_HOME, s3=s3)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--register", action="store_true", help="register model in model registry")
    args = parser.parse_args()

    main(register=args.register)
