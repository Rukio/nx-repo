# -*- coding: utf-8 -*-
from __future__ import annotations

import inspect
from concurrent import futures
from typing import Callable
from typing import Tuple
from unittest import mock
from unittest.mock import patch

import auth
import grpc
import pytest
from grpc_health.v1 import health
from grpc_health.v1 import health_pb2
from grpc_health.v1 import health_pb2_grpc

from proto.ml_models.acuity import service_pb2 as acuity_proto
from proto.ml_models.acuity import service_pb2_grpc as acuity_grpc


SERVER_TIMEOUT = 10


def _build_payload_function(payload: dict[str, str]) -> Callable:
    def payload_func(self, _token: str) -> dict[str, str]:
        return payload

    return payload_func


def _build_service_scopes(service_scopes: dict[str, str]) -> Callable:
    def scopes(_service_scopes):
        return service_scopes

    return scopes


@pytest.fixture
def permission() -> str:
    return "get:acuity:all"


def mock_auth_interceptor(service_scopes: dict[str, str]) -> auth.AuthorizationInterceptor:
    with mock.patch("auth.grpc._build_service_scopes", new=_build_service_scopes(service_scopes)):
        return auth.AuthorizationInterceptor(
            service_proto=mock.Mock(),
            issuer_url="",
            audience="",
        )


def mock_token_validator(payload: dict[str, str]) -> auth.AuthTokenValidator:
    """Create an AuthTokenValidator instance.

    Since we are not testing PyJWT's validation, issuer_url and audience are empty.
    """
    validator = auth.AuthTokenValidator(issuer_url="", audience="")
    validator._validate_token = _build_payload_function(payload).__get__(validator, auth.AuthTokenValidator)
    return validator


@pytest.mark.parametrize(
    "header_token,parts",
    [
        ("", 0),
        ("Bearer", 1),
        ("Bearer a1s2d3 f4g5h6", 3),
    ],
)
def test_parse_token_failure(
    header_token: str,
    parts: int,
    permission: str,
) -> None:
    token_validator = mock_token_validator({"scope": "get:acuity:all"})

    with pytest.raises(auth.AuthException) as e:
        exception_message = (
            f"Authorization Header parse failure: string splits into incorrect amount, expect 2 parts, have {parts}"
        )

        token_validator.authorize_token(header_token, permission)

        assert exception_message in str(e.value)


def test_parse_token_success(permission: str) -> None:
    token_validator = mock_token_validator({"scope": "get:acuity:all"})
    assert token_validator.authorize_token("Bearer token", permission)


@pytest.mark.parametrize(
    "permission,payload",
    [
        ("get:acuity:all", {"scope": "incorrect:permission"}),
        ("incorrect:permission", {"scope": "get:acuity:all"}),
        ("incorrect:permission", {"scope": "not:applicable:all get:acuity:all"}),
        ("get:acuity:all", {"scope": ""}),
    ],
)
def test_authorize_token_failure(
    permission: str,
    payload: dict[str, str],
) -> None:
    token_validator = mock_token_validator(payload)

    with pytest.raises(auth.UnauthorizedException):
        token_validator.authorize_token("Bearer token", permission)


@pytest.mark.parametrize(
    "permission,payload",
    [
        ("get:acuity:all", {"scope": "get:acuity:all"}),
        ("get:acuity:all", {"scope": "get:acuity:all read:other:all"}),
    ],
)
def test_authorize_token_success(
    permission: str,
    payload: dict[str, str],
) -> None:
    token_validator = mock_token_validator(payload)

    assert token_validator.authorize_token("Bearer token", permission)


intercept_data = [
    (
        "AuthException: Authorization header not found in metadata",
        grpc.StatusCode.UNAUTHENTICATED,
        [("Content-Type", "text/json")],
        {"acuity": "read:all:acuity"},
        "acuity",
    ),
    (
        "KeyError: 'acuity'",
        grpc.StatusCode.INTERNAL,
        [("authorization", "Bearer token")],
        {"other": "read:all:acuity"},
        "acuity",
    ),
    (
        "KeyError: 'other'",
        grpc.StatusCode.INTERNAL,
        [("authorization", "Bearer token")],
        {"acuity": "read:all:acuity"},
        "other",
    ),
]


@pytest.mark.asyncio
@pytest.mark.parametrize("exception,code,metadata,service_scopes,handler_call_method", intercept_data)
async def test_interceptor(
    exception: str,
    code: grpc.StatusCode,
    metadata: tuple[str, str],
    service_scopes: dict[str, str],
    handler_call_method: str,
) -> None:
    auth_interceptor = mock_auth_interceptor(service_scopes)
    with mock.patch.object(auth.AuthTokenValidator, "authorize_token"):
        continuation = mock.Mock()
        handler_call_details = mock.Mock()
        handler_call_details.invocation_metadata = metadata
        handler_call_details.method = handler_call_method

        response = await auth_interceptor.intercept_service(continuation, handler_call_details)
        context_details = inspect.getclosurevars(response.unary_unary).nonlocals["context_details"]
        status_code = inspect.getclosurevars(response.unary_unary).nonlocals["status_code"]

        assert context_details == exception
        assert status_code == code


