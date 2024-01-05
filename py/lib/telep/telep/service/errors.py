# -*- coding: utf-8 -*-
from __future__ import annotations


class TelepMLServiceInitError(Exception):
    pass


class ClinicalOverrideError(Exception):
    pass


class RequestValidationError(Exception):
    pass


class UnsupportedClinicalOverrideRule(Exception):
    pass
