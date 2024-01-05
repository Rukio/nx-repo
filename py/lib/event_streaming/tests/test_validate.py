# -*- coding: utf-8 -*-
from __future__ import annotations

from pathlib import Path
from unittest import mock

import pytest
from schema_management.api import InvalidSchemaCompatibilityError
from schema_management.validate import validate_schema


def test_validate_schema(config, mock_schema_file, api, token, project, service):
    validate_schema(mock_schema_file, False, project, service, token)


def test_validate_schema_incompatible(config, mock_schema_file, token, project, service, api_error):
    with pytest.raises(InvalidSchemaCompatibilityError):
        validate_schema(mock_schema_file, False, project, service, token)


def test_validate_schema_recursive(config, mock_schema_file, token, project, service, api):
    upstream_dir = str(Path(mock_schema_file).parent)
    validate_schema(upstream_dir, True, project, service, token)


def test_validate_schema_incompatible_recursive(config, mock_schema_file, api_error, project, service, token):
    with pytest.raises(InvalidSchemaCompatibilityError):
        validate_schema(mock_schema_file, True, project, service, token)


@pytest.mark.parametrize("file_path", ["some/path/.gitkeep", "some/path/README.md"])
def test_validate_schema_skips(config, file_path, token, project, service):
    with mock.patch("schema_management.validate.AivenAPIClient") as mock_api:
        validate_schema(file_path, False, project, service, token)
        mock_api().register_schema_from_file.assert_not_called()


@pytest.mark.parametrize("file_path", ["some/path/something.avsc", "just_file.avsc"])
def test_validate_schema_no_skips(config, file_path, token, project, service):
    with mock.patch("schema_management.validate.AivenAPIClient") as mock_api:
        validate_schema(file_path, False, project, service, token)
        mock_api().validate_schema_compatibility_from_file.assert_called()
