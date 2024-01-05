# -*- coding: utf-8 -*-
from __future__ import annotations

from enum import Enum

from beartype import beartype


@beartype
class BaseModelName(Enum):
    """Base enums that define supported model names in each service."""
