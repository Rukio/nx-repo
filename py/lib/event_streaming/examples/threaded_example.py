# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

from confluent_kafka.schema_registry import Schema
from event_streaming import ThreadedProducer
from event_streaming.config import get_kafka_config
from examples.utils import delivery_callback
from examples.utils import EventRequest
from examples.utils import TEST_SCHEMA_STR


if __name__ == "__main__":
    logger = logging.getLogger("test")
    config = get_kafka_config()
    threaded_producer = ThreadedProducer(logger, config)
    topic = "test.dev.avro.test_threaded_event"

    # One time set up operations
    threaded_producer.create_topic(topic)
    schema_name = f"{topic}-value"
    schema = Schema(schema_str=TEST_SCHEMA_STR, schema_type="AVRO")
    threaded_producer._schema_registry_client.register_schema(schema_name, schema)

    # Send events to separate threads
    threaded_producer.produce(
        topic=topic,
        schema_str=TEST_SCHEMA_STR,
        value=vars(EventRequest("123")),
        on_delivery=delivery_callback,
    )

    # Events will be sent in separate threads. Close the threads
    threaded_producer.close()
