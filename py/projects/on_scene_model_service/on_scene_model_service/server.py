# -*- coding: utf-8 -*-
from __future__ import annotations

import argparse
import asyncio
import logging
from concurrent import futures
from dataclasses import dataclass
from uuid import uuid4

import auth
import boto3
import ddtrace
import grpc
from botocore.client import BaseClient
from decouple import config
from decouple import UndefinedValueError
from feature_store.query import QueryFeatureStore
from grpc_health.v1 import health
from grpc_health.v1 import health_pb2
from grpc_health.v1 import health_pb2_grpc
from model_utils.db_lookup import NullEngine
from model_utils.reader import BaseConfigReader
from model_utils.reader import StatsigConfigReader
from monitoring.metrics import DataDogMetrics
from on_scene.core import DBLookup
from on_scene.core import OnSceneRequestHandler
from on_scene.generated.db.on_scene_ml_prediction_queries import Querier
from on_scene.user_lookup import UserLookup
from pythonjsonlogger import jsonlogger
from sagemaker.session import Session
from sqlalchemy import create_engine
from statsig import statsig
from statsig import StatsigOptions

from proto.ml_models.on_scene.service_pb2 import DESCRIPTOR
from proto.ml_models.on_scene.service_pb2 import GetOnSceneTimeRequest
from proto.ml_models.on_scene.service_pb2 import GetOnSceneTimeResponse
from proto.ml_models.on_scene.service_pb2 import ShiftTeamPrediction
from proto.ml_models.on_scene.service_pb2_grpc import add_OnSceneServiceServicer_to_server
from proto.ml_models.on_scene.service_pb2_grpc import OnSceneServiceServicer


logger = logging.getLogger("on_scene_model_service")
logHandler = logging.StreamHandler()
format_str = "%(message) %(levelname) %(name) %(asctime)"
formatter = jsonlogger.JsonFormatter(format_str)
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)


PROTO_SERVICE_NAME = "OnSceneService"
ON_SCENE_SERVICE_CONFIG_NAME = config("ON_SCENE_SERVICE_CONFIG_NAME", default="on_scene_model_service")
AWS_PROFILE = config("AWS_PROFILE", default=None)
FEATURE_STORE_ROLE = config("FEATURE_STORE_ROLE", default=None)
PROV_SCORE_FEATURE_GROUP_NAME = "on_scene_model_user_lookup"
DATABASE_URL = config("DATABASE_URL", default=None)
CONNECTION_POOL_SIZE = 5


class MissingFeatureStoreRoleError(Exception):
    pass


@dataclass
class ServerConfig:
    """Class for storing all server config.

    Pass in all env vars, and init will set additional server vars
    """

    grpc_server_port: str
    # deployed environment
    env: str
    # datadog statsd url
    dd_dogstatsd_url: str
    statsig_secret_key: str

    # port_str returns the representation of the port needed for server instantiation
    @property
    def grpc_port_str(self) -> str:
        return f"[::]:{self.grpc_server_port}"

    @property
    def dd_statsd_port(self) -> int:
        return int(self.dd_dogstatsd_url.split(":")[1])

    @property
    def dd_statsd_host(self) -> str:
        return self.dd_dogstatsd_url.split(":")[0]


class OnSceneModelService(OnSceneServiceServicer):
    def __init__(
        self,
        logger: logging.Logger,
        statsd: DataDogMetrics,
        config_reader: BaseConfigReader,
        s3: BaseClient,
        user_lookup: UserLookup,
        *args,
        **kwargs,
    ) -> None:
        self.logger = logger.getChild("OnSceneModelService")

        self.handler = OnSceneRequestHandler(
            service_config_name=ON_SCENE_SERVICE_CONFIG_NAME,
            statsd=statsd,
            config_reader=config_reader,
            s3=s3,
            user_lookup=user_lookup,
            logger=self.logger.getChild("OnSceneRequestHandler"),
        )
        self.logger.info("Service is now available.")

        # create postgres engine
        if DATABASE_URL is None:
            self.logger.warning("DATABASE_URL is not set, prediction caching will NOT be enabled.")
            pg_engine = NullEngine()
        else:
            pg_engine = create_engine(DATABASE_URL, pool_size=CONNECTION_POOL_SIZE)
        # create a Postgres DB engine and shared with all TelepModelHandlers
        self._pg_engine = pg_engine

    async def GetOnSceneTime(
        self, request: GetOnSceneTimeRequest, context: grpc.aio.ServicerContext
    ) -> GetOnSceneTimeResponse:
        result = GetOnSceneTimeResponse()
        request_id = str(uuid4())

        # Science stuff
        with self._pg_engine.connect() as conn:
            db_lookup = DBLookup(querier=Querier(conn))
            pred_os_time = self.handler.run(request=request, request_id=request_id, db_lookup=db_lookup)

        shift_team_preds = [ShiftTeamPrediction(id=team_id, prediction=pred) for team_id, pred in pred_os_time.items()]

        result.care_request_id = request.care_request_id
        # cannot assign the entire list of shift_team_preds to result.predictions
        result.predictions.extend(shift_team_preds)

        return result


