# -*- coding: utf-8 -*-
from __future__ import annotations

import asyncio
import logging
from unittest import mock

import boto3
import grpc
import telep_model_server
from decouple import config
from model_utils.reader import StatsigConfigReader
from monitoring.metrics import DataDogMetrics
from statsig import statsig
from statsig import StatsigOptions

from proto.common import date_pb2 as date_proto
from proto.common import demographic_pb2 as demographic_proto
from proto.ml_models.telep import service_pb2 as telep_proto


AWS_PROFILE = config("AWS_PROFILE", default=None)
# some mocked constants
STATSD_HOST = "statsd_host"
STATSD_PORT = 10000
STATSD_APP_NAME = "statsd_app"
# test config from prod
ENVIRONMENT = config("ENVIRONMENT", default="prod")


def main() -> None:
    """Start Telep model service locally and verify that it returns correctly.

    This will perform the same steps as when we start the server in production:
    it will load configs & models FROM PRODUCTION to ensure that the DEFAULT
    model in prod is not broken.
    """
    # initialize statsig
    options = StatsigOptions(tier=ENVIRONMENT)
    statsig.initialize(config("STATSIG_SERVER_SECRET_KEY"), options=options)

    # create boto3 s3 client
    session = boto3.Session(profile_name=AWS_PROFILE)
    s3 = session.client("s3")

    config_reader = StatsigConfigReader()

    # mock DataDogMetrics
    statsd = mock.MagicMock(spec=DataDogMetrics)
    statsd.create_child_client = mock.MagicMock(return_value=mock.MagicMock(spec=DataDogMetrics))

    # start up service
    logger = logging.getLogger()
    handler = logging.StreamHandler()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    # define test request data
    params = {
        "risk_protocol": "Head Injury",
        "patient_age": 1,
        "risk_score": 0.2,
        "place_of_service": "",
        "market_name": "DEN",
        "timestamp": date_proto.DateTime(),
        "gender": demographic_proto.Sex.SEX_MALE,
        "dispatcher_notes": ["patient needs secondary screening"],
        "secondary_screening_notes": ["patient is safe to see"],
    }
    telep_request = telep_proto.GetEligibilityRequest(**params)
    mock_context = mock.create_autospec(spec=grpc.aio.ServicerContext)

    try:
        service = telep_model_server.TelepService(logger=logger, statsd=statsd, config_reader=config_reader, s3=s3)
        response = asyncio.run(service.GetEligibility(telep_request, mock_context))
    except Exception as e_:
        logger.error(f"Test failed due to the following error:\n{str(e_)}")
        raise e_

    logger.warning(f"Response returned successfully with value = {response.eligible}")


if __name__ == "__main__":
    main()
