# -*- coding: utf-8 -*-
from __future__ import annotations

import base64
import json
import os
from tempfile import TemporaryDirectory
from unittest import mock
from urllib.parse import urljoin

import pytest
import requests_mock
from event_streaming.config import get_kafka_config
from schema_management.api import AivenAPIClient
from schema_management.api import API_V1_GET_COMPATIBILITY
from schema_management.api import API_V1_GET_SUBJECTS_URL
from schema_management.api import API_V1_GET_TOPICS_URL
from schema_management.api import API_V1_POST_REGISTER_URL
from schema_management.api import API_V1_POST_TEST_COMPATIBILITY_URL
from schema_management.api import InvalidSchemaCompatibilityError

MOCK_BIG_ENV_VAR = "BASE64ENCODEDSECRET"
MOCK_BASE_64_VAR = base64.b64encode(MOCK_BIG_ENV_VAR.encode()).decode()

MOCK_ENV_VARIABLES = {
    "SCHEMA_REGISTRY_URL": "https://user:pass@test.aivencloud.com:12345",
    "KAFKA_BROKERS": "test.aivencloud.com:12346",
    "KAFKA_BROKER_CA_PEM": MOCK_BASE_64_VAR,
    "KAFKA_BROKER_CERTIFICATE_PEM": MOCK_BASE_64_VAR,
    "KAFKA_BROKER_KEY_PEM": MOCK_BASE_64_VAR,
}

MOCK_SCHEMA_JSON = {
    "type": "record",
    "name": "userInfo",
    "namespace": "my.example",
    "fields": [
        {"name": "age", "type": "int"},
        {"name": "name", "type": ["null", "string"], "default": None},
    ],
}
MOCK_SCHEMA = json.dumps(MOCK_SCHEMA_JSON)


class MockTopics:
    topics = {"topic_1": {"metadata": "about topic"}}


@pytest.fixture
def mock_env_vars():
    with mock.patch.dict(os.environ, MOCK_ENV_VARIABLES, clear=True) as mock_env:
        yield mock_env


@pytest.fixture
def config(mock_env_vars):
    kafka_config = get_kafka_config()
    yield kafka_config


@pytest.fixture
def mock_admin_client():
    with mock.patch("event_streaming.client.AdminClient") as mock_admin_client:
        yield mock_admin_client


@pytest.fixture
def mock_schema_registry():
    with mock.patch("event_streaming.client.SchemaRegistryClient") as mock_schema_registry:
        mock_schema_registry.return_value.get_subjects.return_value = []
        mock_schema_registry.return_value.test_compatibility.return_value = True
        yield mock_schema_registry


@pytest.fixture
def mock_schema_registry_error():
    with mock.patch("event_streaming.client.SchemaRegistryClient") as mock_schema_registry:
        msg = (
            "The schema test_schema-value is not compatible with the latest version with schema compatibility "
            "BACKWARDS."
        )
        mock_schema_registry.return_value.test_compatibility.side_effect = InvalidSchemaCompatibilityError(msg)
        yield mock_schema_registry


@pytest.fixture
def mock_confluent_producer():
    with mock.patch("event_streaming.producer.ConfluentProducer") as mock_confluent_producer:
        mock_confluent_producer.return_value.poll.return_value = 1
        mock_confluent_producer.return_value.flush.return_value = 1
        yield mock_confluent_producer


@pytest.fixture
def mock_schema():
    return {
        "type": "record",
        "name": "example",
        "fields": [{"name": "name", "type": "string"}, {"name": "age", "type": "int"}],
    }


@pytest.fixture
def mock_schema_file(mock_schema):
    with TemporaryDirectory() as tmp_dir:
        mock_schema_dir = os.path.join(tmp_dir, "events/analytics/avro")
        os.makedirs(mock_schema_dir)
        mock_schema_path = os.path.join(mock_schema_dir, "test_topic-value.avsc")

        with open(mock_schema_path, "w+") as file_obj:
            json.dump(mock_schema, file_obj)
        yield mock_schema_path


TEST_TOPIC = "analytics.avro.test_topic"
TEST_SUBJECT = f"{TEST_TOPIC}-value"
TEST_SUBJECTS_RESPONSE = {"subjects": [TEST_SUBJECT]}
TEST_TOPICS_RESPONSE = {
    "topics": [
        {
            "cleanup_policy": "compact",
            "min_insync_replicas": 1,
            "partitions": 3,
            "replication": 3,
            "retention_bytes": -1,
            "retention_hours": 168,
            "state": "ACTIVE",
            "tags": [{"key": "Environment", "value": "dev"}, {"key": "Application", "value": "shared"}],
            "topic_name": TEST_TOPIC,
        }
    ]
}
TEST_NO_TOPICS_RESPONSE = {"topics": []}
TEST_NO_SUBJECTS_RESPONSE = {"subjects": []}
TEST_COMPATIBLE_SCHEMA_RESPONSE = {"is_compatible": True}
TEST_REGISTER_SCHEMA_RESPONSE = {"id": 8}
TEST_BACKWARDS_COMPAT_RESPONSE = {"compatibilityLevel": "BACKWARDS"}


@pytest.fixture
def mock_subject():
    return TEST_SUBJECT


@pytest.fixture
def mock_topic():
    return TEST_TOPIC


@pytest.fixture
def project():
    return "test-project"


@pytest.fixture
def service():
    return "test-service"


@pytest.fixture
def token():
    return "test-token"


