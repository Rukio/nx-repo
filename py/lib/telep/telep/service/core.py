# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import logging
import operator
from datetime import datetime
from datetime import timezone

import numpy as np
import pandas as pd
from beartype import beartype
from beartype.typing import Dict
from beartype.typing import List
from beartype.typing import Optional
from beartype.typing import Tuple
from beartype.typing import Union
from botocore.client import BaseClient
from decouple import config
from model_utils.db_lookup import BaseDBLookup
from model_utils.db_lookup import NullEngine
from model_utils.errors import ConfigReadError
from model_utils.errors import ModelValidationWarning
from model_utils.reader import BaseConfigReader
from model_utils.reader import StatsigConfigReader  # noqa: F401
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from monitoring.metrics import DataDogMetrics
from normalized_protocol_names.api import NormalizedProtocolNames
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from telep.config.enums import ClinicalOverrideRule
from telep.config.enums import ModelName
from telep.config.telep_model_config import TelepModelConfig
from telep.config.telep_model_config import TelepServiceConfig
from telep.generated.db.models import MlPrediction
from telep.generated.db.telep_ml_prediction_queries import Querier
from telep.models.telep_model import TelepModel
from telep.service.clinical_overrides import TelepClinicalOverrideMetadata
from telep.service.clinical_overrides import TelepClinicalOverrides
from telep.service.errors import RequestValidationError

from proto.ml_models.telep.service_pb2 import GetEligibilityRequest


MODEL_NAMESPACE = "telep_model.v0"

# maps patient_gender enum back to string for column transformer
GENDER_MAP = {
    1: "M",
    2: "F",
}

# default DATABASE_URL is for testing locally, assuming you have started the
# local dev-db
DATABASE_URL = config("DATABASE_URL", default=None)
CONNECTION_POOL_SIZE = 5
READ_CACHE_FLAG = "telep_model_server_cache_read"
WRITE_CACHE_FLAG = "telep_model_server_cache_write"


@beartype
class DBLookup(BaseDBLookup):
    def lookup_cached_prediction(
        self, feature_hash: memoryview, request_id: str, gate: Optional[str] = None
    ) -> Optional[MlPrediction]:
        return self._lookup_cached_prediction(feature_hash=feature_hash, request_id=request_id, gate=gate)

    def insert_prediction(
        self,
        feature_hash: memoryview,
        prediction: bool,
        care_request_id: int,
        request_id: str,
        model_version: str,
        gate: Optional[str] = None,
    ) -> None:
        """Insert a new prediction.

        Note that the type of prediction will be checked by
        DBLookup.Querier.add_new_prediction() instead.
        """
        return self._insert_prediction(
            feature_hash=feature_hash,
            prediction=prediction,
            care_request_id=care_request_id,
            request_id=request_id,
            gate=gate,
            model_version=model_version,
        )

    def update_last_queried(self, id: int, request_id: str, gate: Optional[str] = None) -> None:
        return self._update_last_queried(id=id, request_id=request_id, gate=gate)


