# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import os
import re
import time
from datetime import datetime
from datetime import timezone

from beartype import beartype
from beartype.typing import Dict
from beartype.typing import Optional
from beartype.typing import Tuple
from botocore.client import BaseClient
from model_utils.db_lookup import BaseDBLookup
from model_utils.errors import ConfigReadError
from model_utils.errors import ModelValidationWarning
from model_utils.model_config import MODEL_REGISTRY_HOME
from model_utils.model_config import ModelConfig
from model_utils.reader import BaseConfigReader
from monitoring.metrics import DataDogMetrics
from on_scene.config import OnSceneModelConfig
from on_scene.config import OnSceneModelServiceConfig
from on_scene.const import MODEL_NAMESPACE
from on_scene.enums import ModelName
from on_scene.errors import InvalidVersionError
from on_scene.errors import MissingCareRequestError
from on_scene.errors import MissingShiftTeamsError
from on_scene.features import Featurizer
from on_scene.generated.db.models import MlPrediction
from on_scene.model import OnSceneModel
from on_scene.user_lookup import UserLookup

from proto.ml_models.on_scene.service_pb2 import GetOnSceneTimeRequest


ON_SCENE_FEATURE_GROUP_NAME = "on_scene_model_user_lookup"
READ_CACHE_FLAG = None
WRITE_CACHE_FLAG = None


class DBLookup(BaseDBLookup):
    def lookup_cached_prediction(
        self, feature_hash: memoryview, request_id: str, gate: Optional[str] = None
    ) -> Optional[MlPrediction]:
        return self._lookup_cached_prediction(feature_hash, request_id, gate)

    def insert_prediction(
        self,
        feature_hash: memoryview,
        care_request_id: int,
        prediction: int,
        model_version: str,
        request_id: str,
        gate: Optional[str] = None,
    ) -> None:
        return self._insert_prediction(
            feature_hash, prediction, request_id, gate, model_version=model_version, care_request_id=care_request_id
        )

    def update_last_queried(self, id: int, request_id: str, gate: Optional[str] = None) -> None:
        return self._update_last_queried(id, request_id, gate)


