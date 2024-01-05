# Event Streaming

Python package for working with Kafka.

## Kafka Client

### Topics

The topic must already be created before sending messages. The producers check that the topic exists and fails to
send messages if the topic does not exist. The producers has the `producer.create_topic()` method for this.

### Message Schema

The schema must already be created before trying to send the message. The schema is for the `value` of the
message and the naming strategy requires that the schema name be `{topic}-value` in order to match up with
the value of the message being sent.

## Producers

### Producer

The base producer class that wraps the `confluent_kafka.ConfluentProducer` class with additional logic for the
schema registry and topic management. This can be used as-is but does not automatically handle multi-threading.

### ThreadedProducer

This is a subclass of Producer that handles all message producing through separate threads. See the class docs
for details on what threads produced and how to use it.

## Env variables

The Producer need the following variables:

- SCHEMA_REGISTRY_URL
- KAFKA_BROKERS
- KAFKA_BROKER_CA_PEM
- KAKFA_BROKER_CERTIFICATE_PEM
- KAFKA_BROKER_KEY_PEM

These are simple strings that can be aquired from the Aiven Console
SCHEMA_REGISTRY_URL: Overview -> Connection Information -> Schema Registry -> Service URI
KAFKA_BROKERS: Overview -> Connection Information -> Apache Kafka -> Service URI

The next three variables are a bit more complicated since they need an entire key file contents. In order to avoid
formatting issues with the env variables we use a base64 encoded version of the values. Here is a simple function
to read a `file_path` and save a base 64 encoded representation of the key.

```python
import base64

def create_base64_env(file_path, dot_env_file, var_name):
    with open(file_path, "r") as f:
        env_var = f.read()

    with open(dot_env_file, "a") as f:
        f.write(f"{var_name}='{base64.b64encode(env_var.encode()).decode()}'\n")
```

The files to use in the `file_path` arg above can be found in the Aiven console as well:

KAFKA_BROKER_KEY_PEM: Overview -> Connection Information -> Apache Kafka -> Access Key
KAFKA_BROKER_CA_PEM: Overview -> Connection Information -> Apache Kafka -> CA Certificate
KAKFA_BROKER_CERTIFICATE_PEM: Overview -> Connection Information -> Apache Kafka -> Access Certificate

## Examples

How to run the examples:

- You'll need the environment variables configured as described above

  You can find the Aiven credentials in the Aiven UI for the service you want to connect to.

- WARNING: This script will create the topic and schema for the example. See the code for how that works

  Run the simple producer example by executing:

  ```bash
  env $(xargs < ~/.env) poetry run python examples/producer_example.py
  ```
