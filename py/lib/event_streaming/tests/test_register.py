# -*- coding: utf-8 -*-
from __future__ import annotations

from pathlib import Path
from unittest import mock

import pytest
from schema_management.register import register_schema


def test_register_schema(config, mock_schema_file, api, token, project, service):
    register_schema(mock_schema_file, False, project, service, token)


@pytest.mark.parametrize("file_path", ["some/path/.gitkeep", "some/path/README.md"])
def test_register_schema_skips(config, file_path, token, project, service):
    with mock.patch("schema_management.register.AivenAPIClient") as mock_api:
        register_schema(file_path, False, project, service, token)
        mock_api().register_schema_from_file.assert_not_called()


@pytest.mark.parametrize("file_path", ["some/path/something.avsc", "just_file.avsc"])
def test_register_schema_no_skips(config, file_path, token, project, service):
    with mock.patch("schema_management.register.AivenAPIClient") as mock_api:
        register_schema(file_path, False, project, service, token)
        mock_api().register_schema_from_file.assert_called()


def test_register_schema_recursive(config, mock_schema_file, token, project, service, api):
    upstream_dir = str(Path(mock_schema_file).parent)
    register_schema(upstream_dir, True, project, service, token)
