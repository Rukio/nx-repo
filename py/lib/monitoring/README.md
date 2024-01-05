# Monitoring

## Usage

```python
from decouple import config
from monitoring.metrics import DataDogMetrics


APPLICATION_NAME = "your_app_or_lib_name_in_snake_case"


try:
    statsd_host, statsd_port = config("DD_DOGSTATSD_URL", default="").split(":")
except ValueError:
    statsd_host = "localhost"
    statsd_port = 8125


ddmetrics = DataDogMetrics(statsd_host, statsd_port, APPLICATION_NAME)
ddmetrics.increment("a_metric_you_want")
```

This is just a wrapper that help us initialize with the right environment variables, you have access to all the DataDog library, for more information read: https://github.com/DataDog/datadogpy.
