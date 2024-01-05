# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from functools import cached_property
from pathlib import Path

from beartype import beartype
from confluent_kafka.admin import AdminClient
from confluent_kafka.schema_registry import SchemaRegistryClient
from event_streaming.config import Config

logger = logging.getLogger("event_streaming.client")


class TopicDoesNotExist(Exception):
    """The topic doesn't exist in the kafka service"""


class OrphanedSchemaError(Exception):
    """Schema exists without a topic"""


@beartype
class KafkaClient:
    """Client to work with Kafka"""

    def __init__(self, config: Config):
        self.config = config

    @cached_property
    def schema_registry_client(self) -> SchemaRegistryClient:
        """Client to work with the schema registry from the config"""
        return SchemaRegistryClient(self.config.schema_registry)

    @cached_property
    def admin_client(self) -> AdminClient:
        """Client to work with the Kafka service from the config"""
        return AdminClient(self.config.broker)

    def get_topics(self) -> list:
        """List all topics based on config.
        Returns
        -------
        topics
            List of topics in kafka
        """
        topics = list(self.admin_client.list_topics().topics.keys())
        return topics

    def check_topic_exists(self, topic: str) -> bool:
        """Check if topic exists.

        Parameters
        ----------
        topic
            The string of the topic to check
        """
        topics = self.get_topics()
        return topic in topics

    @staticmethod
    def get_topic_and_subject_from_file_name(file_name: str) -> tuple[str, str]:
        """Get topic name and subject from schema file name

        Example: some_topic-value.avsc => topic: "some_topic" schema subject: "some_topic-value"

        Parameters
        ----------
        file_name
            The file name with file extension Example: some_topic-value.avsc

        Returns
        -------
        topic, subject_name
            Tuple of topic name and schema subject name
        """
        path = Path(file_name)
        subject_name = path.stem
        fn_list = subject_name.split("-")
        fn_list.pop()  # Remove the message field for the schema
        topic = "-".join(fn_list)

        return topic, subject_name

    def get_subjects(self) -> list[str]:
        """Get a list of schema subjects"""
        return self.schema_registry_client.get_subjects()
