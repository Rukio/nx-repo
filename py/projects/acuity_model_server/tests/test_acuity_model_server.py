# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from concurrent import futures
from unittest import mock
from unittest.mock import patch

import acuity_model as acuity_model_lib
import acuity_model_server
import grpc
import pytest
from grpc_health.v1 import health
from grpc_health.v1 import health_pb2
from grpc_testing import server_from_dictionary
from grpc_testing import strict_real_time
from statsig import statsig

from proto.common import risk_strat_pb2 as risk_strat_proto
from proto.ml_models.acuity import service_pb2 as acuity_proto

statsig.initialize("secret-key")


@pytest.mark.asyncio
async def test_unit_get_acuity_valid_request():
    service = acuity_model_server.AcuityService(logger=logging.getLogger(), statsd=mock.MagicMock())
    get_acuity_req_valid = acuity_proto.GetAcuityRequest(
        age=5, risk_protocol=risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_SUGAR_CONCERNS
    )
    expected_get_acuity_response = acuity_proto.GetAcuityResponse(acuity=acuity_proto.ACUITY_MEDIUM)
    mock_context = mock.create_autospec(spec=grpc.aio.ServicerContext)
    response = await service.GetAcuity(get_acuity_req_valid, mock_context)
    assert response == expected_get_acuity_response


@patch.object(acuity_model_lib.V0, "run")
@patch.object(acuity_model_lib.V2, "run")
@pytest.mark.asyncio
async def test_unit_get_acuity_with_version_2_model(mock_v2_run, mock_v0_run):
    with patch.object(statsig, "check_gate", return_value=True):
        service = acuity_model_server.AcuityService(logger=mock.MagicMock(), statsd=mock.MagicMock())
        mock_context = mock.create_autospec(spec=grpc.aio.ServicerContext)
        get_acuity_request = acuity_proto.GetAcuityRequest(
            age=5, risk_protocol=risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_SUGAR_CONCERNS
        )
        await service.GetAcuity(get_acuity_request, mock_context)

        mock_v2_run.assert_called()
        mock_v0_run.assert_not_called()


@patch.object(acuity_model_lib.V0, "run")
@patch.object(acuity_model_lib.V2, "run")
@pytest.mark.asyncio
async def test_unit_get_acuity_with_version_0_model(mock_v2_run, mock_v0_run):
    with patch.object(statsig, "check_gate", return_value=False):
        service = acuity_model_server.AcuityService(logger=mock.MagicMock(), statsd=mock.MagicMock())
        mock_context = mock.create_autospec(spec=grpc.aio.ServicerContext)
        get_acuity_request = acuity_proto.GetAcuityRequest(
            age=5, risk_protocol=risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_SUGAR_CONCERNS
        )
        await service.GetAcuity(get_acuity_request, mock_context)

        mock_v2_run.assert_not_called()
        mock_v0_run.assert_called()


@pytest.mark.parametrize(
    "get_acuity_request, expected_exception, expected_status_code",
    [
        (
            acuity_proto.GetAcuityRequest(age=-5, risk_protocol=6),
            acuity_model_lib.InvalidAgeException(),
            grpc.StatusCode.INVALID_ARGUMENT,
        ),
        (
            acuity_proto.GetAcuityRequest(age=5, risk_protocol=200),
            acuity_model_lib.InvalidRiskProtocolEnumException(),
            grpc.StatusCode.INVALID_ARGUMENT,
        ),
    ],
)
@pytest.mark.asyncio
async def test_unit_get_acuity_invalid(get_acuity_request, expected_exception, expected_status_code):
    statsd_mock = mock.MagicMock()
    service = acuity_model_server.AcuityService(logger=mock.MagicMock(), statsd=statsd_mock)
    mock_context = mock.create_autospec(spec=grpc.aio.ServicerContext)
    await service.GetAcuity(get_acuity_request, mock_context)
    assert len(mock_context.set_details.call_args_list) == 1
    assert mock_context.set_details.call_args_list[0] == mock.call(
        f"{expected_exception.__class__.__name__}: {str(expected_exception)}"
    )

    assert len(mock_context.set_code.call_args_list) == 1
    assert mock_context.set_code.call_args_list[0] == mock.call(expected_status_code)
    statsd_mock.increment.assert_called_once_with(
        "invalid_argument", tags=[f"service:{acuity_model_server.PROTO_SERVICE_NAME}"]
    )


