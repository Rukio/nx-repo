# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from abc import ABC
from abc import abstractmethod

from monitoring.metrics import DataDogMetrics

from . import utils
from proto.common import risk_strat_pb2 as risk_strat_proto  # type: ignore[attr-defined]
from proto.ml_models.acuity import service_pb2 as acuity_proto  # type: ignore[attr-defined]

APPLICATION_NAME = "acuity_model"


class BaseModel(ABC):
    HIGH_ACUITY_OVERRIDE_REASON = "Patient Refuses ED"
    OVERRIDE_REASON_FIELD_NAME = "override_reason"

    def __init__(self, logger: logging.Logger, statsd: DataDogMetrics):
        self.logger = logger.getChild(self.model_namespace)
        self.statsd = statsd.create_child_client(self.model_namespace)

    def validate_request(self, request: acuity_proto.GetAcuityRequest):
        try:
            if request.age < 0:
                age_err = utils.InvalidAgeException()
                self.logger.error(str(age_err), extra={"age": request.age})
                raise age_err

            # try to convert the given risk strat protocol enum to string,
            # will raise if given a non existent value
            # NOTE: no idea what will occur with reserved enum vals
            risk_strat_proto.RiskProtocolV1.Name(request.risk_protocol)

        except ValueError:
            risk_protocol_err = utils.InvalidRiskProtocolEnumException()
            self.logger.error(
                str(risk_protocol_err),
                extra={"risk_protocol_V1_enum_int": request.risk_protocol},
            )
            raise risk_protocol_err

    @property
    @abstractmethod
    def model_namespace(self) -> str:
        pass

    @abstractmethod
    def run(self, request: acuity_proto.GetAcuityRequest) -> acuity_proto.Acuity:
        pass
