# -*- coding: utf-8 -*-
from __future__ import annotations


class MissingCareRequestError(Exception):
    """Raised when request has zero or negative num_crs."""


class MissingShiftTeamsError(Exception):
    """Raised when there are no shift teams in the request."""


class InvalidVersionError(Exception):
    """Raised when version string is invalid."""
