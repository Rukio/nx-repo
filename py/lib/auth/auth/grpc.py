# -*- coding: utf-8 -*-
from __future__ import annotations

import grpc

from . import exceptions
from . import validation


AUTHORIZATION_HEADER = "authorization"
GRPC_HEALTH_CHECK_CHECK_FULL_METHOD_NAME = "/grpc.health.v1.Health/Check"
GRPC_HEALTH_CHECK_WATCH_FULL_METHOD_NAME = "/grpc.health.v1.Health/Watch"
PUBLIC_METHODS = (GRPC_HEALTH_CHECK_CHECK_FULL_METHOD_NAME, GRPC_HEALTH_CHECK_WATCH_FULL_METHOD_NAME)


def _build_service_scopes(service_proto: google.protobuf.pyext._message.ServiceDescriptor) -> dict[str, str]:
    scopes = {}
    for method in service_proto.methods:
        for field, value in method.GetOptions().ListFields():
            if field.full_name == "common.auth.rule":
                scopes[f"/{service_proto.full_name}/{method.name}"] = value.jwt_permission

    return scopes


class AuthorizationInterceptor(grpc.aio.ServerInterceptor):
    def __init__(
        self, service_proto: google.protobuf.pyext._message.ServiceDescriptor, issuer_url: str, audience: str
    ) -> None:
        self._service_scopes = _build_service_scopes(service_proto)
        self._validator = validation.AuthTokenValidator(
            issuer_url=issuer_url,
            audience=audience,
        )

    def _build_abort_handler(
        self, context_details: str, status_code: grpc.StatusCode = grpc.StatusCode.UNAUTHENTICATED
    ) -> grpc.RpcMethodHandler:
        def abort(ignored_request, context: grpc.aio.ServicerContext) -> None:
            context.abort(status_code, context_details)

        return grpc.unary_unary_rpc_method_handler(abort)

    async def intercept_service(
        self,
        continuation: Callable[[grpc.HandlerCallDetails], Awaitable[grpc.RpcMethodHandler]],
        handler_call_details: grpc.HandlerCallDetails,
    ) -> grpc.RpcMethodHandler:
        if handler_call_details.method in PUBLIC_METHODS:
            return await continuation(handler_call_details)

        try:
            metadata = dict(handler_call_details.invocation_metadata)
            if AUTHORIZATION_HEADER not in metadata:
                raise exceptions.AuthException("Authorization header not found in metadata")

            self._validator.authorize_token(
                header_token=metadata[AUTHORIZATION_HEADER],
                required_permission=self._service_scopes[handler_call_details.method],
            )
        except exceptions.AuthException as e:
            return self._build_abort_handler(f"{e.__class__.__name__}: {str(e)}")
        except Exception as e:
            return self._build_abort_handler(f"{e.__class__.__name__}: {str(e)}", grpc.StatusCode.INTERNAL)

        return await continuation(handler_call_details)
