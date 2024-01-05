# -*- coding: utf-8 -*-
from __future__ import annotations


class InvalidOperator(Exception):
    """InvalidOperator is thrown when an operator does not exist in Python's operator module."""

    pass


class BadConfigSchemaError(Exception):
    """BadConfigSchemaError is thrown when input config schema is wrong."""

    pass


class ModelNotFoundError(Exception):
    """ModelNotFoundError is thrown when a model name is not defined in a TelepUseCaseConfig."""

    pass


class InvalidClinicalOverrideRuleError(Exception):
    """This is thrown when a clinical override rule is not supported."""

    pass


class MarketNameError(Exception):
    """Raised if market name is not 3-lettered shoft name."""

    pass
