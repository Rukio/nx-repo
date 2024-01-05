# -*- coding: utf-8 -*-
from __future__ import annotations

import base64

from event_streaming.config import Config
from event_streaming.config import get_kafka_config


def test_get_config(mock_env_vars):
    config = get_kafka_config()

    expected_config = {
        "schema_registry": {"url": "https://user:pass@test.aivencloud.com:12345"},
        "broker": {
            "bootstrap.servers": "test.aivencloud.com:12346",
            "security.protocol": "SSL",
            "ssl.ca.pem": "BASE64ENCODEDSECRET",
            "ssl.certificate.pem": "BASE64ENCODEDSECRET",
            "ssl.key.pem": "BASE64ENCODEDSECRET",
            "enable.idempotence": True,
        },
        "avro_serializer": {"auto.register.schemas": False, "use.latest.version": False, "normalize.schemas": True},
    }

    assert config._config == expected_config


def test_config_base_64():
    test_string = "test"
    encoded_string = base64.b64encode(test_string.encode()).decode()

    assert test_string == Config.decode_64(encoded_string)
