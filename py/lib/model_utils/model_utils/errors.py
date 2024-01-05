# -*- coding: utf-8 -*-
from __future__ import annotations


class InvalidAuthors(Exception):
    """
    InvalidAuthors is thrown when their are no authors provided, or an author string is not
    a dispatch health email
    """

    pass


class InvalidTrainingSet(Exception):
    """This is thrown if something is not quite right about the training set."""

    pass


class InvalidTestSet(Exception):
    """This is thrown if something is not quite right about the test set."""

    pass


class IncompatibleTraingAndTestSet(Exception):
    """This is thrown if training set and test set have different number of features."""

    pass


class InvalidPath(Exception):
    """This is thrown when an invalid path is given."""

    pass


class VersionConflictError(Exception):
    """This is thrown when model with the same version string already exists."""

    pass


class EmptyDescriptionError(Exception):
    """This is thrown when no description is passed to ModelConfig."""

    pass


class InvalidClinicalOverrideRuleError(Exception):
    """This is thrown when a clinical override rule is not supported."""

    pass


class ConflictingRiskProtocolMappingError(Exception):
    pass


class MissingRiskProtocolColumn(Exception):
    pass


class ConfigReadError(Exception):
    pass


class MissingEvalMetricError(Exception):
    pass


class UnsupportedMetricError(Exception):
    pass


class ModelValidationError(Exception):
    pass


class ModelValidationWarning(Exception):
    pass
