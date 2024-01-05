# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from threading import Thread

from beartype import beartype
from beartype.typing import Any
from beartype.typing import Callable
from confluent_kafka import Producer as ConfluentProducer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer
from confluent_kafka.serialization import MessageField
from confluent_kafka.serialization import SerializationContext
from event_streaming.client import KafkaClient
from event_streaming.client import TopicDoesNotExist

from .config import Config


@beartype
class Producer:
    """Produce messages to Kafka asynchronously.

    This is a wrapper for the confluent_kafka Producer. Configuration is provided by the imported Config class
    (decouple).
    """

    def __init__(self, logger: logging.Logger, config: Config) -> None:
        """Creates a Producer instance.

        This method configures the schema registry client and producer.  As a
        general recommendation, there should be only one producer instance per
        service.  Since the Producer is thread safe, and one instance can work
        with multiple topics, we can take advantage of its batching logic, and
        increase throughput.

        Parameters
        ----------
        logger
            Logger for the producer to use
        config
            A config instance created from the environment variables
        """
        self._config = config
        self._schema_registry_client = SchemaRegistryClient(self._config.schema_registry)
        self._producer = ConfluentProducer(self._config.broker)
        self.kafka_client = KafkaClient(self._config)
        self.logger = logger

    def produce(
        self,
        topic: str,
        schema_str: str,
        value: dict,
        avro_serializer: AvroSerializer | None = None,
        key: str | bytes | None = None,
        to_dict: Callable | None = None,
        on_delivery: Callable | None = None,
    ):
        """Check that a message is sendable by blocking the thread and then send the message async

        Follows the Confluent Producer interface closely.
        https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html#confluent_kafka.Producer.produce

        Parameters
        ----------
        topic
            The name of the Kafka topic.
        schema_str
            A JSON string representation of the Avro schema.
        value
            The object containing the message payload.
        avro_serializer
            An already configured AvroSerializer.  Useful when bulk producing messages. Its presence
            controls whether the internal producer will call flush() after producing a message.
        key
            Message key.
        to_dict
            Callable(object, SerializationContext) -> dict. Converts object to a dict.
        on_delivery
            Delivery report callback to call (from poll() or flush()) on successful or failed delivery.

        Raises
        ------
        BufferError
            If the internal producer message queue is full (queue.buffering.max.messages exceeded).
        KafkaException
            For other errors, see exception code.
        SerializerError
            Error during serialization.
        SchemaRegistryError
            If there was an error registering the schema with Schema Registry, or auto.register.schemas is false
            and the schema was not registered.

        Raises
        ------
        TopicDoesNotExist
            The topic does not exist kafka
        """
        if not self.kafka_client.check_topic_exists(topic):
            raise TopicDoesNotExist(
                f"Topic {topic} was not found. You must create the topic before sending a message to it."
            )

        if avro_serializer is None:
            avro_serializer = self.build_avro_serializer(schema_str, to_dict)

        value = avro_serializer(value, SerializationContext(topic, MessageField.VALUE))

        self._producer.produce(
            topic=topic,
            key=key,
            value=value,
            on_delivery=on_delivery,
        )

    def build_avro_serializer(self, schema_str: str, to_dict: Callable = None) -> AvroSerializer:
        """Convenience method to build a configured AvroSerializer.

        Configures the Avro serializer and sets the schema registry client so that
        produced messages contain the schema version id.

        Parameters
        ----------
        schema_str
            The JSON string representation of the Avro schema.
        to_dict
            Prior to serialization, all values must first be converted to a dict instance.
            This may handle manually prior to calling Producer.produce() or by registering
            a to_dict callable with AvroSerializer.

        Returns
        -------
        avro_serializer
            AvroSerializer instance.
        """
        avro_serializer = AvroSerializer(
            schema_registry_client=self._schema_registry_client,
            schema_str=schema_str,
            to_dict=to_dict,
            conf=self._config.avro_serializer,
        )
        return avro_serializer

    def poll(self, timeout: int | float | None = None) -> int:
        """Calls confluent_kafka.Producer.poll()

        Polls the producer for events and calls the corresponding callbacks (if registered).
        Currently only `on_delivery` which can be set on the produce() call.

        Parameters
        ----------
        timeout
            Maximum time to block waiting for events. (Seconds)

        Returns
        -------
        num_events
            Number of events processed.
        """
        return self._producer.poll(timeout)

    def flush(self, timeout: int | float | None = None) -> int:
        """Calls confluent_kafka.Producer.flush()

        Wait for all messages in the Producer queue to be delivered. This is a
        convenience method that calls poll() until len() is zero or the optional
        timeout elapses.
        NOTE: This makes the request synchronous, it should only be called at the
        end of bulk producing. Never call this in an aio server!

        Parameters
        ----------
        timeout
            Maximum time to block. (Seconds)

        Returns
        -------
        num_messages
            Numbers of messages still in queue.
        """
        return self._producer.flush(timeout)