@beartype
class TelepModelHandler:
    """Handles the incoming request for one Telep model.

    Properties
    ----------
    config
        A TelepModelConfig object
    models
        Dict mapping model name to TelepModel objects
    clinical_overrides
        TelepClinicalOverrides object
    statsd
        DataDog metric tracking
    pg_engine
        Postgres engine for model cache DB
    base_tags
        Tags to be used in all statsd metric calls
    model_version
        Version of model this handler uses

    Examples
    --------
    >>> handler = TelepModelHandler(telep_model_config, preprocessor, statsd)
    >>> handler.run(request)
    """

    def __init__(
        self,
        telep_model_config: TelepModelConfig,
        risk_protocol_preprocessor: RiskProtocolPreprocessor,
        statsd: DataDogMetrics,
        s3: BaseClient,
        normalized_protocol_names: NormalizedProtocolNames,
        logger: logging.Logger,
        pg_engine: Union[Engine, NullEngine],
        model_version: str,
    ) -> None:
        """Instantiate a TelepModelHandler object.

        At init, it also loads all clinical override rules and creates a
        DataDog metric monitor. NOTE: it does NOT load all models at init time;
        one has to call self.load_models() explicitly.

        Once all models are loaded, it processes an incoming request end-to-end
        through the .run() method.

        Parameters
        ----------
        telep_model_config
            A TelepModelConfig object.
        risk_protocol_preprocessor
            Preprocessor of risk protocol. This is used by clinical override
            rules; each ML model should use its own risk protocol preprocessor.
        statsd
            Datadog monitor
        s3
            A boto3 S3 client object.
        normalized_protocol_names
            A NormalizedProtocolNames object initialized with the correct S3
            client so that it can read the risk protocol mapping S3 bucket.
        logger
            A child Logger instance of TelepMLServiceV1Handler.logger
        pg_engine
            Sqlalchemy engine for DB connections. If None, then model caching
            will not be enabled.
        base_tags
            Tags that all datadog metric calls should include
        model_version
            Model version (statsig config name)

        """
        self.logger = logger
        self._config = telep_model_config
        self._models: Dict[ModelName, TelepModel] = {}
        self._statsd = statsd.create_child_client(MODEL_NAMESPACE)
        # load clinical override logic
        self._clinical_overrides = TelepClinicalOverrides(preprocessor=risk_protocol_preprocessor)
        self._loaded_new_models = 0
        self._s3 = s3
        self._normalized_protocol_names = normalized_protocol_names
        self._pg_engine = pg_engine
        self._model_version = model_version

    @property
    def config(self) -> TelepModelConfig:
        """TelepModelConfig object."""
        return self._config

    @property
    def models(self) -> Dict[str, TelepModel]:
        """A mapping from model name to TelepModel object."""
        return self._models

    @property
    def clinical_overrides(self) -> TelepClinicalOverrides:
        """Clinical override rules."""
        return self._clinical_overrides

    @property
    def statsd(self) -> DataDogMetrics:
        """Datadog metric monitor object."""
        return self._statsd

    @property
    def pg_engine(self) -> Union[Engine, NullEngine]:
        """Postgres engine or None."""
        return self._pg_engine

    @property
    def base_tags(self) -> List[str]:
        """Include model_version in tags."""
        return [f"model_version:{self._model_version}"]

    @property
    def model_version(self) -> str:
        return self._model_version

    def load_models(self, model_cache: Dict[str, TelepModel]) -> Dict[str, TelepModel]:
        """Load & validate all models for this Telep model.

        It loads all models defined in self.config as ModelConfig objects, then
        creates a TelepModel object for each model. Once created, each
        TelepModel is validated against the test set data stored with the model
        in model registry. At the end, ModelConfig objects are NOT stored
        in memory anymore.

        One also needs to pass in model_cache, which is a dict that caches
        models already loaded in previous Telep model handlers. This avoids loading
        the same model multiple times and consume too much memory.

        At the end, store & return the model cache. If a model already exists in
        model cache, then we don't need to load it again.

        Parameters
        ----------
        model_cache
            A dict mapping model_name (containing version) to its TelepModel instance.

        Returns
        -------
        A (potentially updated) model cache.

        """
        for model_name, model_dir in self.config.model_dirs.items():
            self.logger.info(f"Attempting to load model {model_name} from {model_dir}...")
            if model_dir in model_cache:
                self.logger.info(
                    f"Model in model registry location '{model_dir}' already in cache.",
                )
                # this model has already been loaded
                self._models[model_name] = model_cache[model_dir]
            else:
                self.logger.info(
                    f"Loading model '{model_name}' from model registry location {model_dir}...",
                )

                # create tag
                tags = [f"model:{model_name.name}"]

                with self._statsd.timed("model_load_time", tags=tags):
                    model_config = self.config.load_model_config(model_name, s3=self._s3)

                    # create each model's RiskProtocolPreprocessor instance
                    rp_mapping = self._normalized_protocol_names.get_mapping(model_config.risk_protocol_mapping_version)
                    risk_protocol_preprocessor = RiskProtocolPreprocessor(rp_mapping)

                    # create a TelepModel class
                    model = TelepModel(
                        model=model_config.model,
                        version=model_config.version,
                        transformer=model_config.column_transformer,
                        risk_protocol_preprocessor=risk_protocol_preprocessor,
                        logger=self.logger.getChild(model_name.name),
                    )

                # validate model
                X_test, y_test = model_config.test_set

                with self._statsd.timed("model_validation_time", tags=tags):
                    self.logger.info(f"Start validating model '{model_name}'...")
                    try:
                        model.validate(x_test_transformed=X_test, y_test=y_test)
                    except ModelValidationWarning as e1:
                        # model validation raised a warning but still should pass
                        self.logger.warning(f"Model validation for {model_name.name} model returned a warning: {e1}")
                    except Exception as e2:
                        # model validation metric difference is too large; we should raise
                        self.logger.exception(f"Model validation for {model_name.name} returned an error: {e2}")
                        raise e2
                    self.logger.info(f"Finished validating model '{model_name}'.")

                # after passing validation, store reference to TelepModel instance
                self._models[model_name] = model
                # use model_dir as key in cache to distinguish between different versions
                model_cache[model_dir] = model
                self._statsd.increment("end_load_model", tags=tags)
                self._loaded_new_models += 1

        return model_cache

    def run(
        self,
        request: GetEligibilityRequest,
        request_id: str,
    ) -> bool:
        """Perform all steps on the incoming request.

        It performs the following steps:
        1. Preprocess/standardizes the request data
        2. Make predictions using ML models
        3. Combine ML predictions from all models into a single ML decision
        4. Evaluates clinical override logic.

        Parameters
        ----------
        request
            Incoming request

        Returns
        -------
        True if this request is eligible for Tele-presentation according to
        both ML models and clinical rules, otherwise False.

        """
        # define metric tags
        tags = self.base_tags + [f"market:{request.market_name}"]

        # preprocess request
        X_df = self._preprocess(request)

        # start a new DB connection
        with self._pg_engine.connect() as conn:
            # create a DBLookup object
            db_lookup = DBLookup(Querier(conn))

            # hash the features + care_request_id
            X_hashed = db_lookup.hash_features(
                row_input=X_df.iloc[0].to_dict(),
                care_request_id=request.care_request_id,
                model_version=self._model_version,
            )

            # check if this request has been seen before; if yes, return cached
            # result
            match = db_lookup.lookup_cached_prediction(
                feature_hash=X_hashed, request_id=request_id, gate=READ_CACHE_FLAG
            )

            if match is not None:
                self.logger.info(
                    f"Returning cached decision '{match.prediction}'.",
                    extra={
                        "care_request_id": request.care_request_id,
                        "event_name": "telep-return-cache-event",
                        "timestamp_utc": datetime.now(timezone.utc),
                        "market_name": request.market_name,
                        "final_decision": match.prediction,
                        "model_version": self._model_version,
                    },
                )
                # also remember to insert to update the updated_at column
                db_lookup.update_last_queried(id=match.id, request_id=request_id, gate=READ_CACHE_FLAG)
                self._statsd.increment("telep_model_cache_hit", tags=tags)

                return match.prediction

            # log features encoded in JSON string
            X_json = json.dumps(X_df.iloc[0].to_dict())
            self.logger.info(
                f"Features are {X_json}",
                extra={
                    "care_request_id": request.care_request_id,
                    "event_name": "telep-features-event",
                    "timestamp_utc": datetime.now(timezone.utc),
                    "features": X_json,
                    "model_version": self._model_version,
                },
            )

            # feature is not in cache, so pass to the model
            model_scores = self._get_model_scores(X_df, request)
            self.logger.info(f"model_scores = {model_scores}")
            model_decisions = self._apply_thresholds(model_scores, request)

            # apply ML rules
            ml_decision = self._combine_ml_decisions(model_decisions, request)
            # apply clinical overrides
            clinical_override_metadata = TelepClinicalOverrideMetadata(model_version=self._model_version)
            clinical_decision = self._apply_clinical_overrides(request, clinical_override_metadata)

            final_decision = ml_decision & clinical_decision

            # write new prediction to hash
            db_lookup.insert_prediction(
                care_request_id=request.care_request_id,
                feature_hash=X_hashed,
                prediction=final_decision,
                request_id=request_id,
                gate=WRITE_CACHE_FLAG,
                model_version=self._model_version,
            )

            # log final decision telep-decision-event (TODO: replace with Kafka producer call)
            self.logger.info(
                f"Final tele-p model decision is {'eligible' if final_decision else 'ineligible'}",
                extra={
                    "care_request_id": request.care_request_id,
                    "event_name": "telep-decision-event",
                    "timestamp_utc": datetime.now(timezone.utc),
                    "market_name": request.market_name,
                    "ml_decision": ml_decision,
                    "clinical_decision": clinical_decision,
                    "final_decision": final_decision,
                    "model_version": self._model_version,
                },
            )

            if final_decision:
                # count tele-p eligible requests so we can calculate eligible rate
                self.statsd.increment("telep_eligible", tags=tags)

            return final_decision

    def _preprocess(self, request: GetEligibilityRequest) -> pd.DataFrame:
        """Standardize request data for all models.

        This step does two things:
        1. translate request attribute name to column name that column
           transformer is expecting (e.g., request.gender => patient_gender);
        2. applies risk protocol mapping.

        Note that the columns of the returned dataframe must contain all the columns
        expected by the transformer/preprocessing pipeline packaged with the model.
        If it has more columns than expected, the extra columns will simply be
        ignored.

        Parameters
        ----------
        request
            Incoming Tele-p eligibility request.

        Returns
        -------
        A dataframe (with one row) with standardized risk protocol.

        """
        data = {}
        data["risk_protocol"] = request.risk_protocol
        data["patient_age"] = request.patient_age
        data["risk_score"] = request.risk_score
        data["place_of_service"] = request.place_of_service
        # request.market_name will be 3-letter names
        data["market_short_name"] = request.market_name
        data["month"] = request.timestamp.month
        # request.gender will be an int, needs to map back to str
        data["patient_gender"] = GENDER_MAP.get(request.gender, "None")
        data["notes_joint"] = " ".join(
            [" ".join(request.dispatcher_notes), " ".join(request.secondary_screening_notes)]
        )

        # create a dataframe with one row
        df = pd.DataFrame(data=data, index=[0])

        return df

    def _get_model_scores(self, X_df: pd.DataFrame, request: GetEligibilityRequest) -> Dict[ModelName, np.float32]:
        """Get all model scores.

        It first transforms columns in X_df, then passes the transformed
        features to model for prediction.

        Parameters
        ----------
        X_df
            Feature as a pandas dataframe
        request
            Incoming Tele-p eligibility request.

        Returns
        -------
        Dict mapping model name to its predicted score (probability)

        """
        model_scores: Dict[ModelName, np.float32] = {}
        for model_name, model in self.models.items():
            # update metric tags
            tags = self.base_tags + [f"market:{request.market_name}", f"model:{model_name.name}"]

            # preprocess features
            X = model.transform_features(X_df)
            self._statsd.increment("end_transform_features", tags=tags)

            # time the prediction
            pred_time_metric_name = f"{MODEL_NAMESPACE}.pred.timer"
            with self._statsd.timed(pred_time_metric_name, tags=tags):
                # make predictions
                score = model.predict(X)[0]

            model_scores[model_name] = score
            self._statsd.increment(
                "end_model_predict",
                tags=tags,
            )
            self.logger.info(
                f"'{model_name.name}' model predicted score = {score:.6f}",
                extra={
                    "model": model_name.name,
                    "key": "prediction",
                    "value": score,
                    "care_request_id": request.care_request_id,
                    "model_version": self._model_version,
                },
            )

        return model_scores

    def _apply_thresholds(
        self, model_scores: Dict[ModelName, np.float32], request: GetEligibilityRequest
    ) -> Dict[ModelName, bool]:
        """Compare each model score with its own threshold.

        For each model, the comparison with threshold has to evaluate to True
        to be eligible for Tele-presentation.

        Parameters
        ----------
        model_scores
            Dict mapping model_name to its score
        request
            Incoming Tele-p eligibility request.

        Returns
        -------
        A dict mapping model name to True/False as the eligibility decision.

        """
        ml_rule_decisions: Dict[ModelName, bool] = {}

        for model_name, rule in self.config.ml_rules.items():
            # update metric tags
            tags = self.base_tags + [f"market:{request.market_name}", f"model:{model_name.name}"]

            op_, threshold = rule["operator"], rule["threshold"]
            score = model_scores[model_name]
            operator_func = getattr(operator, op_)

            decision = bool(operator_func(score, threshold))
            ml_rule_decisions[model_name] = decision
            self.logger.info(
                f"'{model_name.name}' used threshold = {threshold}",
                extra={
                    "model": model_name.name,
                    "key": "threshold",
                    "value": threshold,
                    "care_request_id": request.care_request_id,
                    "model_version": self._model_version,
                },
            )

            eligible_str = "eligible" if decision else "not eligible"
            # log telep-ml-prediction-event (TODO: replace with Kafka producer call)
            self.logger.info(
                f"'{model_name.name}' model telep decision is '{eligible_str}'",
                extra={
                    "care_request_id": request.care_request_id,
                    "event_name": "telep-ml-prediction-event",
                    "timestamp_utc": datetime.now(timezone.utc),
                    "model_name": model_name.name,
                    "model_raw_output": score,
                    "sub_model_version": self._models[model_name].version,
                    "model_threshold": threshold,
                    "model_threshold_comp_operator": op_,
                    "model_decision": decision,
                    "market_name": request.market_name,
                    "model_version": self._model_version,
                },
            )
            self._statsd.increment(
                "end_apply_threshold",
                tags=tags,
            )

        return ml_rule_decisions

    def _combine_ml_decisions(self, ml_rule_decisions: Dict[ModelName, bool], request: GetEligibilityRequest) -> bool:
        """Combine all model decisions into one final decision.

        Only return True if all ml_rule_decisions are True.

        Parameters
        ----------
        ml_rule_decisions
            A list of boolean from each ml_rule.
        request
            Incoming Tele-p eligibility request.

        Returns
        -------
        True if all models say it's eligible, otherwise False.

        """
        tags = self.base_tags + [f"market:{request.market_name}"]

        ml_decisions = bool(all(ml_rule_decisions.values()))
        self._statsd.increment("end_combine_ml_decisions", tags=tags)
        eligible_str = "eligible" if ml_decisions else "not eligible"
        self.logger.info(
            f"ML telep decision for care_request_id {request.care_request_id} is '{eligible_str}'",
            extra={
                "care_request_id": request.care_request_id,
                "key": "ml_decision",
                "value": ml_decisions,
            },
        )
        return ml_decisions

    def _apply_clinical_overrides(
        self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata
    ) -> bool:
        """Apply clinical overrides.

        If any of the override rules evaluates to True, it's NOT eligible.

        Parameters
        ----------
        request
            Incoming request

        Returns
        -------
        True if none of the clinical override rules evaluates to True, otherwise
        False.

        """
        override_decisions: Dict[ClinicalOverrideRule, bool] = {}

        for rule in self.config.clinical_overrides_enums:
            # update tags
            tags = self.base_tags + [f"market:{request.market_name}", f"clinical_rule:{rule.name}"]

            decision = self._clinical_overrides.apply(request, rule, metadata)
            override_decisions[rule] = decision

            self._statsd.increment("end_clinical_override", tags=tags)

            # log telep-clinical-override-event (TODO: replace with Kafka producer call)
            eligible_str = "not eligible" if decision else "eligible"
            self.logger.info(
                f"Clinical override rule '{rule.name}' gives telep decision '{eligible_str}'",
                extra={
                    "care_request_id": request.care_request_id,
                    "event_name": "telep-clinical-override-event",
                    "timestamp_utc": datetime.now(timezone.utc),
                    "market_name": request.market_name,
                    "rule_name": rule.name,
                    "rule_decision": decision,
                    "model_version": self._model_version,
                },
            )

        clinical_decision = False if any(override_decisions.values()) else True

        eligible_str = "eligible" if clinical_decision else "not eligible"
        self.logger.info(
            f"Clinical telep decision from all rules is '{eligible_str}'",
            extra={
                "care_request_id": request.care_request_id,
                "key": "clinical_decision",
                "value": clinical_decision,
                "model_version": self._model_version,
            },
        )

        return clinical_decision


