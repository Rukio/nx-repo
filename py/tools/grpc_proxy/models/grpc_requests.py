# -*- coding: utf-8 -*-
from __future__ import annotations

from typing import List
from typing import Optional

from pydantic import BaseModel


class AcuityRequest(BaseModel):
    age: int
    risk_protocol: int
    override_reason: Optional[str]
    risk_strat_bypassed: Optional[bool]
    market_short_name: Optional[str]
    statsig_care_request_id: Optional[str]


class TimeZone(BaseModel):
    # IANA Time Zone Database time zone, e.g. "America/New_York".
    id: str
    # Optional. IANA Time Zone Database version number, e.g. "2019a".
    version: Optional[str]


class Timestamp(BaseModel):
    year: int
    month: int
    day: int
    hours: int
    minutes: int
    seconds: int
    time_zone: TimeZone


class TelepRequest(BaseModel):
    risk_protocol: Optional[str]
    patient_age: Optional[int]
    risk_score: Optional[float]
    place_of_service: Optional[str]
    market_name: Optional[str]
    care_request_id: Optional[int]
    timestamp: Optional[Timestamp]
    gender: Optional[int]
    secondary_screening_notes: list[str] | None
    dispatcher_notes: list[str] | None


class Date(BaseModel):
    year: int
    month: int
    day: int


class ShiftTeam(BaseModel):
    id: Optional[int]
    member_ids: Optional[List[int]]


class OnSceneRequest(BaseModel):
    care_request_id: Optional[int]
    protocol_name: Optional[str]
    service_line: Optional[str]
    place_of_service: Optional[str]
    num_crs: Optional[int]
    patient_dob: Optional[Date]
    risk_assessment_score: Optional[float]
    shift_teams: Optional[List[ShiftTeam]]