@beartype
class OnSceneRequestHandler:
    def __init__(
        self,
        service_config_name: str,
        statsd: DataDogMetrics,
        config_reader: BaseConfigReader,
        s3: BaseClient,
        user_lookup: UserLookup,
        logger: logging.Logger,
    ):
        """Initialize the service.

        Arguments
        ---------
        service_config_name
            Dynamic config name on statsig
        statsd
            statsd monitoring object
        config_reader
            Reader object for configs (from statsig)
        s3
            boto3 s3 client object, needed for loading model from model registry
        user_lookup
            A UserLookup object that looks up provider score from feature store
        logger
            logger object

        """
        t_start = time.time()
        self.logger = logger
        self.statsd = statsd.create_child_client(MODEL_NAMESPACE)

        # look up service-level config; this maps market name to their config names
        try:
            service_config = OnSceneModelServiceConfig(**config_reader.read(service_config_name))
        except Exception as e:
            err_msg = f"Cannot read service config name {service_config_name} due to {e}"
            self.logger.exception(err_msg)
            raise ConfigReadError(err_msg)

        self.service_config = service_config

        # create mappings from model version (e.g., v2.0) to model configs or models
        self.model_config_lookup: Dict[str, OnSceneModelConfig] = {}
        self.models: Dict[str, OnSceneModel] = {}

        # load all model versions included in service config
        factual_model_version = self.service_config.factual_model_version
        self.logger.info(f"Start loading factual version {factual_model_version}")
        factual_model_config, factual_model = self._load_model_version(
            semantic_model_version=factual_model_version, config_reader=config_reader, s3=s3
        )
        self.model_config_lookup[factual_model_version] = factual_model_config
        self.models[factual_model_version] = factual_model
        self.logger.info("Finish loading factual version.")

        self.logger.info("Start loading shadow versions.")
        for shadow_model_version in service_config.shadow_model_versions:
            shadow_model_config, shadow_model = self._load_model_version(
                semantic_model_version=shadow_model_version, config_reader=config_reader, s3=s3
            )
            self.model_config_lookup[shadow_model_version] = shadow_model_config
            self.models[shadow_model_version] = shadow_model
        self.logger.info("Finish loading shadow versions.")

        # create featurizer
        self.featurizer = Featurizer(
            user_lookup=user_lookup,
            logger=self.logger.getChild("Featurizer"),
            statsd=self.statsd.create_child_client("Featurizer"),
        )
        self.logger.info("Created featurizer.")

        t_init = time.time() - t_start
        self.statsd.gauge(f"{MODEL_NAMESPACE}.request_handler_init", t_init)
        self.logger.info(f"Loading everything took {t_init:.2f} seconds.")
        self.logger.info("On-scene model server is now available.")

    @staticmethod
    def _verify_version(version: str) -> None:
        """Verify version string is valid.

        Valid version strings are something like either "v1" or "v1.0" (we do
        not allow patch version as model version).

        Arguments
        ---------
        version
            version string

        Raises
        ------
        InvalidModelVersion: raised if version string is ill-formed
        """
        pattern = r"^v\d+\.?((?<=\.)\d+|\b)$"
        if not re.match(pattern, version):
            raise InvalidVersionError(f"Version string {version} is not valid.")

    @staticmethod
    def _get_config_name_from_version(version: str) -> str:
        """Get dynamic config name from model version in service config.

        Arguments
        ---------
        version
            Version string

        Returns
        -------
        Name of dynamic config for this model version
        """
        OnSceneRequestHandler._verify_version(version)
        model_version_clean = version.replace(".", "p")
        return f"on_scene_model_{model_version_clean}"

    def _load_model(self, model_version: str, s3: BaseClient, logger=logging.Logger) -> OnSceneModel:
        """Load model from model registry.

        Arguments
        ---------
        model_version
            Version of model in model registry
        s3
            boto3 S3 client
        logger
            logger object

        Returns
        -------
        An OnSceneModel instance that packages both feature preproc logic and
        XGBRegressor model

        """
        t_start = time.time()
        model_dir = os.path.join(MODEL_REGISTRY_HOME, "models", "ON_SCENE", model_version)
        model_config = ModelConfig.load_from_model_registry(model_dir=model_dir, model_name_class=ModelName, s3=s3)
        model = OnSceneModel(
            model=model_config.model,
            version=model_version,
            transformer=model_config.column_transformer,
            logger=logger,
        )

        # validate model
        self.logger.info("Start validating ON_SCENE model ...")
        x_test, y_test = model_config.test_set
        try:
            model.validate(x_test_transformed=x_test, y_test=y_test)
        except ModelValidationWarning as e1:
            # model validation raised a warning but still should pass
            self.logger.warning(f"Model validation for ON_SCENE model returned a warning: {e1}")
        except Exception as e2:
            # model validation metric difference is too large; we should raise
            self.logger.exception(f"Model validation for ON_SCENE model returned an error: {e2}")
            raise e2
        self.logger.info("Finished validating ON_SCENE model.")

        t_load = time.time() - t_start
        self.statsd.gauge(f"{MODEL_NAMESPACE}.model_load", t_load)
        self.logger.info(f"Finished loading model; it took {t_load:.2f} seconds.")

        return model

    def _load_model_version(
        self, semantic_model_version: str, config_reader: BaseConfigReader, s3: BaseClient
    ) -> Tuple[OnSceneModelConfig, OnSceneModel]:
        """Load both model config and model object for a given model version."""
        model_config_json = config_reader.read(self._get_config_name_from_version(semantic_model_version))
        model_config = OnSceneModelConfig(**model_config_json)
        model = self._load_model(
            model_version=model_config.model_version,
            s3=s3,
            logger=self.logger.getChild(f"OnSceneModel.{semantic_model_version}"),
        )
        return model_config, model

    def _validate_request(self, request: GetOnSceneTimeRequest) -> None:
        """Validate incoming request and throw an error if something is wrong.

        Arguments
        ---------
        request
            Incoming gRPC request

        Raises
        ------
        MissingCareRequestError
            if num_crs is less than 1 in the request
        ValueError
            if risk_score in the request is crazy
        """
        if request.num_crs <= 0:
            raise MissingCareRequestError(f"num_crs should be at least 1 but got {request.num_crs}.")

        if request.risk_assessment_score > 50 or request.risk_assessment_score < -10:
            raise ValueError(f"Risk score is out of bounds: {request.risk_assessment_score}")

        if not len(list(request.shift_teams)):
            raise MissingShiftTeamsError("No shift teams are passed in with the request.")

        self.logger.info(
            "Finished validating request.",
            extra={"care_request_id": request.care_request_id},
        )

    def run_one(
        self, semantic_model_version: str, features: dict, care_request_id: int, request_id: str, db_lookup: DBLookup
    ) -> Dict[int, int]:
        """Run all steps to return predicted on-scene time for each shift team from one model version.

        Arguments
        ---------
        semantic_model_version
            Semantic version of the model (i.e. "v1.0")
        features
            Features prepared from request payload and feature store queries
        care_request_id
            Care request ID
        request_id
            Random request ID for checking statsig feature gate
        db_lookup
            DBLookup instance to interact with cache DB

        Returns
        -------
        results_in_min
            Dict mapping shift team ID to predicted shift team score in minutes (integer).
        """
        results_in_min: Dict[int, int] = {}

        try:
            model = self.models[semantic_model_version]
        except KeyError:
            raise InvalidVersionError(f"Model for model version {semantic_model_version} was not loaded.")

        try:
            model_config = self.model_config_lookup[semantic_model_version]
        except KeyError:
            raise InvalidVersionError(f"Model config for model version {semantic_model_version} was not loaded.")

        for shift_team_id, shift_team_features in features.items():
            # look up prediction
            feature_hash = db_lookup.hash_features(
                shift_team_features.iloc[0].to_dict(),
                care_request_id=care_request_id,
                model_version=semantic_model_version,
            )

            match = db_lookup.lookup_cached_prediction(
                feature_hash=feature_hash, request_id=request_id, gate=READ_CACHE_FLAG
            )
            self.statsd.increment(f"{MODEL_NAMESPACE}.model_cache_lookup")

            if match is not None:
                results_in_min[shift_team_id] = match.prediction
                self.logger.info(
                    f"Found cached prediction for shift_team_id = {shift_team_id}",
                    extra={
                        "care_request_id": care_request_id,
                        "event_name": "on-scene-return-cache-event",
                        "timestamp_utc": datetime.now(timezone.utc),
                        "prediction": match.prediction,
                    },
                )
                # also remember to insert to update the updated_at column
                db_lookup.update_last_queried(id=match.id, request_id=request_id, gate=READ_CACHE_FLAG)
                self.statsd.increment(f"{MODEL_NAMESPACE}.model_cache_hit")
                # move on to the next shift_team_id
                continue

            with self.statsd.timed(f"{MODEL_NAMESPACE}.shift_team.prediction.timer"):
                transformed_features = model.transform_features(shift_team_features)

                pred_os_time_min = model.predict(transformed_features)[0]

                # convert predicted on-scene time to integer
                pred_os_time_min_output = int(round(pred_os_time_min))

                # apply adjustments specified in config
                pred_os_time_min_output += model_config.prediction_adjustment
                pred_os_time_min_output = max(pred_os_time_min_output, model_config.minimum_on_scene_time)

                results_in_min[shift_team_id] = pred_os_time_min_output

            # insert new prediction
            db_lookup.insert_prediction(
                care_request_id=care_request_id,
                feature_hash=feature_hash,
                prediction=pred_os_time_min_output,
                model_version=semantic_model_version,
                request_id=request_id,
                gate=WRITE_CACHE_FLAG,
            )

            self.logger.info(
                f"Finished prediction for shift_team_id = {shift_team_id}.",
                extra={
                    "care_request_id": care_request_id,
                    "shift_team_id": shift_team_id,
                    "prediction": pred_os_time_min_output,
                },
            )

        return results_in_min

    def run(self, request: GetOnSceneTimeRequest, request_id: str, db_lookup: DBLookup) -> Dict[int, int]:
        """Run all model versions on an incoming request.

        Arguments
        ---------
        request
            Incoming request
        request_id
            Random request ID for checking statsig feature gate
        db_lookup
            DBLookup instance to interact with cache DB

        Returns
        -------
        results_in_min
            Dict mapping shift team ID to predicted shift team score in minutes (integer) from
            FACTUAL model version only.
        """
        self._validate_request(request)

        # time how long it takes to get features (including looking up from
        # feature store)
        with self.statsd.timed(f"{MODEL_NAMESPACE}.request.featurizer.timer"):
            # get features as a dict that maps shift team ID to its features
            features = self.featurizer.get_features(request)

        self.logger.info(
            "Finished preparing features.",
            extra={"care_request_id": request.care_request_id},
        )

        # run factual model version
        factual_version = self.service_config.factual_model_version
        factual_results = self.run_one(
            semantic_model_version=factual_version,
            features=features,
            care_request_id=request.care_request_id,
            request_id=request_id,
            db_lookup=db_lookup,
        )

        # run all shadow versions
        for shadow_version in self.service_config.shadow_model_versions:
            self.run_one(
                semantic_model_version=shadow_version,
                features=features,
                care_request_id=request.care_request_id,
                request_id=request_id,
                db_lookup=db_lookup,
            )

        return factual_results
