# -*- coding: utf-8 -*-
from __future__ import annotations

from typing import List
from typing import Optional

from datadog import DogStatsd
from datadog import initialize


class DataDogMetrics(DogStatsd):
    def __init__(self, statsd_host: str, statsd_port: int, application_name: str) -> None:
        self.statsd_host = statsd_host
        self.statsd_port = statsd_port
        self.application_name = application_name
        self.options = {
            "statsd_host": self.statsd_host,
            "statsd_port": self.statsd_port,
        }
        initialize(**self.options)
        super(DataDogMetrics, self).__init__(self.statsd_host, self.statsd_port)

    def event(self, title: str, message: str, **kwargs: dict) -> None:
        """
        Send an event message to Datadog.
        See https://docs.datadoghq.com/events/ for more info.
        """
        super(DataDogMetrics, self).event(title=title, message=message, **kwargs)

    def increment(self, metric: str, value: int = 1, tags: Optional[List[str]] = None, **kwargs) -> None:
        """
        Increment a counter, optionally setting a value, tags and a sample rate.

        >>> statsd.increment("page.views")
        >>> statsd.increment("files.transferred", 124)
        """
        metric = f"{self.application_name}.{metric}"
        super(DataDogMetrics, self).increment(metric=metric, value=value, tags=tags, **kwargs)

    def create_child_client(self, namespace: str) -> DataDogMetrics:
        """
        Creates a SEPARATE statsd client that prefixes the existing namespace onto the provided namespace

        >>> parent_client = DataDogMetrics(statsd_host: "localhost:1234", statsd_port: 123, application_name: "parent")
        ^ namespaced under "parent"
        >>> child_client = parent_client.create_child_client(namespace: "child")
        child_client namespace == "parent.child"
        """
        return DataDogMetrics(
            statsd_host=self.statsd_host,
            statsd_port=self.statsd_port,
            application_name=f"{self.application_name}.{namespace}",
        )
