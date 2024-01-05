# -*- coding: utf-8 -*-
from __future__ import annotations

from dataclasses import dataclass


TEST_SCHEMA_STR = """
    {
        "namespace": "com.*company-data-covered*.test_events",
        "type": "record",
        "name": "EventRequest",
        "fields": [
            {"name": "random", "type": "string"}
        ]
    }
    """


@dataclass
class EventRequest:
    random: str


def delivery_callback(err, msg):
    if err:
        print("ERROR: Message failed delivery: {}".format(err))
    else:
        print("Produced event to topic {topic}: value = {value}".format(topic=msg.topic(), value=msg.value()))
