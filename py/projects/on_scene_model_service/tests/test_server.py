# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from typing import Dict
from unittest import mock

import grpc
import on_scene_model_service
import pytest
from feature_store.query import QueryFeatureStore
from model_utils.reader import StatsigConfigReader
from monitoring.metrics import DataDogMetrics
from on_scene.core import OnSceneRequestHandler
from on_scene.features import APP_POSITION
from on_scene.features import DHMT_POSITION
from on_scene.user_lookup import UserLookup
from statsig import statsig

from proto.common import date_pb2 as date_proto
from proto.ml_models.on_scene import service_pb2 as os_proto

# initialize statsig with a dummy key; we will mock statsig calls later
statsig.initialize("secret-key")

# some mocked constants
STATSD_HOST = "statsd_host"
STATSD_PORT = 10000
STATSD_APP_NAME = "statsd_app"

_MOCK_PROV_SCORES = {1: 1.5, 2: 2.5, 3: -0.5, 4: -1.0}

logger = logging.getLogger()
handler = logging.StreamHandler()
logger.addHandler(handler)
logger.setLevel(logging.INFO)


def get_record_wrapper(member_id: str) -> Dict[str, Dict[str, str]]:
    score = _MOCK_PROV_SCORES.get(member_id, 0)
    # let's mock position for each member_id such that odd member_id's are APP
    # and even member_id's are DHMT

    def _get_position(member_id: int):
        if member_id % 2 == 0:
            return DHMT_POSITION
        return APP_POSITION

    record = {
        "Record": [
            {"FeatureName": "user_id", "ValueAsString": str(member_id)},
            {"FeatureName": "position", "ValueAsString": _get_position(int(member_id))},
            {"FeatureName": "prov_score", "ValueAsString": "%.3e" % score},
        ]
    }
    return record


@pytest.mark.asyncio
async def test_get_onscene_time_predictions(s3, service_config_json, model_config_json, os_model, users_dict):

    # mock config reader
    config_reader = mock.MagicMock(spec=StatsigConfigReader)

    def read(config_name):
        if config_name == "on_scene_model_service":
            return service_config_json
        elif config_name == "on_scene_model_v1p0":
            return model_config_json
        elif config_name == "on_scene_model_v1p1":
            return model_config_json
        else:
            raise ValueError(f"Config name {config_name} not recognized.")

    config_reader.read = mock.MagicMock(wraps=read)

    # mock DataDogMetrics
    statsd = mock.MagicMock(spec=DataDogMetrics)
    statsd.create_child_client = mock.MagicMock(return_value=DataDogMetrics(STATSD_HOST, STATSD_PORT, STATSD_APP_NAME))

    # mock UserLookup
    qfs = mock.MagicMock(spec=QueryFeatureStore)
    qfs.get_record = mock.MagicMock(wraps=get_record_wrapper)
    user_lookup = UserLookup(querier=qfs, logger=logger.getChild("UserLookup"))

    with mock.patch.object(OnSceneRequestHandler, "_load_model", return_value=os_model):
        with mock.patch.object(user_lookup, "get_users", return_value=users_dict):
            # create service
            service = on_scene_model_service.OnSceneModelService(
                logger=logging.getLogger(),
                statsd=statsd,
                config_reader=config_reader,
                s3=s3,
                user_lookup=user_lookup,
            )

            # check all model versions have been loaded
            assert service_config_json["factual_model_version"] in service.handler.models
            for shadow_ver in service_config_json["shadow_model_versions"]:
                assert shadow_ver in service.handler.models

            request = os_proto.GetOnSceneTimeRequest(
                care_request_id=12345,
                protocol_name="Head Injury",
                service_line="Acute Care",
                place_of_service="Home",
                num_crs=1,
                patient_dob=date_proto.Date(year=1980, month=3, day=11),
                risk_assessment_score=2.0,
                shift_teams=[os_proto.ShiftTeam(id=1, member_ids=[1, 2]), os_proto.ShiftTeam(id=2, member_ids=[3, 4])],
            )

            mock_context = mock.create_autospec(spec=grpc.aio.ServicerContext)
            response = await service.GetOnSceneTime(request, mock_context)

            assert response.care_request_id == request.care_request_id
            assert len(response.predictions) == len(request.shift_teams)
            assert set([team.id for team in response.predictions]) == set([team.id for team in request.shift_teams])
