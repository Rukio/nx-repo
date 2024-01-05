# -*- coding: utf-8 -*-
from __future__ import annotations

import base64

from decouple import config


def get_kafka_config():
    """Default function to get the Config class to connect to Kafka"""
    config_class = Config(
        schema_registry_url=config("SCHEMA_REGISTRY_URL"),
        broker_servers=config("KAFKA_BROKERS"),
        ssl_key_pem=config("KAFKA_BROKER_KEY_PEM"),
        ssl_ca_pem=config("KAFKA_BROKER_CA_PEM"),
        ssl_certificate_pem=config("KAFKA_BROKER_CERTIFICATE_PEM"),
    )
    return config_class


class Config:
    """Class to manage Kafka configuration"""

    def __init__(
        self, schema_registry_url: str, broker_servers: str, ssl_key_pem: str, ssl_ca_pem: str, ssl_certificate_pem: str
    ) -> None:
        """Initiate config with environment variables

        Parameters
        ----------
        schema_registry_url
            URL with username and password to connect to schema registry
        broker_servers
            The URI for the main kafka service
        ssl_key_pem
            Base64 encoded string of the access key file contents to connect to Aiven kafka
        ssl_ca_pem
            Base64 encoded string of the CA certificate file contents to connect to Aiven kafka
        ssl_certificate_pem
            Base64 encoded string of the access certificate file contents to connect to Aiven kafka
        """
        self._config: dict[str, dict] = {
            "schema_registry": {"url": schema_registry_url},
            "broker": {
                "bootstrap.servers": broker_servers,
                "security.protocol": "SSL",
                "ssl.ca.pem": self.decode_64(ssl_ca_pem),
                "ssl.certificate.pem": self.decode_64(ssl_certificate_pem),
                "ssl.key.pem": self.decode_64(ssl_key_pem),
                "enable.idempotence": True,
            },
            "avro_serializer": {
                "auto.register.schemas": False,
                "use.latest.version": False,
                "normalize.schemas": True,
            },
        }

    @property
    def schema_registry(self) -> dict:
        return self._config["schema_registry"]

    @property
    def broker(self) -> dict:
        return self._config["broker"]

    @property
    def avro_serializer(self) -> dict:
        return self._config["avro_serializer"]

    @staticmethod
    def decode_64(encoded_string: str) -> str:
        """Decode a base64 encoded environment variable"""
        decoded_var = base64.b64decode(encoded_string.encode()).decode()

        return decoded_var