@beartype
class SendTask:
    """Class to hold a kafka message send operation to be run in a different thread"""

    def __init__(self, send_callable, args: list = None, kwargs: dict = None):
        """Instantiate class to hold a send task to be sent later

        Parameters
        ----------
        send_callable
            The Callable object that will send the Kafka message
        args
            A list of positional args to pass into send_callable
        kwargs
            A dict of keyword args to pass into send_callable
        """
        self.send_callable = send_callable
        self.args = args or []
        self.kwargs = kwargs or {}
        self.result = None

    def send(self) -> Any:
        """Send the message via the attribute `send_callable`"""
        result = self.send_callable(*self.args, **self.kwargs)
        self.result = result

        return result


@beartype
class ThreadedProducer(Producer):
    """A threaded producer that can produce out-of-band Kafka messages

    Heavily based on https://www.confluent.io/blog/kafka-python-asyncio-integration/
    """

    def __init__(self, logger: logging.Logger, config: Config):
        """Instantiate the threaded producer, start a polling thread and a start a sending thread

        The polling thread is used to call the producer poll method in order to call the callback methods on sent
        messages.

        The sending thread takes SendTasks that have been in the send_tasks attribute and runs the produce call
        to check the topics, schema and send the message to the polling thread
        """
        super().__init__(logger, config)
        self._cancelled = False
        self._poll_thread = Thread(target=self._poll_loop, daemon=True)
        self._poll_thread.start()
        self.send_tasks: list = []
        self._send_thread = Thread(target=self._send_loop, daemon=True)
        self._send_thread.start()

    def _poll_loop(self):
        """Target function for polling the producer for callbacks"""
        while not self._cancelled:
            self.poll(0.1)

    def _send_loop(self):
        """Target function for calling the producer's produce method.

        Checks the validity of the message and sends the message to Kafka async"""
        while not self._cancelled:
            if self.send_tasks:
                t = self.send_tasks.pop(0)
                try:
                    t.send()
                except TopicDoesNotExist as e:
                    self.logger.error(e)

    def close(self, timeout: int | float = 1, force: bool = False):
        """Cancel and join the running threads

        Parameters
        ----------
        timeout
            How long to wait for the threads to finish
        force
            Boolean to force the threads to close. WARNING: This may cause messages to not be sent
        """
        if not force:
            while self.send_tasks:
                continue

        self._cancelled = True
        self._send_thread.join(timeout)
        self._poll_thread.join(timeout)

    def produce(
        self,
        topic: str,
        schema_str: str,
        value: object,
        avro_serializer: AvroSerializer = None,
        key: str | bytes | None = None,
        to_dict: Callable | None = None,
        on_delivery: Callable | None = None,
    ):
        """Prepare a SendTask and move it to the send_thread to send the message outside the main thread

        Parameters
        ----------
        topic
            The name of the Kafka topic.
        schema_str
            A JSON string representation of the Avro schema.
        value
            The object containing the message payload.
        avro_serializer
            An already configured AvroSerializer.  Useful when bulk producing messages. Its presence
            controls whether the internal producer will call flush() after producing a message.
        key
            Message key.
        to_dict
            Callable(object, SerializationContext) -> dict. Converts object to a dict.
        on_delivery
            An optional callback function to run after the message is sent. Should have a function signature
            `def ack(err, msg)`
        """
        send_task = SendTask(
            super().produce, args=[topic, schema_str, value, avro_serializer, key, to_dict, on_delivery]
        )
        self.send_tasks.append(send_task)
        return send_task
