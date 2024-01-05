# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import pytest
from beartype.roar import BeartypeCallHintParamViolation
from event_streaming.producer import Producer
from event_streaming.producer import ThreadedProducer
from event_streaming.producer import TopicDoesNotExist
from tests.conftest import MOCK_BIG_ENV_VAR
from tests.conftest import MOCK_ENV_VARIABLES
from tests.conftest import MOCK_SCHEMA


@pytest.mark.parametrize("producerclass", [Producer, ThreadedProducer])
def test_producer_init(config, mock_admin_client, mock_confluent_producer, producerclass):
    logger = logging.getLogger()
    producer = producerclass(logger, config)
    broker = {
        "bootstrap.servers": MOCK_ENV_VARIABLES["KAFKA_BROKERS"],
        "security.protocol": "SSL",
        "ssl.ca.pem": MOCK_BIG_ENV_VAR,
        "ssl.certificate.pem": MOCK_BIG_ENV_VAR,
        "ssl.key.pem": MOCK_BIG_ENV_VAR,
        "enable.idempotence": True,
    }
    mock_confluent_producer.assert_called_with(broker)
    assert mock_confluent_producer() == producer._producer
    assert mock_admin_client() == producer.kafka_client.admin_client
    assert producer._schema_registry_client
    assert producer._schema_registry_client._rest_client.base_url == MOCK_ENV_VARIABLES["SCHEMA_REGISTRY_URL"]
    assert producer._config == config
    if hasattr(producer, "close"):
        producer.close()


@pytest.mark.parametrize("producerclass", [Producer, ThreadedProducer])
@pytest.mark.parametrize("config,exception", [(False, TypeError), (None, BeartypeCallHintParamViolation)])
def test_producer_failed_init(mock_admin_client, mock_confluent_producer, producerclass, config, exception):
    logger = logging.getLogger()
    with pytest.raises(exception):
        if config is False:
            producerclass(logger)
        else:
            producerclass(logger, config)


@pytest.mark.parametrize("producerclass", [Producer])
def test_producer_topic_doesnt_exist(config, mock_admin_client, mock_confluent_producer, producerclass):
    logger = logging.getLogger()
    producer = producerclass(logger, config)
    with pytest.raises(TopicDoesNotExist):
        producer.produce("topic_does_not_exist", MOCK_SCHEMA, {"mock_field": "mock_value"})


@pytest.mark.parametrize("producerclass", [ThreadedProducer])
def test_threaded_producer_topic_doesnt_exist(
    config, mock_admin_client, mock_confluent_producer, producerclass, caplog
):
    caplog.set_level(logging.INFO)
    logger = logging.getLogger()
    producer = producerclass(logger, config)
    producer.produce("topic_does_not_exist", MOCK_SCHEMA, {"mock_field": "mock_value"})
    producer.close()

    error_logs = [r for r in caplog.records if r.levelno == logging.ERROR]
    assert len(error_logs) == 1
    assert (
        error_logs[0].getMessage()
        == "Topic topic_does_not_exist was not found. You must create the topic before sending a message to it."
    )


@pytest.mark.parametrize("producerclass", [Producer])
@pytest.mark.parametrize("timeout", [False, None, 1, 0.5, -1])
def test_poll(config, mock_admin_client, mock_confluent_producer, producerclass, timeout):
    logger = logging.getLogger()
    producer = producerclass(logger, config)
    if timeout is not False:
        producer.poll(timeout)
    else:
        producer.poll()

    producer._producer.poll.assert_called_once()


@pytest.mark.parametrize("producerclass", [ThreadedProducer])
def test_threaded_poll(config, mock_admin_client, mock_confluent_producer, producerclass):
    logger = logging.getLogger()
    producer = producerclass(logger, config)
    producer.close()

    producer._producer.poll.assert_called()


@pytest.mark.parametrize("producerclass", [Producer])
@pytest.mark.parametrize("timeout", [False, None, 1, 0.5, -1])
def test_flush(config, mock_admin_client, mock_confluent_producer, producerclass, timeout):
    logger = logging.getLogger()
    producer = producerclass(logger, config)
    if timeout is not False:
        producer.flush(timeout)
    else:
        producer.flush()

    producer._producer.flush.assert_called_once()


@pytest.mark.parametrize("producerclass", [ThreadedProducer])
def test_threaded_no_flush(config, mock_admin_client, mock_confluent_producer, producerclass):
    logger = logging.getLogger()
    producer = producerclass(logger, config)
    producer.close()

    producer._producer.flush.assert_not_called()
