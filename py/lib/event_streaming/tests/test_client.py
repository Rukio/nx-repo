# -*- coding: utf-8 -*-
from __future__ import annotations

from event_streaming.client import KafkaClient
from tests.conftest import MockTopics


def test_check_topic_exists(config, mock_admin_client, mock_confluent_producer):
    client = KafkaClient(config)
    client.admin_client.list_topics.return_value = MockTopics()

    assert client.check_topic_exists("topic_1")


def test_check_topic_doesnt_exist(config, mock_admin_client, mock_confluent_producer):
    client = KafkaClient(config)
    client.admin_client.list_topics.return_value = MockTopics()

    assert not client.check_topic_exists("topic_2")


def test_get_topics(config, mock_admin_client, mock_confluent_producer):
    client = KafkaClient(config)

    class MockTopics:
        topics = {"topic_1": {"metadata": "about topic"}}

    mock_topics = MockTopics()
    client.admin_client.list_topics.return_value = mock_topics

    assert client.get_topics() == list(mock_topics.topics.keys())


def test_get_subjects(config, mock_admin_client, mock_schema_registry):
    client = KafkaClient(config)
    mock_schema_registry().get_subjects.return_value = ["orphaned_schema-value"]
    assert client.get_subjects() == ["orphaned_schema-value"]