class TestService(acuity_grpc.AcuityV1ServiceServicer):
    async def GetAcuity(
        self, request: acuity_proto.GetAcuityRequest, context: grpc.aio.ServicerContext
    ) -> acuity_proto.GetAcuityResponse:
        return acuity_proto.GetAcuityResponse()


async def start_test_server(interceptors=None) -> Tuple[str, grpc.aio.server]:
    server = grpc.aio.server(options=(("grpc.so_reuseport", 0),), interceptors=interceptors)
    acuity_grpc.add_AcuityV1ServiceServicer_to_server(TestService(), server)

    health_servicer = health.HealthServicer(
        experimental_non_blocking=True, experimental_thread_pool=futures.ThreadPoolExecutor()
    )
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

    # Mark all services as healthy.
    for service in acuity_proto.DESCRIPTOR.services_by_name.values():
        health_servicer.set(service.full_name, health_pb2.HealthCheckResponse.SERVING)
    health_servicer.set(health.SERVICE_NAME, health_pb2.HealthCheckResponse.SERVING)

    port = server.add_insecure_port("[::]:0")

    await server.start()

    return "localhost:%d" % port, server


@pytest.mark.asyncio
@patch.object(auth.AuthTokenValidator, "_validate_token", new=_build_payload_function({"scope": "read:all:acuity"}))
async def test_interceptor_with_service_failure() -> None:
    auth_interceptor = mock_auth_interceptor({"acuity": "read:all:acuity"})
    server_target, server = await start_test_server(interceptors=(auth_interceptor,))
    async with grpc.aio.insecure_channel(server_target) as channel:
        multicallable = channel.unary_unary(
            "/ml_models.acuity.AcuityV1Service/GetAcuity",
            request_serializer=acuity_proto.GetAcuityRequest.SerializeToString,
            response_deserializer=acuity_proto.GetAcuityResponse.FromString,
        )

        metadata = grpc.aio.Metadata(
            ("key", "value"),
        )
        with pytest.raises(grpc.aio.AioRpcError):
            call = multicallable(acuity_proto.GetAcuityRequest(), metadata=metadata)
            await call

        await server.stop(SERVER_TIMEOUT)


@pytest.mark.asyncio
@patch.object(auth.AuthTokenValidator, "_validate_token", new=_build_payload_function({"scope": "read:all:acuity"}))
async def test_interceptor_with_service_success() -> None:
    auth_interceptor = mock_auth_interceptor({"/ml_models.acuity.AcuityV1Service/GetAcuity": "read:all:acuity"})
    server_target, server = await start_test_server(interceptors=(auth_interceptor,))
    async with grpc.aio.insecure_channel(server_target) as channel:
        multicallable = channel.unary_unary(
            "/ml_models.acuity.AcuityV1Service/GetAcuity",
            request_serializer=acuity_proto.GetAcuityRequest.SerializeToString,
            response_deserializer=acuity_proto.GetAcuityResponse.FromString,
        )

        metadata = grpc.aio.Metadata(
            ("authorization", "Bearer token"),
        )
        call = multicallable(acuity_proto.GetAcuityRequest(), metadata=metadata)
        await call
        code = await call.code()
        assert code == grpc.StatusCode.OK

        await server.stop(SERVER_TIMEOUT)


@pytest.mark.asyncio
@patch.object(auth.AuthTokenValidator, "_validate_token", new=_build_payload_function({"scope": "read:all:acuity"}))
async def test_interceptor_with_public_methods() -> None:
    auth_interceptor = mock_auth_interceptor({"/ml_models.acuity.AcuityV1Service/GetAcuity": "read:all:acuity"})
    server_target, server = await start_test_server(interceptors=(auth_interceptor,))
    async with grpc.aio.insecure_channel(server_target) as channel:
        multicallable = channel.unary_unary(
            "/grpc.health.v1.Health/Check",
            request_serializer=health_pb2.HealthCheckRequest.SerializeToString,
            response_deserializer=health_pb2.HealthCheckResponse.FromString,
        )

        metadata = grpc.aio.Metadata(
            ("authorization", "Bearer token"),
        )
        call = multicallable(health_pb2.HealthCheckRequest(), metadata=metadata)
        await call
        code = await call.code()
        assert code == grpc.StatusCode.OK

        await server.stop(SERVER_TIMEOUT)