@pytest.fixture
def api(project, service, token, mock_schema, mock_subject):
    with requests_mock.Mocker() as m:
        api = AivenAPIClient(token, project, service)
        format_dict = {"project_name": project, "service_name": service}

        get_topics_url = urljoin(api.base_url, API_V1_GET_TOPICS_URL.format(**format_dict))
        m.get(get_topics_url, json=TEST_TOPICS_RESPONSE)

        get_subjects_url = urljoin(api.base_url, API_V1_GET_SUBJECTS_URL.format(**format_dict))
        m.get(get_subjects_url, json=TEST_SUBJECTS_RESPONSE)

        post_test_compat_url = urljoin(
            api.base_url,
            API_V1_POST_TEST_COMPATIBILITY_URL.format(
                **{**format_dict, "subject_name": mock_subject, "version": "latest"}
            ),
        )
        m.post(
            post_test_compat_url,
            json=TEST_COMPATIBLE_SCHEMA_RESPONSE,
        )

        get_compat_url = urljoin(
            api.base_url,
            API_V1_GET_COMPATIBILITY.format(**{**format_dict, "subject_name": mock_subject, "version": "latest"}),
        )
        m.get(
            get_compat_url,
            json=TEST_BACKWARDS_COMPAT_RESPONSE,
        )

        post_register_schema_url = urljoin(
            api.base_url,
            API_V1_POST_REGISTER_URL.format(**{**format_dict, "subject_name": mock_subject, "version": "latest"}),
        )
        m.post(
            post_register_schema_url,
            json=TEST_REGISTER_SCHEMA_RESPONSE,
        )

        yield api


@pytest.fixture
def api_error(project, service, token, mock_schema, mock_subject):
    with requests_mock.Mocker() as m:
        api = AivenAPIClient(token, project, service)
        format_dict = {"project_name": project, "service_name": service}

        get_topics_url = urljoin(api.base_url, API_V1_GET_TOPICS_URL.format(**format_dict))
        m.get(get_topics_url, json=TEST_TOPICS_RESPONSE)

        get_subjects_url = urljoin(api.base_url, API_V1_GET_SUBJECTS_URL.format(**format_dict))
        m.get(get_subjects_url, json=TEST_SUBJECTS_RESPONSE)

        post_test_compat_url = urljoin(
            api.base_url,
            API_V1_POST_TEST_COMPATIBILITY_URL.format(
                **{**format_dict, "subject_name": mock_subject, "version": "latest"}
            ),
        )
        m.post(post_test_compat_url, json={"is_compatible": False})

        get_compat_url = urljoin(
            api.base_url,
            API_V1_GET_COMPATIBILITY.format(**{**format_dict, "subject_name": mock_subject, "version": "latest"}),
        )
        m.get(
            get_compat_url,
            json=TEST_BACKWARDS_COMPAT_RESPONSE,
        )
        yield api


@pytest.fixture
def api_no_topics(project, service, token, mock_schema, mock_subject):
    with requests_mock.Mocker() as m:
        api = AivenAPIClient(token, project, service)
        format_dict = {"project_name": project, "service_name": service}

        get_topics_url = urljoin(api.base_url, API_V1_GET_TOPICS_URL.format(**format_dict))
        m.get(get_topics_url, json=TEST_NO_TOPICS_RESPONSE)

        get_subjects_url = urljoin(api.base_url, API_V1_GET_SUBJECTS_URL.format(**format_dict))
        m.get(get_subjects_url, json=TEST_NO_SUBJECTS_RESPONSE)

        post_test_compat_url = urljoin(
            api.base_url,
            API_V1_POST_TEST_COMPATIBILITY_URL.format(
                **{**format_dict, "subject_name": mock_subject, "version": "latest"}
            ),
        )
        m.post(post_test_compat_url, json=TEST_COMPATIBLE_SCHEMA_RESPONSE)

        get_compat_url = urljoin(
            api.base_url,
            API_V1_GET_COMPATIBILITY.format(**{**format_dict, "subject_name": mock_subject, "version": "latest"}),
        )
        m.get(
            get_compat_url,
            json=TEST_BACKWARDS_COMPAT_RESPONSE,
        )
        yield api


@pytest.fixture
def api_no_subject(project, service, token, mock_schema, mock_subject):
    with requests_mock.Mocker() as m:
        api = AivenAPIClient(token, project, service)
        format_dict = {"project_name": project, "service_name": service}

        get_topics_url = urljoin(api.base_url, API_V1_GET_TOPICS_URL.format(**format_dict))
        m.get(get_topics_url, json=TEST_TOPICS_RESPONSE)

        get_subjects_url = urljoin(api.base_url, API_V1_GET_SUBJECTS_URL.format(**format_dict))
        m.get(get_subjects_url, json=TEST_NO_SUBJECTS_RESPONSE)

        post_test_compat_url = urljoin(
            api.base_url,
            API_V1_POST_TEST_COMPATIBILITY_URL.format(
                **{**format_dict, "subject_name": mock_subject, "version": "latest"}
            ),
        )
        m.post(
            post_test_compat_url,
            json=TEST_COMPATIBLE_SCHEMA_RESPONSE,
        )

        get_compat_url = urljoin(
            api.base_url,
            API_V1_GET_COMPATIBILITY.format(**{**format_dict, "subject_name": mock_subject, "version": "latest"}),
        )
        m.get(
            get_compat_url,
            json=TEST_BACKWARDS_COMPAT_RESPONSE,
        )

        post_register_schema_url = urljoin(
            api.base_url,
            API_V1_POST_REGISTER_URL.format(**{**format_dict, "subject_name": mock_subject, "version": "latest"}),
        )
        m.post(
            post_register_schema_url,
            json=TEST_REGISTER_SCHEMA_RESPONSE,
        )

        yield api
