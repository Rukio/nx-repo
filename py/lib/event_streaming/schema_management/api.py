# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import logging
from pathlib import Path
from urllib.parse import urljoin

import requests
from beartype import beartype
from event_streaming.client import TopicDoesNotExist

logger = logging.getLogger(__name__)

API_V1_GET_TOPICS_URL = "/v1/project/{project_name}/service/{service_name}/topic"
API_V1_GET_SUBJECTS_URL = "/v1/project/{project_name}/service/{service_name}/kafka/schema/subjects"
API_V1_GET_COMPATIBILITY = "/v1/project/{project_name}/service/{service_name}/kafka/schema/config/{subject_name}"
API_V1_POST_TEST_COMPATIBILITY_URL = (
    "v1/project/{project_name}/service/{service_name}/kafka/schema/compatibility/subjects"
    "/{subject_name}/versions/{version}"
)
API_V1_POST_REGISTER_URL = (
    "v1/project/{project_name}/service/{service_name}/kafka/schema/subjects/{subject_name}/versions"
)


class KafkaValidationError(Exception):
    """An error occurred during Kafka validation"""


class InvalidSubjectNameError(KafkaValidationError):
    """The subject name is invalid"""


class InvalidSchemaCompatibilityError(KafkaValidationError):
    """The schema failed a compatibility check"""


class InvalidSchemaTypeError(KafkaValidationError):
    """The schema type is invalid"""


