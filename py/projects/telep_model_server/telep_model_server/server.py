# -*- coding: utf-8 -*-
from __future__ import annotations

import argparse
import asyncio
import logging
from concurrent import futures
from dataclasses import dataclass
from typing import Union
from uuid import uuid4

import auth
import boto3
import ddtrace
import grpc
from botocore.client import BaseClient
from decouple import config
from decouple import UndefinedValueError
from grpc_health.v1 import health
from grpc_health.v1 import health_pb2
from grpc_health.v1 import health_pb2_grpc
from model_utils.reader import BaseConfigReader
from model_utils.reader import StatsigConfigReader
from monitoring.metrics import DataDogMetrics
from normalized_protocol_names.api import NormalizedProtocolNames
from pythonjsonlogger import jsonlogger
from statsig import statsig
from statsig import StatsigOptions
from statsig import StatsigUser
from telep.service.core import TelepMLServiceV1Handler
from telep.service.core import TelepMLServiceV2Handler

from proto.ml_models.telep.service_pb2 import DESCRIPTOR
from proto.ml_models.telep.service_pb2 import GetEligibilityRequest
from proto.ml_models.telep.service_pb2 import GetEligibilityResponse
from proto.ml_models.telep.service_pb2_grpc import add_TelepV1ServiceServicer_to_server
from proto.ml_models.telep.service_pb2_grpc import TelepV1ServiceServicer


logger = logging.getLogger("telep_model_sever")
logHandler = logging.StreamHandler()
format_str = "%(message) %(levelname) %(name) %(asctime)"
formatter = jsonlogger.JsonFormatter(format_str)
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)


PROTO_SERVICE_NAME = "TelepV1Service"
AWS_PROFILE = config("AWS_PROFILE", default=None)
SERVICE_CONFIG_NAME_V1 = "telep-ml-service-config"
SERVICE_CONFIG_NAME_V2 = "telep-ml-service-config-v2"


# TODO(RS-275) - refactor to add validation + init function to take
@dataclass
class ServerConfig:
    """Class for storing all server config"""

    """Pass in all env vars, and init will set additional server vars"""
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


class TelepService(TelepV1ServiceServicer):
    def __init__(
        self,
        logger: logging.Logger,
        statsd: DataDogMetrics,
        config_reader: BaseConfigReader,
        s3: BaseClient,
        *args,
        **kwargs,
    ) -> None:
        self.logger = logger.getChild("TelepService")

        normalized_protocol_names = NormalizedProtocolNames(s3)

        self.handler: Union[TelepMLServiceV1Handler, TelepMLServiceV2Handler]

        # initialize the service handler
        if statsig.check_gate(user=StatsigUser("default-id"), gate="telep-model-server-use-v2-config"):
            service_config_name = SERVICE_CONFIG_NAME_V2
            self.handler = TelepMLServiceV2Handler(
                service_config_name=service_config_name,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                normalized_protocol_names=normalized_protocol_names,
                logger=self.logger.getChild("TelepMLServiceV2Handler"),
            )
        else:
            service_config_name = SERVICE_CONFIG_NAME_V1
            self.handler = TelepMLServiceV1Handler(
                service_config_name=service_config_name,
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                normalized_protocol_names=normalized_protocol_names,
                logger=self.logger.getChild("TelepMLServiceV1Handler"),
            )
        self.logger.info(f"Used service config '{service_config_name}'")
        self.logger.info("Service is now available.")

    async def GetEligibility(
        self, request: GetEligibilityRequest, context: grpc.aio.ServicerContext
    ) -> GetEligibilityResponse:
        result = GetEligibilityResponse()
        # create id to unique id request
        request_id = str(uuid4())

        # Science stuff
        response = self.handler.run(request=request, request_id=request_id)
        result.eligible = response[0]
        result.model_version = response[1]

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


def _configure_server(server: grpc.Server, statsd: DataDogMetrics, server_conf: ServerConfig) -> None:
    """Helper function to configure the tele-p model server itself."""
    # get statsig config reader

    config_reader = StatsigConfigReader()

    # get S3 client instance
    session = boto3.Session(profile_name=AWS_PROFILE)
    s3 = session.client("s3")

    # get risk protocol mapping instance
    normalized_protocol_names = NormalizedProtocolNames(s3)

    add_TelepV1ServiceServicer_to_server(
        TelepService(
            logger=logger,
            statsd=statsd,
            config_reader=config_reader,
            s3=s3,
            normalized_protocol_names=normalized_protocol_names,
        ),
        server,
    )


# TODO(RS-275): Use ServerConfig after refactor
async def serve(server_conf: ServerConfig, statsd: DataDogMetrics, local: bool) -> None:
    """Serve the tele-p model.

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

    _configure_server(server, statsd, server_conf=server_conf)
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
