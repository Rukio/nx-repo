# -*- coding: utf-8 -*-
from __future__ import annotations

import asyncio
import logging
from concurrent import futures

import acuity_model as acuity_model_lib
import auth
import ddtrace
import grpc
from decouple import config
from grpc_health.v1 import health
from grpc_health.v1 import health_pb2
from grpc_health.v1 import health_pb2_grpc
from monitoring.metrics import DataDogMetrics
from pythonjsonlogger import jsonlogger
from statsig import statsig
from statsig import StatsigOptions
from statsig.statsig_user import StatsigUser

from proto.ml_models.acuity import service_pb2 as acuity_proto  # type: ignore[attr-defined]
from proto.ml_models.acuity import service_pb2_grpc as acuity_grpc  # type: ignore[attr-defined]


logger = logging.getLogger("acuity_model_sever")
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)


PROTO_SERVICE_NAME = "AcuityV1Service"
APPLICATION_NAME = "acuity_model_server"
V2_MARKETS_FLAG = "acuity_model_version_2_markets"


class AcuityService(acuity_grpc.AcuityV1ServiceServicer):
    def __init__(self, logger: logging.Logger, statsd: DataDogMetrics, *args, **kwargs) -> None:
        self.logger = logger
        self.statsd = statsd
        self.model = acuity_model_lib.V0(self.logger, self.statsd)
        self.modelV2 = acuity_model_lib.V2(self.logger, self.statsd)

    async def GetAcuity(
        self, request: acuity_proto.GetAcuityRequest, context: grpc.aio.ServicerContext
    ) -> acuity_proto.GetAcuityResponse:
        result = acuity_proto.GetAcuityResponse()
        try:
            statsig_user = StatsigUser(user_id="dummy", custom={"market_short_name": request.market_short_name})

            if statsig.check_gate(statsig_user, V2_MARKETS_FLAG):
                self.modelV2.validate_request(request=request)
                result.acuity = self.modelV2.run(request=request)
            else:
                self.model.validate_request(request=request)
                result.acuity = self.model.run(request=request)

            acuity_name = acuity_proto.Acuity.DESCRIPTOR.values_by_number[result.acuity].name
            self.statsd.increment("result", tags=[f"acuity:{acuity_name}", f"service:{PROTO_SERVICE_NAME}"])
        except acuity_model_lib.AcuityModelException as e:
            context.set_details(f"{e.__class__.__name__}: {str(e)}")
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            self.statsd.increment("invalid_argument", tags=[f"service:{PROTO_SERVICE_NAME}"])
        except Exception as e:
            self.statsd.increment("unexpected_error_has_occurred", tags=[f"service:{PROTO_SERVICE_NAME}"])
            context.set_details("Unexpected Error has occurred")
            context.set_code(grpc.StatusCode.INTERNAL)

            self.logger.exception(
                "Unexpected error has occurred",
                extra={
                    "exception_name": e.__class__.__name__,
                },
            )

        return result


def _configure_maintenance_server(server: grpc.Server) -> None:
    # Create a health check servicer. We use the non-blocking implementation
    # to avoid thread starvation.
    health_servicer = health.HealthServicer(
        experimental_non_blocking=True, experimental_thread_pool=futures.ThreadPoolExecutor()
    )
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

    # Mark all services as healthy.
    for service in acuity_proto.DESCRIPTOR.services_by_name.values():
        health_servicer.set(service.full_name, health_pb2.HealthCheckResponse.SERVING)
    health_servicer.set(health.SERVICE_NAME, health_pb2.HealthCheckResponse.SERVING)


def _configure_server(server: grpc.Server, statsd: DataDogMetrics) -> None:
    acuity_grpc.add_AcuityV1ServiceServicer_to_server(AcuityService(logger=logger, statsd=statsd), server)


async def serve(port: str, statsd: DataDogMetrics) -> None:
    # TODO: use secure port with TLS cert
    auth_interceptor = auth.AuthorizationInterceptor(
        service_proto=acuity_proto.DESCRIPTOR.services_by_name[PROTO_SERVICE_NAME],
        issuer_url=config("AUTH_ISSUER_URL", default="https://staging-auth.*company-data-covered*.com/"),
        audience=config("AUTH_AUDIENCE", default="mlmodels-service.*company-data-covered*.com"),
    )
    # Start Acuity and Maintenance Server on the same port
    server = grpc.aio.server(interceptors=[auth_interceptor])
    _configure_server(server, statsd)
    _configure_maintenance_server(server)
    server.add_insecure_port(port)
    await server.start()
    await server.wait_for_termination()


def run_server(
    logger: logging.Logger, statsd: DataDogMetrics, port: str, event_loop: asyncio.AbstractEventLoop
) -> None:
    try:
        logger.info(f"Starting the server on port {port}...")
        event_loop.run_until_complete(serve(port=port, statsd=statsd))
    finally:
        event_loop.close()


if __name__ == "__main__":
    try:
        statsd_host, statsd_port = config("DD_DOGSTATSD_URL", default="").split(":")
    except ValueError:
        logger.warning("Failed to get DD_DOGSTATSD_URL")
        statsd_host = "localhost"
        statsd_port = 8125

    statsig.initialize(config("STATSIG_SECRET_KEY"), options=StatsigOptions(tier=config("DD_ENV")))

    ddmetrics = DataDogMetrics(statsd_host, statsd_port, PROTO_SERVICE_NAME)

    # Turn off tracing if running locally
    dd_trace_agent_url = config("DD_TRACE_AGENT_URL", default="", cast=str)
    if dd_trace_agent_url == "":
        logger.warning("environment variable 'DD_TRACE_AGENT_URL is empty, disabling tracing")
        ddtrace.tracer.enabled = False

    # App Config
    grpc_server_port = config("GRPC_SERVER_PORT", default=50051, cast=int)
    loop = asyncio.new_event_loop()
    run_server(logger, ddmetrics, f"[::]:{grpc_server_port}", loop)
