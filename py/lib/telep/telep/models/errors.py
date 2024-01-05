# -*- coding: utf-8 -*-
from __future__ import annotations


class ModelValidationError(Exception):
    pass


class TooManyEvalMetricsError(Exception):
    pass


class AmbiguousEvalSetError(Exception):
    pass
