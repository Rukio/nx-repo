# -*- coding: utf-8 -*-
from __future__ import annotations

# fun fact: the oldest recorded human was 122 yrs and 164 days old
OLD_AGE = 123


class AcuityModelException(Exception):
    """
    AcuityModelException wraps base Exception, and serves as a base for other custom exceptions
    """

    pass


class InvalidAgeException(AcuityModelException):
    """
    InvalidAgeException is thrown when an invalid input age is provided
    """

    def __str__(self):
        return "Error in provided GetAcuityRequest: age must not be less than 0"


class InvalidRiskProtocolEnumException(AcuityModelException):
    """
    InvalidRiskProtocolEnumException is thrown when an invalid risk protocol int value is provided
    """

    def __str__(self):
        return "Error: provided risk protocol enum is invalid"


class ProtocolNotHandledInModelException(AcuityModelException):
    """
    ProtocolNotHandledInModelException is thrown when a given RiskProtocol is not covered by the current model
    """

    def __str__(self):
        return "Error: Valid Risk Strat proto does not have logic to match to"