@pytest.mark.asyncio
async def test_unit_unexpected_exception():
    statsd_mock = mock.MagicMock()
    service = acuity_model_server.AcuityService(logger=mock.MagicMock(), statsd=statsd_mock)
    service.model.run = mock.Mock(side_effect=Exception())
    get_acuity_request = acuity_proto.GetAcuityRequest()
    mock_context = mock.create_autospec(spec=grpc.aio.ServicerContext)
    await service.GetAcuity(get_acuity_request, mock_context)
    assert len(mock_context.set_details.call_args_list) == 1
    assert mock_context.set_details.call_args_list[0] == mock.call("Unexpected Error has occurred")

    assert len(mock_context.set_code.call_args_list) == 1
    assert mock_context.set_code.call_args_list[0] == mock.call(grpc.StatusCode.INTERNAL)

    assert (
        mock.call("Unexpected error has occurred", extra={"exception_name": "Exception"})
        in service.logger.exception.call_args_list
    )
    statsd_mock.increment.assert_called_once_with(
        "unexpected_error_has_occurred", tags=[f"service:{acuity_model_server.PROTO_SERVICE_NAME}"]
    )


def _setup_acuity_server_with_healthcheck():
    acuity_servicer = acuity_model_server.AcuityService(logger=mock.MagicMock(), statsd=mock.MagicMock())
    health_servicer = health.HealthServicer(
        experimental_non_blocking=True, experimental_thread_pool=futures.ThreadPoolExecutor(max_workers=256)
    )
    servicers = {
        acuity_proto.DESCRIPTOR.services_by_name["AcuityV1Service"]: acuity_servicer,
        health_pb2.DESCRIPTOR.services_by_name["Health"]: health_servicer,
    }
    server = server_from_dictionary(servicers, strict_real_time())
    for service in acuity_proto.DESCRIPTOR.services_by_name.values():
        health_servicer.set(service.full_name, health_pb2.HealthCheckResponse.SERVING)

    return server, servicers


@pytest.mark.asyncio
async def test_healthcheck_serving():
    # Setup server with healthcheck
    test_server, _ = _setup_acuity_server_with_healthcheck()
    health_descriptor = health_pb2.DESCRIPTOR.services_by_name["Health"]
    acuity_descriptor = acuity_proto.DESCRIPTOR.services_by_name["AcuityV1Service"]

    # Health Check
    healthcheck_request = health_pb2.HealthCheckRequest(service="ml_models.acuity.AcuityV1Service")
    check_method = test_server.invoke_unary_unary(
        method_descriptor=(health_descriptor.methods_by_name["Check"]),
        invocation_metadata={},
        request=healthcheck_request,
        timeout=1,
    )
    response, _, code, _ = check_method.termination()
    assert code == grpc.StatusCode.OK
    assert response.status == health_pb2.HealthCheckResponse.SERVING

    # Acuity request
    acuity_request = acuity_proto.GetAcuityRequest(
        age=5, risk_protocol=risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_SUGAR_CONCERNS
    )
    get_acuity_method = test_server.invoke_unary_unary(
        method_descriptor=(acuity_descriptor.methods_by_name["GetAcuity"]),
        invocation_metadata={},
        request=acuity_request,
        timeout=1,
    )
    response, _, code, _ = get_acuity_method.termination()
    acuity = await response

    expected_get_acuity_response = acuity_proto.GetAcuityResponse(acuity=acuity_proto.ACUITY_MEDIUM)
    assert acuity == expected_get_acuity_response


@pytest.mark.asyncio
async def test_healthcheck_not_serving():
    # Setup server with HealthCheck servicer
    test_server, servicers = _setup_acuity_server_with_healthcheck()
    health_descriptor = health_pb2.DESCRIPTOR.services_by_name["Health"]
    acuity_descriptor = acuity_proto.DESCRIPTOR.services_by_name["AcuityV1Service"]

    # Mark Acuity Service as not serving.
    health_servicer = servicers[health_descriptor]
    health_servicer.set(acuity_descriptor.full_name, health_pb2.HealthCheckResponse.NOT_SERVING)

    # Health Check
    healthcheck_request = health_pb2.HealthCheckRequest(service="ml_models.acuity.AcuityV1Service")
    check_method = test_server.invoke_unary_unary(
        method_descriptor=(health_descriptor.methods_by_name["Check"]),
        invocation_metadata={},
        request=healthcheck_request,
        timeout=1,
    )
    response, _, code, _ = check_method.termination()
    assert code == grpc.StatusCode.OK
    assert response.status == health_pb2.HealthCheckResponse.NOT_SERVING


@pytest.mark.asyncio
async def test_healthcheck_unknown():
    # Setup server with HealthCheck servicer
    test_server, _ = _setup_acuity_server_with_healthcheck()
    health_descriptor = health_pb2.DESCRIPTOR.services_by_name["Health"]

    # Health Check
    healthcheck_request = health_pb2.HealthCheckRequest(service="ml_models.acuity.UNKNOWN")
    check_method = test_server.invoke_unary_unary(
        method_descriptor=(health_descriptor.methods_by_name["Check"]),
        invocation_metadata={},
        request=healthcheck_request,
        timeout=1,
    )
    response, _, code, _ = check_method.termination()
    assert code == grpc.StatusCode.NOT_FOUND
    assert response.status == health_pb2.HealthCheckResponse.UNKNOWN