@beartype
class TelepMLServiceV1Handler:
    """A class at the service level to handle incoming tele-p requests.

    This class is responsible for dispatching the request to be processed by
    the correct Telep model handler (TelepModelHandler).

    Properties
    ----------
    telep_model_handlers
        Dict mapping model_version to TelepModelHandler instances
    statsd
        DataDog metric tracking object
    normalized_protocol_names
        NormalizedProtocolNames instance to look up standardized risk protocol
    pg_engine
        Postgres engine for model cache DB

    Examples
    --------
    >>> telep_service = TelepMLServiceV1Handler(service_config_name="telep-ml-service-config")
    >>> telep_eligibility = telep_service.run(request)

    """

    def __init__(
        self,
        service_config_name: str,
        statsd: DataDogMetrics,
        config_reader: BaseConfigReader,
        s3: BaseClient,
        normalized_protocol_names: NormalizedProtocolNames,
        logger: logging.Logger,
    ) -> None:
        """Instantiate a TelepMLServiceHandler object.

        Parameters
        ----------
        service_config_name
            Name of service config.
        statsd
            A DataDog monitoring instance
        config_reader
            Either an instance of StatsigConfigReader if reading config from
            statsig, or LocalConfigReader if reading config from local filesystem.
        s3
            A boto3 S3 client object.
        normalized_protocol_names
            A NormalalizedProtocolNames instance.
        logger
            pre-configured logger

        Raises
        ------
        ConfigReadError
            If there's an error reading a Telep model config.

        """
        self.logger = logger
        self._statsd = statsd.create_child_client(MODEL_NAMESPACE)

        # look up service-level config; this maps market name to their config names
        try:
            self._service_config_json = config_reader.read(service_config_name)
        except Exception as e:
            err_msg = f"Cannot read service config name {service_config_name} due to {e}"
            self.logger.exception(err_msg)
            raise ConfigReadError(err_msg)
        self._telep_model_handlers: Dict[str, TelepModelHandler] = {}

        # create an instance of RiskProtocolPreprocessor for clinical overrides;
        # this always uses the latest version of the mapping
        self._normalized_protocol_names = normalized_protocol_names
        risk_protocol_preprocessor = RiskProtocolPreprocessor(
            rp_map=self._normalized_protocol_names.get_latest_mapping(),
            logger=self.logger.getChild("RiskProtocolPreprocessor"),
        )

        if DATABASE_URL is None:
            self.logger.warning("DATABASE_URL is not set, prediction caching will NOT be enabled.")
            pg_engine = NullEngine()
        else:
            pg_engine = create_engine(DATABASE_URL, pool_size=CONNECTION_POOL_SIZE)
        # create a Postgres DB engine and shared with all TelepModelHandlers
        self._pg_engine = pg_engine

        # create a cache for loaded TelepModel to avoid loading the same model
        # multiple times and taking up too much memory. _model_cache is shared
        # across all models.
        _model_cache: Dict[str, TelepModel] = {}  # maps model version to TelepModel

        for market_name, telep_model_config_name in self._service_config_json.items():
            self.logger.info(f"Reading config for market '{market_name}'...")
            # for each market, read its config from statsig
            try:
                telep_model_config_json = config_reader.read(telep_model_config_name)
            except Exception as e:
                raise ConfigReadError(f"Cannot read market config name {telep_model_config_name} due to {e}")
            telep_model_config = TelepModelConfig.load_from_json(telep_model_config_json)

            # create a handler object for this market
            handler = TelepModelHandler(
                telep_model_config=telep_model_config,
                risk_protocol_preprocessor=risk_protocol_preprocessor,
                statsd=self._statsd,
                s3=s3,
                normalized_protocol_names=normalized_protocol_names,
                logger=self.logger.getChild(f"TelepModelHandler_{market_name}"),
                pg_engine=self._pg_engine,
                model_version=telep_model_config_name,
            )
            # load models for this market
            _model_cache = handler.load_models(_model_cache)
            self._telep_model_handlers[market_name] = handler

    @property
    def telep_model_handlers(self) -> Dict[str, TelepModelHandler]:
        """Dict mapping market name to TelepModelHandler object."""
        return self._telep_model_handlers

    @property
    def statsd(self) -> DataDogMetrics:
        """Datadog metric monitor object."""
        return self._statsd

    @property
    def normalized_protocol_names(self) -> NormalizedProtocolNames:
        return self._normalized_protocol_names

    @property
    def pg_engine(self) -> Optional[Engine]:
        return self._pg_engine

    def run(self, request: GetEligibilityRequest, request_id: str) -> Tuple[bool, str]:
        """Handles an incoming request.

        It validates the incoming request first, then dispatches to the correct
        TelepModelHandler. It returns what is returned by TelepModelHandler.

        Parameters
        ----------
        request
            Incoming request

        Returns
        -------
        result
            Hybrid clinical eligibility
        model_version
            Model version (config name for this market)

        """
        tags = [f"market:{request.market_name}"]

        with self._statsd.timed(f"{MODEL_NAMESPACE}.request.timer", tags=tags):
            # validate incoming request first
            self._validate_request(request)

            # implements logic to assign request to a particular market
            market = self._lookup_market(request)
            market_handler = self.telep_model_handlers[market]
            model_version = self._service_config_json[market]

            result = market_handler.run(request=request, request_id=request_id)

        return result, model_version

    def _lookup_market(self, request: GetEligibilityRequest) -> str:
        """Looks up market short name using request data.

        Parameters
        ----------
        request
            Incoming request

        Returns
        -------
        A str as the key that maps to the correct TelepModelHandler.

        """
        key = request.market_name
        if key not in self.telep_model_handlers:
            self._statsd.increment("unknown_market_set_to_default")
            key = "DEFAULT"
        self._statsd.increment("end_market_lookup")
        self.logger.info(
            f"Input market name is '{request.market_name}', which resolves to market config for '{key}'",
            extra={
                "care_request_id": request.care_request_id,
                "market": request.market_name,
            },
        )
        return key

    def _validate_request(self, request: GetEligibilityRequest) -> None:
        """Validate an incoming request.

        Will raise RequestValidationError if request is invalid.

        Parameters
        ----------
        request
            Incoming request

        Raises
        ------
        RequestValidationError
            If request data is invalid (e.g., if patient age is negative).

        """
        self._statsd.increment("start_request_validation", tags=[f"market:{request.market_name}"])

        if request.patient_age < 0:
            self._statsd.increment("patient_age_validation_error")
            raise RequestValidationError("Age is less than zero.")

        if len(request.market_name) != 3:
            self._statsd.increment("market_name_validation_error")
            raise RequestValidationError(f"Market name '{request.market_name}' is not three-lettered")

        self._statsd.increment("end_request_validation", tags=[f"market:{request.market_name}"])


