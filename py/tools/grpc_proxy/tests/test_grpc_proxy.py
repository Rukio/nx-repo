# -*- coding: utf-8 -*-
from __future__ import annotations

import datetime
import os
from unittest import mock

import decouple
import grpc_proxy.server as server
import pytest
from fastapi.testclient import TestClient
from models.grpc_requests import AcuityRequest
from models.grpc_requests import OnSceneRequest
from models.grpc_requests import TelepRequest

from proto.ml_models.acuity import service_pb2 as acuity_proto
from proto.ml_models.on_scene import service_pb2 as on_scene_proto
from proto.ml_models.telep import service_pb2 as telep_proto


BEARER_TOKEN = "Bearer token"


@mock.patch.dict(os.environ, {}, clear=True)
def test_health_check_does_not_start_if_no_git_sha_provided():
    with pytest.raises(decouple.UndefinedValueError):
        with TestClient(server.app):
            pass  # NOTE: doesn't get here, fails on init


@mock.patch.dict(os.environ, {"GIT_SHA": "123a", "HEALTHCHECK_GRPC_SERVICE_NAME": "ml_models.telep.TelepV1Service"})
def test_health_check_returns_200_with_git_sha_provided():
    with mock.patch.object(server, "health_check_client") as health_check_client:
        health_check_client.Check().status = 1
        with TestClient(server.app) as client:
            time_now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
            response = client.get("/healthcheck")
            assert response.status_code == 200

            resp_json = response.json()

            assert resp_json["status"] == "SERVING"
            assert len(resp_json) == 5
            assert "git_sha" in resp_json
            assert resp_json["git_sha"] == "123a"

            assert "server_start_utc" in resp_json
            server_start = datetime.datetime.fromisoformat(resp_json["server_start_utc"])
            diff_between_times = time_now - server_start
            assert diff_between_times < datetime.timedelta(seconds=1)


@mock.patch.dict(os.environ, {"GIT_SHA": "123a", "HEALTHCHECK_GRPC_SERVICE_NAME": "ml_models.telep.TelepV1Service"})
def test_health_check_returns_400_with_git_sha_provided():
    with mock.patch.object(server, "health_pb2_grpc") as health_pb2_grpc:
        health_pb2_grpc.HealthStub().Check().status = 0
        with TestClient(server.app) as client:
            response = client.get("/healthcheck")
            assert response.status_code == 503

            resp_json = response.json()
            assert len(resp_json) == 5
            assert resp_json["status"] == "UNKNOWN"


@mock.patch.dict(os.environ, {"GIT_SHA": "123a"})
def test_acuity_proxy():
    with mock.patch.object(server, "acuity_client") as acuity_client:
        acuity_client.GetAcuity().acuity = 1
        with TestClient(server.app) as client:
            response = client.post(
                "/acuity_proxy", json={"age": 5, "risk_protocol": 1}, headers={"Authorization": BEARER_TOKEN}
            )
            assert response.status_code == 200

            resp_json = response.json()

            assert resp_json["acuity"] == 1


def test_acuity_model_proto_sync():
    grpc_request = acuity_proto.GetAcuityRequest()
    grpc_request_fields = set(field.name for field in grpc_request.DESCRIPTOR.fields)
    model_request_fields = set(AcuityRequest.__fields__)
    assert grpc_request_fields == model_request_fields


@mock.patch.dict(os.environ, {"GIT_SHA": "123a"})
def test_telep_proxy():
    with mock.patch.object(server, "telep_client") as telep_client:
        telep_client.GetEligibility().eligible = True
        telep_client.GetEligibility().model_version = "1.0.0"
        with TestClient(server.app) as client:
            response = client.post("/telep_proxy", json={}, headers={"Authorization": BEARER_TOKEN})
            assert response.status_code == 200


def test_telep_model_proto_sync():
    grpc_request = telep_proto.GetEligibilityRequest()
    grpc_request_fields = set(field.name for field in grpc_request.DESCRIPTOR.fields)
    model_request_fields = set(TelepRequest.__fields__)
    assert grpc_request_fields == model_request_fields


@mock.patch.dict(os.environ, {"GIT_SHA": "123a"})
def test_on_scene_proxy():
    with mock.patch.object(server, "on_scene_client") as on_scene_client:
        on_scene_client.GetOnSceneTime().care_request_id = 12345
        on_scene_client.GetOnSceneTime().predictions = [on_scene_proto.ShiftTeamPrediction(id=1, prediction=50)]
        with TestClient(server.app) as client:
            response = client.post("/on_scene_proxy", json={}, headers={"Authorization": BEARER_TOKEN})
            assert response.status_code == 200


def test_on_scene_model_proto_sync():
    grpc_request = on_scene_proto.GetOnSceneTimeRequest()
    grpc_request_fields = set(field.name for field in grpc_request.DESCRIPTOR.fields)
    model_request_fields = set(OnSceneRequest.__fields__)
    assert grpc_request_fields == model_request_fields