def _configure_maintenance_server(server: grpc.Server) -> None:
    # Create a health check servicer. We use the non-blocking implementation
    # to avoid thread starvation.
    health_servicer = health.HealthServicer(
        experimental_non_blocking=True, experimental_thread_pool=futures.ThreadPoolExecutor()
    )
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

    # Mark all services as healthy.
    for service in DESCRIPTOR.services_by_name.values():
        health_servicer.set(service.full_name, health_pb2.HealthCheckResponse.SERVING)
    health_servicer.set(health.SERVICE_NAME, health_pb2.HealthCheckResponse.SERVING)


def _configure_server(server: grpc.Server, statsd: DataDogMetrics) -> None:
    """Helper function to configure the on-scene model service itself."""
    # get statsig config reader

    config_reader = StatsigConfigReader()

    # get S3 client instance
    profile = AWS_PROFILE
    if profile is None:
        logger.warning("AWS_PROFILE is not set, using 'None'...")
    session = boto3.Session(profile_name=profile)
    s3 = session.client("s3")

    if FEATURE_STORE_ROLE is None:
        raise MissingFeatureStoreRoleError("FEATURE_STORE_ROLE is not set.")
    # create UserLookup object to get online features from feature store
    qfs = QueryFeatureStore(
        sagemaker_session=Session(), feature_group_name=PROV_SCORE_FEATURE_GROUP_NAME, role=FEATURE_STORE_ROLE
    )
    user_lookup = UserLookup(querier=qfs, logger=logger.getChild("UserLookup"))

    add_OnSceneServiceServicer_to_server(
        OnSceneModelService(
            logger=logger,
            statsd=statsd,
            config_reader=config_reader,
            s3=s3,
            user_lookup=user_lookup,
        ),
        server,
    )


async def serve(server_conf: ServerConfig, statsd: DataDogMetrics, local: bool) -> None:
    """Serve the on-scene model.

    Parameters
    ----------
    port
        Port of the application.
    statsd
        A DataDog logging metric instance.
    local
        Whether to run this server locally (for testing).

    """
    if local:
        logger.warning("Running server locally...")

    auth_interceptor = auth.AuthorizationInterceptor(
        service_proto=DESCRIPTOR.services_by_name[PROTO_SERVICE_NAME],
        issuer_url=config("AUTH_ISSUER_URL", default="https://staging-auth.*company-data-covered*.com/"),
        audience=config("AUTH_AUDIENCE", default="mlmodels-service.*company-data-covered*.com"),
    )
    interceptors = [auth_interceptor] if not local else []
    server = grpc.aio.server(interceptors=interceptors)

    _configure_server(server, statsd)
    _configure_maintenance_server(server)
    server.add_insecure_port(server_conf.grpc_port_str)
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    # parse arguments, if any
    parser = argparse.ArgumentParser()
    parser.add_argument("-l", "--local", dest="local", action="store_true", default=False)
    args = parser.parse_args()

    try:
        dd_statsd_url = config("DD_DOGSTATSD_URL")
    except UndefinedValueError:
        logger.warning("Failed to get DD_DOGSTATSD_URL")
        dd_statsd_url = "localhost:8125"
    logger.warning(f"dd_statsd_url = {dd_statsd_url}")

    try:
        local_env = config("ENVIRONMENT")
    except UndefinedValueError:
        logger.warning("Failed to get env var `ENVIRONMENT`. assuming local env")
        local_env = "local"
    # or if --local is passed explicitly
    if args.local:
        local_env = "local"

    # NOTE: need to turn off APM tracing if no env var, as the dd_trace binary would complain otherwise
    dd_trace_agent_url = config("DD_TRACE_AGENT_URL", default="", cast=str)
    if dd_trace_agent_url == "":
        logger.warning("environment variable 'DD_TRACE_AGENT_URL is empty, disabling tracing")
        ddtrace.tracer.enabled = False

    # App Config
    grpc_server_port = config("GRPC_SERVER_PORT", default=50051, cast=int)

    statsig_secret_key = config("STATSIG_SECRET_KEY")
    server_conf = ServerConfig(
        grpc_server_port=grpc_server_port,
        env=local_env,
        dd_dogstatsd_url=dd_statsd_url,
        statsig_secret_key=statsig_secret_key,
    )

    statsig_options = StatsigOptions(tier=server_conf.env)
    statsig.initialize(server_conf.statsig_secret_key, options=statsig_options)
    ddmetrics = DataDogMetrics(server_conf.dd_statsd_host, server_conf.dd_statsd_port, PROTO_SERVICE_NAME)

    loop = asyncio.new_event_loop()
    try:
        logger.info(f"Starting the server on port {server_conf.grpc_server_port}...")
        loop.run_until_complete(serve(server_conf=server_conf, statsd=ddmetrics, local=args.local))
    finally:
        loop.close()
