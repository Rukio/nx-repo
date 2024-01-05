# -*- coding: utf-8 -*-
from __future__ import annotations

import os
from unittest import mock

import pytest
from schema_management.utils import AIVEN_API_TOKEN_NAME
from schema_management.utils import get_token


def test_get_token():
    with mock.patch.dict(os.environ, {AIVEN_API_TOKEN_NAME: "some_token"}, clear=True):
        assert get_token()


def test_get_token_fails():
    with mock.patch.dict(os.environ, {"WRONG_ENV": "some_token"}, clear=True), pytest.raises(EnvironmentError):
        get_token()
