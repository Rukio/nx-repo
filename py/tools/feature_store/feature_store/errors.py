# -*- coding: utf-8 -*-
from __future__ import annotations


class MissingEventTimeError(Exception):
    pass


class MissingEventTimeColumnError(Exception):
    pass


class EventTimeFeatureTypeError(Exception):
    pass
