# -*- coding: utf-8 -*-
from __future__ import annotations

import pytest
from event_streaming.client import TopicDoesNotExist
from schema_management.api import InvalidSchemaCompatibilityError
from schema_management.api import InvalidSchemaTypeError
from schema_management.api import InvalidSubjectNameError

TEST_TOPIC = "analytics.avro.test_topic"
TEST_SUBJECT = f"{TEST_TOPIC}-value"


@pytest.mark.parametrize(
    "subject_name", ["some_topic-key", "some_topic-value", "another-value", "HOT-key", "Topic-value"]
)
def test_validate_subject_name(subject_name, api):
    api._validate_subject_name(subject_name)


@pytest.mark.parametrize(
    "subject_name", ["some_topic_key", "some_topic-val", "anothervalue", "HOT---_key", "Topic-kie"]
)
def test_validate_subject_name_fail(subject_name, api):
    with pytest.raises(InvalidSubjectNameError):
        api._validate_subject_name(subject_name)


def test_get_topics(api):
    assert api.get_topics() == [TEST_TOPIC]


def test_check_topic_exists(api, project, service):
    assert api.check_topic_exists(TEST_TOPIC, project, service)


def test_check_topics_exists_fail(api, project, service):
    assert not api.check_topic_exists("notatopic", project, service)


def test_check_subject_exists(api, project, service):
    assert api.check_subject_exists(TEST_SUBJECT, project, service)


def test_check_subject_exists_fail(api, project, service):
    assert not api.check_subject_exists("notasubject", project, service)


@pytest.mark.parametrize("schema_type", ["AVRO", "JSON", "PROTOBUF"])
def test_check_schema_type(api, schema_type):
    api.check_schema_type(schema_type)


@pytest.mark.parametrize("schema_type", ["CSV", "GREEK", "AVSC"])
def test_check_schema_type_fails(api, schema_type):
    with pytest.raises(InvalidSchemaTypeError):
        api.check_schema_type(schema_type)


def test_compatibility(api, mock_schema, mock_subject):
    api.test_compatibility(mock_subject, mock_schema)


def test_get_compatibility(api, mock_subject):
    api.get_compatibility(mock_subject)


def test_validate_schema_compatibility(config, mock_schema, api):
    api.validate_schema_compatibility(TEST_SUBJECT, mock_schema)


def test_validate_schema_compatibility_from_file(config, mock_schema_file, api, project, service):
    api.validate_schema_compatibility_from_file(mock_schema_file, project, service)


def test_validate_schema_compatibility_from_file_new_subject(
    config, mock_schema_file, api_no_subject, project, service
):
    api_no_subject.validate_schema_compatibility_from_file(mock_schema_file, project, service)


def test_validate_schema_compatibility_error(config, mock_schema, api_error, project, service):
    with pytest.raises(InvalidSchemaCompatibilityError):
        api_error.validate_schema_compatibility(TEST_SUBJECT, mock_schema, project, service)


def test_validate_schema_compatibility_from_file_error(config, mock_schema_file, api_error, project, service):
    with pytest.raises(InvalidSchemaCompatibilityError):
        api_error.validate_schema_compatibility_from_file(mock_schema_file, project, service)


def test_validate_schema_compatibility_from_file_no_topic_fail(
    config, mock_schema_file, api_no_topics, project, service
):
    with pytest.raises(TopicDoesNotExist):
        api_no_topics.validate_schema_compatibility_from_file(mock_schema_file, project, service)


@pytest.mark.parametrize(
    "file_name,expected_topic,expected_subject",
    (
        ["events/analytics/avro/test_topic-value.avsc", "analytics.avro.test_topic", "analytics.avro.test_topic-value"],
        [
            "events/analytics/events/avro/test_topic-value.avsc",
            "analytics.events.avro.test_topic",
            "analytics.events.avro.test_topic-value",
        ],
        [
            "my_home_dir_events/services/events/analytics/events/avro/test_topic-value.avsc",
            "analytics.events.avro.test_topic",
            "analytics.events.avro.test_topic-value",
        ],
        [
            "my_home_dir_events/services/events/analytic_events/avro/test_topic-value.avsc",
            "analytic_events.avro.test_topic",
            "analytic_events.avro.test_topic-value",
        ],
        [
            "events/analytics/avro/Some-CAPS_and*otherchars-key.avsc",
            "analytics.avro.Some-CAPS_and*otherchars",
            "analytics.avro.Some-CAPS_and*otherchars-key",
        ],
        [
            "events/analytics/avro/a-lot-of-dashes-otherfield.avsc",
            "analytics.avro.a-lot-of-dashes",
            "analytics.avro.a-lot-of-dashes-otherfield",
        ],
        [
            "events/analytics/avro/no_file_extension-value",
            "analytics.avro.no_file_extension",
            "analytics.avro.no_file_extension-value",
        ],
    ),
)
def test_parse_topic_and_subject_names(config, file_name, expected_topic, expected_subject, api):
    topic, subject = api.parse_topic_and_subject_names_from_file(file_name)
    assert topic == expected_topic
    assert subject == expected_subject


def test_register_schema(config, mock_schema, api):
    api.register_schema(TEST_SUBJECT, mock_schema)


def test_register_schema_from_file(config, mock_schema_file, api, project, service):
    api.register_schema_from_file(mock_schema_file, project, service)


def test_register_from_file_no_topic_fail(config, mock_schema_file, api_no_topics, project, service):
    with pytest.raises(TopicDoesNotExist):
        api_no_topics.register_schema_from_file(mock_schema_file, project, service)
