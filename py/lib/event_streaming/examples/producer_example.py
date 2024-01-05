# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

from confluent_kafka.schema_registry import Schema
from event_streaming import Producer
from event_streaming.config import get_kafka_config
from examples.utils import delivery_callback
from examples.utils import EventRequest
from examples.utils import TEST_SCHEMA_STR


if __name__ == "__main__":
    logger = logging.getLogger("test")
    config = get_kafka_config()
    producer = Producer(logger, config)
    topic = "test.dev.avro.test_single_event"

    # One time set up operations
    producer.create_topic(topic)
    schema_name = f"{topic}-value"
    schema = Schema(schema_str=TEST_SCHEMA_STR, schema_type="AVRO")
    producer._schema_registry_client.register_schema(schema_name, schema)

    # Produce event
    producer.produce(
        topic=topic,
        schema_str=TEST_SCHEMA_STR,
        value=vars(EventRequest("123")),
        on_delivery=delivery_callback,
    )

    # Wait for event to be delivered
    producer.flush()