@beartype
class TelepMLServiceV2Handler(TelepMLServiceV1Handler):
    def __init__(
        self,
        service_config_name: str,
        statsd: DataDogMetrics,
        config_reader: BaseConfigReader,
        s3: BaseClient,
        normalized_protocol_names: NormalizedProtocolNames,
        logger: logging.Logger,
    ) -> None:
        """Instantiate a TelepMLServiceV1Handler object.

        Parameters
        ----------
        service_config_name
            Name of service config.
        statsd
            A DataDog monitoring instance
        config_reader
            Either an instance of StatsigConfigReader if reading config from
            statsig, or LocalConfigReader if reading config from local filesystem.
        s3
            A boto3 S3 client object.
        normalized_protocol_names
            A NormalalizedProtocolNames instance.
        logger
            pre-configured logger

        Raises
        ------
        ConfigReadError
            If there's an error reading a Telep model config.

        """
        self.logger = logger
        self._statsd = statsd.create_child_client(MODEL_NAMESPACE)

        # look up service-level config; this maps market name to their config names
        try:
            service_config_json = config_reader.read(service_config_name)
        except Exception as e:
            err_msg = f"Cannot read service config name {service_config_name} due to {e}"
            self.logger.exception(err_msg)
            raise ConfigReadError(err_msg)

        self._service_config = TelepServiceConfig(**service_config_json)

        # self._telep_model_handlers maps version string to telep model configs
        self._telep_model_handlers: Dict[str, TelepModelHandler] = {}

        # create an instance of RiskProtocolPreprocessor for clinical overrides;
        # this always uses the latest version of the mapping
        self._normalized_protocol_names = normalized_protocol_names
        risk_protocol_preprocessor = RiskProtocolPreprocessor(
            rp_map=self._normalized_protocol_names.get_latest_mapping(),
            logger=self.logger.getChild("RiskProtocolPreprocessor"),
        )

        if DATABASE_URL is None:
            self.logger.warning("DATABASE_URL is not set, prediction caching will NOT be enabled.")
            pg_engine = NullEngine()
        else:
            pg_engine = create_engine(DATABASE_URL, pool_size=CONNECTION_POOL_SIZE)
        # create a Postgres DB engine and shared with all TelepModelHandlers
        self._pg_engine = pg_engine

        # create a cache for loaded TelepModel to avoid loading the same model
        # multiple times and taking up too much memory. _model_cache is shared
        # across all models.
        _model_cache: Dict[str, TelepModel] = {}  # maps model version to TelepModel

        # collect all unique model versions; model versions are dynamic config
        # names on statsig
        self.logger.info(f"self._service_config.unique_model_versions = {self._service_config.unique_model_versions}")
        for model_version in self._service_config.unique_model_versions:
            handler, _model_cache = self._create_model_handler(
                model_version=model_version,
                config_reader=config_reader,
                risk_protocol_preprocessor=risk_protocol_preprocessor,
                normalized_protocol_names=normalized_protocol_names,
                s3=s3,
                model_cache=_model_cache,
            )
            self._telep_model_handlers[model_version] = handler

    @property
    def service_config(self) -> TelepServiceConfig:
        return self._service_config

    def run(self, request: GetEligibilityRequest, request_id: str) -> Tuple[bool, str]:
        """Handles an incoming request.

        It validates the incoming request first, then dispatches to the correct
        TelepModelHandler. It returns what is returned by TelepModelHandler.

        Parameters
        ----------
        request
            Incoming request

        Returns
        -------
        output
            Hybrid clinical eligibility
        factual_version
            model version for factual

        """
        market = request.market_name
        base_tags = [f"market:{market}"]

        # validate incoming request first
        self._validate_request(request)

        factual_version: str = self._service_config.lookup_factual_version(market)
        shadow_versions: List[str] = self._service_config.lookup_shadow_versions(market)
        versions_to_run = frozenset([factual_version]).union(shadow_versions)

        for model_version in versions_to_run:
            tags = base_tags + [f"model_version:{model_version}"]
            with self._statsd.timed(f"{MODEL_NAMESPACE}.request.timer", tags=tags):
                handler = self._telep_model_handlers[model_version]
                result = handler.run(request=request, request_id=request_id)

                # only return the factual version
                if model_version == factual_version:
                    output = result

        return output, factual_version

    def _create_model_handler(
        self,
        model_version: str,
        config_reader: BaseConfigReader,
        risk_protocol_preprocessor: RiskProtocolPreprocessor,
        normalized_protocol_names: NormalizedProtocolNames,
        s3: BaseClient,
        model_cache: Dict[str, TelepModel],
    ) -> Tuple[TelepModelHandler, Dict[str, TelepModel]]:
        """Create a model handler from a model version.

        Arguments
        ---------
        model_version
            model version to create a handler for
        config_reader
            config reader instance to read configs (either from statsig or local FS)
        risk_protocol_preprocessor
            preprocessor for risk protocol names
        normalized_protocol_names
            NormalizedProtocolNames instance to look up standardized risk protocols
        s3
            Boto3 S3 client
        model_cache
            Cache that prevents the same sub-model to be loaded multiple times

        Returns
        -------
        handler
            A TelepModelHandler instance
        model_cache
            Updated model cache to be used in the next call

        """

        self.logger.info(f"Creating model handler for model version '{model_version}'")

        telep_model_config_name = self._service_config.get_config_name_from_version(model_version)
        self.logger.info(f"Reading dynamic config name '{telep_model_config_name}'")
        try:
            telep_model_config_json = config_reader.read(telep_model_config_name)
        except Exception as e:
            raise ConfigReadError(f"Cannot read market config name {telep_model_config_name} due to {e}")

        model_config = TelepModelConfig.load_from_json(telep_model_config_json)
        # create a handler object for this market
        handler = TelepModelHandler(
            telep_model_config=model_config,
            risk_protocol_preprocessor=risk_protocol_preprocessor,
            statsd=self._statsd,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
            logger=self.logger.getChild(f"TelepModelHandler_{model_version}"),
            pg_engine=self._pg_engine,
            model_version=model_version,
        )
        # load models for this market
        model_cache = handler.load_models(model_cache)

        return handler, model_cache