@beartype
class AivenAPIClient:
    """Client to work with Kafka through the Aiven API"""

    _valid_schema_types = ["AVRO", "JSON", "PROTOBUF"]

    def __init__(
        self,
        token: str | None = None,
        project_name: str | None = None,
        service_name: str | None = None,
        base_url: str = "https://api.aiven.io",
    ):
        self.base_url = base_url
        self.token = token
        self.project_name = project_name
        self.service_name = service_name

    def _get(self, url: str):
        """Get request to Aiven API with bearer token in header"""
        full_url = urljoin(self.base_url, url)
        r = requests.get(full_url, headers={"authorization": f"aivenv1 {self.token}"})
        return r

    def _post(self, url: str, json: dict):
        """Post request to Aiven API with bearer token in header"""
        full_url = urljoin(self.base_url, url)
        r = requests.post(full_url, headers={"authorization": f"aivenv1 {self.token}"}, json=json)
        return r

    def get_topics(self, project_name: str | None = None, service_name: str | None = None) -> list:
        """List all Kafka topics in the project and service provided.

        Uses the Aiven API to get a list of topics from Kafka.

        Parameters
        ----------
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to

        Returns
        -------
        topics
            List of topics in kafka
        """
        project_name = project_name or self.project_name
        service_name = service_name or self.service_name
        r = self._get(API_V1_GET_TOPICS_URL.format(project_name=project_name, service_name=service_name))
        r.raise_for_status()

        return [t["topic_name"] for t in r.json()["topics"]]

    def get_subjects(self, project_name: str | None = None, service_name: str | None = None) -> list:
        """List all Kafka subjects in the project and service provided.

        Uses the Aiven API to get a list of subjects from Kafka.

        Parameters
        ----------
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to

        Returns
        -------
        topics
            List of subjects in kafka
        """
        project_name = project_name or self.project_name
        service_name = service_name or self.service_name
        r = self._get(API_V1_GET_SUBJECTS_URL.format(project_name=project_name, service_name=service_name))
        r.raise_for_status()

        return r.json()["subjects"]

    def test_compatibility(
        self,
        subject_name: str,
        schema: dict,
        version: int | str = "latest",
        schema_type: str = "AVRO",
        project_name: str | None = None,
        service_name: str | None = None,
    ) -> bool:
        """Test that a given schema is compatible with the existing schema

        Uses the Aiven API to check that a new schema is compatible with the existing
        schema according to the schema compatibility set in the schema registry

        Parameters
        ----------
        subject_name
            The name of the schema subject
        schema
            A dictionary of the schema object. This should correspond with the schema_type which
            defaults to AVRO
        version
            The schema version to check against. Defaults to "latest"
        schema_type
            The type of the schema to check. AVRO, PROTOBUF or JSON. Defaults to AVRO
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to

        Returns
        -------
        bool
            True if the schema is compatible with the specified version
        """
        self.check_schema_type(schema_type)
        project_name = project_name or self.project_name
        service_name = service_name or self.service_name

        url = API_V1_POST_TEST_COMPATIBILITY_URL.format(
            project_name=project_name, service_name=service_name, subject_name=subject_name, version=version
        )
        r = self._post(url, json={"schema": json.dumps(schema), "schemaType": schema_type})
        r.raise_for_status()

        return r.json()["is_compatible"]

    def get_compatibility(
        self, subject_name: str, project_name: str | None = None, service_name: str | None = None
    ) -> str:
        """Get the compatibility level of a given schema

        Uses the Aiven API to look up the compatibility level that is set for a given schema

        Parameters
        ----------
        subject_name
            The name of the schema subject
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to

        Returns
        -------
        compatiblityLevel
            The compatibility level. Normally "BACKWARDS"
        """
        project_name = project_name or self.project_name
        service_name = service_name or self.service_name
        r = self._get(
            API_V1_GET_COMPATIBILITY.format(
                project_name=project_name, service_name=service_name, subject_name=subject_name
            )
        )
        r.raise_for_status()

        return r.json()["compatibilityLevel"]

    def check_topic_exists(self, topic: str, project_name: str | None = None, service_name: str | None = None) -> bool:
        """Check if topic exists.

        Parameters
        ----------
        topic
            The string of the topic to check
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to
        """
        topics = self.get_topics(project_name, service_name)
        return topic in topics

    def check_subject_exists(
        self, subject: str, project_name: str | None = None, service_name: str | None = None
    ) -> bool:
        """Check if subject exists.

        Parameters
        ----------
        subject
            The string of the subject to check
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to
        """
        subjects = self.get_subjects(project_name, service_name)
        return subject in subjects

    def check_schema_type(self, schema_type: str):
        """Check if schema_type is valid.

        Parameters
        ----------
        schema_type
            The schema type to check

        Raises
        ------
        InvalidSchemaTypeError
            The schema type is not valid
        """
        if schema_type not in self._valid_schema_types:
            raise InvalidSchemaTypeError(
                f"The schema type '{schema_type}' is not in the list of valid schema types: {self._valid_schema_types}"
            )

    @staticmethod
    def _validate_subject_name(subject_name: str):
        """Ensures that the subject name matches the naming conventions used for topic/schema matching"""
        if not (subject_name.endswith("-value") or subject_name.endswith("-key")):
            raise InvalidSubjectNameError(
                f"The subject name {subject_name} does not match the TopicNameStrategy. The subject "
                "should be {topic name}-value or {topic name}-key."
            )

    @staticmethod
    def parse_topic_from_subject(subject: str) -> str:
        """Get topic name and subject from schema file name or schema subject name

        Example: analytics.avro.some_topic-value =>
                     topic: "analytics.avro.some_topic"
                     schema subject: "analytics.avro.some_topic-value"

        Parameters
        ----------
        subject
            The subject name to parse

        Returns
        -------
        topic_name
            The name of the topic derived from the subject using the TopicNamingStrategy
        """
        fn_list = subject.split("-")
        fn_list.pop()  # Remove the message field from the name to get the topic
        topic = "-".join(fn_list)

        return topic

    def parse_topic_and_subject_names_from_file(self, file_path: str) -> tuple[str, str]:
        """Get topic name and subject from schema file path

        Example: events/analytics/avro/some_topic-value.avsc =>
                    topic: "analytics.avro.some_topic"
                    schema subject: "analytics.avro.some_topic-value"

        Parameters
        ----------
        file_path
            The file path to parse

        Returns
        -------
        topic, subject_name
            Tuple of topic name and schema subject name
        """
        path = Path(file_path)
        events_root_index = path.parts.index("events") + 1
        parts = list(path.parts[events_root_index:])
        parts[-1] = path.stem  # Remove file extension
        subject_name = ".".join(parts)
        topic = self.parse_topic_from_subject(subject_name)

        return topic, subject_name

    def validate_schema_compatibility(
        self,
        subject_name: str,
        schema: dict,
        project_name: str | None = None,
        service_name: str | None = None,
        version: int | str = "latest",
        schema_type: str = "AVRO",
    ) -> None:
        """Test the compatibility of a candidate schema for a given subject and version

        The topic must be created before schema compatibility can be checked.

        Parameters
        ----------
        subject_name
            Subject name the schema is registered under
        schema
            Dictionary representation of the schema
        version
            Version number, or the string "latest". Defaults to "latest".
        schema_type
            The type of schema. AVRO, PROTOBUF or JSON. Defaults to AVRO
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to

        Raises
        ------
        InvalidSchemaCompatibilityError
            Error if the schema was not compatible
        TopicDoesNotExist
            The topic does not exist kafka
        InvalidSubjectNameError
            The subject name is invalid

        See Also:
            POST Test Compatibility API Reference
            https://api.aiven.io/doc/#tag/Service:_Kafka/operation/ServiceSchemaRegistryCompatibility
        """
        # Validate valid subject and topic is created
        self._validate_subject_name(subject_name)
        topic = self.parse_topic_from_subject(subject_name)
        if not self.check_topic_exists(topic, project_name, service_name):
            raise TopicDoesNotExist(f"Topic '{topic}' must exist before the associated subject can be validated")

        if not self.check_subject_exists(subject_name, project_name, service_name):
            logger.info(f"Subject '{subject_name}' does not exist. Skipping validation")
        else:
            if self.test_compatibility(subject_name, schema, version, schema_type, project_name, service_name):
                logger.info(f"Schema '{subject_name}' evolution validated")
            else:
                compatibility = self.get_compatibility(subject_name)
                raise InvalidSchemaCompatibilityError(
                    f"The schema {subject_name} is not compatible with the version '{version}' with schema "
                    f"compatibility {compatibility}."
                )

    def validate_schema_compatibility_from_file(self, schema_file_path: str, project_name, service_name, **kwargs):
        """Test the compatibility of a candidate schema for a given subject and version from a file

        The topic must be created before schema compatibility can be checked.

        Parameters
        ----------
        schema_file_path
            The path to the schema file
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to
        kwargs
            Extra arguments to pass to validate_schema_compatibility()

        Returns
        -------
        bool
            True if the schema is compatible with the specified version

        Raises
        ------
        InvalidSchemaCompatibilityError
            Error if the schema was not compatible
        TopicDoesNotExistError
            The topic doesn't exist. Topics must be created before creating the schema

        See Also:
            POST Test Compatibility API Reference
            https://api.aiven.io/doc/#tag/Service:_Kafka/operation/ServiceSchemaRegistryCompatibility
        """

        path = Path(schema_file_path)
        _, subject_name = self.parse_topic_and_subject_names_from_file(schema_file_path)

        with path.open("r") as f:
            schema_dict = json.load(f)

        self.validate_schema_compatibility(
            subject_name, schema_dict, project_name=project_name, service_name=service_name, **kwargs
        )

    def register_schema(
        self,
        subject_name: str,
        schema: dict,
        project_name: str | None = None,
        service_name: str | None = None,
        schema_type: str = "AVRO",
    ):
        """Register schema in schema registry

        Parameters
        ----------
        subject_name
            Subject name the schema is registered under
        schema
            Dictionary representation of the schema
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to
        schema_type
            The type of schema. AVRO, PROTOBUF or JSON. Defaults to AVRO

        Raises
        ------
        TopicDoesNotExist
            The topic does not exist kafka

        See Also:
            POST Register a new Schema in Schema Registry
            https://api.aiven.io/doc/#tag/Service:_Kafka/operation/ServiceSchemaRegistrySubjectVersionPost
        """
        # Validate valid subject and topic is created
        self._validate_subject_name(subject_name)
        topic = self.parse_topic_from_subject(subject_name)
        if not self.check_topic_exists(topic, project_name, service_name):
            raise TopicDoesNotExist(f"Topic '{topic}' must exist before the associated subject can be registered")

        self.check_schema_type(schema_type)
        project_name = project_name or self.project_name
        service_name = service_name or self.service_name

        url = API_V1_POST_REGISTER_URL.format(
            project_name=project_name, service_name=service_name, subject_name=subject_name
        )
        r = self._post(url, json={"schema": json.dumps(schema), "schemaType": schema_type})
        r.raise_for_status()

    def register_schema_from_file(self, schema_file_path: str, project_name: str, service_name: str, **kwargs):
        """Register a schema subject with the schema registry froma file

        Parameters
        ----------
        schema_file_path
            The path to the schema file
        project_name
            The name of the Aiven project to connect to
        service_name
            The name of the Kafka service in the project to connect to
        kwargs
            Extra arguments to pass to register_schema()

        See Also:
            POST Register a new Schema in Schema Registry
            https://api.aiven.io/doc/#tag/Service:_Kafka/operation/ServiceSchemaRegistrySubjectVersionPost
        """

        path = Path(schema_file_path)
        _, subject_name = self.parse_topic_and_subject_names_from_file(schema_file_path)

        with path.open("r") as f:
            schema_dict = json.load(f)

        self.register_schema(subject_name, schema_dict, project_name=project_name, service_name=service_name, **kwargs)
