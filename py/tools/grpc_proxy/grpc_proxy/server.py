# -*- coding: utf-8 -*-
from __future__ import annotations

import datetime
import logging
from dataclasses import dataclass

import ddtrace
import grpc
import uvicorn
from decouple import config
from fastapi import FastAPI
from fastapi import Request
from fastapi import status
from fastapi.responses import JSONResponse
from google.protobuf.json_format import MessageToDict
from grpc_health.v1 import health_pb2
from grpc_health.v1 import health_pb2_grpc
from models.grpc_requests import AcuityRequest
from models.grpc_requests import OnSceneRequest
from models.grpc_requests import TelepRequest
from pythonjsonlogger import jsonlogger

from proto.ml_models.acuity import service_pb2 as acuity_proto  # type: ignore[attr-defined]
from proto.ml_models.acuity import service_pb2_grpc as acuity_grpc  # type: ignore[attr-defined]
from proto.ml_models.on_scene import service_pb2 as on_scene_proto  # type: ignore[attr-defined]
from proto.ml_models.on_scene import service_pb2_grpc as on_scene_grpc  # type: ignore[attr-defined]
from proto.ml_models.telep import service_pb2 as telep_proto  # type: ignore[attr-defined]
from proto.ml_models.telep import service_pb2_grpc as telep_grpc  # type: ignore[attr-defined]


logger = logging.getLogger("grpc_proxy_server")
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)


GRPC_HTTP_STATUS_CODES = {
    grpc.StatusCode.OK: status.HTTP_200_OK,
    grpc.StatusCode.CANCELLED: status.HTTP_500_INTERNAL_SERVER_ERROR,
    grpc.StatusCode.UNKNOWN: status.HTTP_500_INTERNAL_SERVER_ERROR,
    grpc.StatusCode.INVALID_ARGUMENT: status.HTTP_400_BAD_REQUEST,
    grpc.StatusCode.DEADLINE_EXCEEDED: status.HTTP_504_GATEWAY_TIMEOUT,
    grpc.StatusCode.NOT_FOUND: status.HTTP_404_NOT_FOUND,
    grpc.StatusCode.ALREADY_EXISTS: status.HTTP_409_CONFLICT,
    grpc.StatusCode.PERMISSION_DENIED: status.HTTP_403_FORBIDDEN,
    grpc.StatusCode.RESOURCE_EXHAUSTED: status.HTTP_429_TOO_MANY_REQUESTS,
    grpc.StatusCode.FAILED_PRECONDITION: status.HTTP_412_PRECONDITION_FAILED,
    grpc.StatusCode.ABORTED: status.HTTP_409_CONFLICT,
    grpc.StatusCode.OUT_OF_RANGE: status.HTTP_400_BAD_REQUEST,
    grpc.StatusCode.UNIMPLEMENTED: status.HTTP_501_NOT_IMPLEMENTED,
    grpc.StatusCode.INTERNAL: status.HTTP_500_INTERNAL_SERVER_ERROR,
    grpc.StatusCode.UNAVAILABLE: status.HTTP_503_SERVICE_UNAVAILABLE,
    grpc.StatusCode.DATA_LOSS: status.HTTP_500_INTERNAL_SERVER_ERROR,
    grpc.StatusCode.UNAUTHENTICATED: status.HTTP_401_UNAUTHORIZED,
}


@dataclass
class Config:
    git_sha: str
    server_start_utc: str
    status: str
    grpc_target: str
    grpc_service_name: str


app = FastAPI()

TEMP = "temp"
GRPC_SERVER_PORT = config("GRPC_SERVER_PORT", default=50051, cast=int)
NOT_SERVING = health_pb2.HealthCheckResponse.ServingStatus.Name(0)

conf = Config(
    git_sha=TEMP,
    server_start_utc=TEMP,
    status=NOT_SERVING,
    grpc_target=f"0.0.0.0:{GRPC_SERVER_PORT}",
    grpc_service_name="",
)


acuity_channel = grpc.insecure_channel(conf.grpc_target)
acuity_client = acuity_grpc.AcuityV1ServiceStub(acuity_channel)

telep_channel = grpc.insecure_channel(conf.grpc_target)
telep_client = telep_grpc.TelepV1ServiceStub(telep_channel)

on_scene_channel = grpc.insecure_channel(conf.grpc_target)
on_scene_client = on_scene_grpc.OnSceneServiceStub(on_scene_channel)


health_check_channel = grpc.insecure_channel(conf.grpc_target)
health_check_client = health_pb2_grpc.HealthStub(health_check_channel)


@app.on_event("startup")
async def startup_event():
    conf.git_sha = config("GIT_SHA")
    conf.grpc_service_name = config("HEALTHCHECK_GRPC_SERVICE_NAME", default="", cast=str)
    # iso8601 utc
    conf.server_start_utc = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()


@app.get("/healthcheck")
def health_check():
    status_code = status.HTTP_200_OK
    if not conf.grpc_service_name:
        conf.status = NOT_SERVING
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        logger.warning("HEALTHCHECK_GRPC_SERVICE_NAME not set.")
        return JSONResponse(content=conf.__dict__, status_code=status_code)

    request = health_pb2.HealthCheckRequest(service=conf.grpc_service_name)

    try:
        response = health_check_client.Check(request)
        conf.status = health_pb2.HealthCheckResponse.ServingStatus.Name(response.status)
        if response.status != health_pb2.HealthCheckResponse.SERVING:
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    except grpc.RpcError:
        conf.status = NOT_SERVING
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(content=conf.__dict__, status_code=status_code)


@app.post("/acuity_proxy")
def acuity_proxy(request: Request, acuity_request_data: AcuityRequest):
    token = request.headers["Authorization"]
    metadata = [("authorization", token)]

    try:
        acuity_request = acuity_proto.GetAcuityRequest(**acuity_request_data.dict(exclude_unset=True))
        response = acuity_client.GetAcuity(acuity_request, metadata=metadata)
    except grpc.RpcError as error:
        status_code = GRPC_HTTP_STATUS_CODES[error.code()]
        return JSONResponse(content={"detail": error.details()}, status_code=status_code)

    return JSONResponse(content={"acuity": response.acuity}, status_code=status.HTTP_200_OK)


@app.post("/telep_proxy")
def telep_proxy(request: Request, telep_request_data: TelepRequest):
    token = request.headers["Authorization"]
    metadata = [("authorization", token)]

    try:
        telep_request = telep_proto.GetEligibilityRequest(**telep_request_data.dict(exclude_unset=True))
        response = telep_client.GetEligibility(telep_request, metadata=metadata)
    except grpc.RpcError as error:
        status_code = GRPC_HTTP_STATUS_CODES[error.code()]
        return JSONResponse(content={"detail": error.details()}, status_code=status_code)

    return JSONResponse(
        content=MessageToDict(response, preserving_proto_field_name=True), status_code=status.HTTP_200_OK
    )


@app.post("/on_scene_proxy")
def on_scene_proxy(request: Request, on_scene_request_data: OnSceneRequest):
    token = request.headers["Authorization"]
    metadata = [("authorization", token)]

    try:
        on_scene_request = on_scene_proto.GetOnSceneTimeRequest(**on_scene_request_data.dict(exclude_unset=True))
        response = on_scene_client.GetOnSceneTime(on_scene_request, metadata=metadata)
    except grpc.RpcError as error:
        status_code = GRPC_HTTP_STATUS_CODES[error.code()]
        return JSONResponse(content={"detail": error.details()}, status_code=status_code)

    return JSONResponse(
        content={
            "care_request_id": response.care_request_id,
            "predictions": [dict(id=pred.id, prediction=pred.prediction) for pred in response.predictions],
        },
        status_code=status.HTTP_200_OK,
    )


if __name__ == "__main__":
    port = config("GRPC_PROXY_PORT", 10000, cast=int)
    # Turn off tracing if running locally
    dd_trace_agent_url = config("DD_TRACE_AGENT_URL", default="", cast=str)
    if dd_trace_agent_url == "":
        logger.warning("environment variable 'DD_TRACE_AGENT_URL is empty, disabling tracing")
        ddtrace.tracer.enabled = False
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
