# Events

This directory is for files that define schemas for event streaming services.

## Kafka

Currently, this directory is set up specifically for Kafka analytic events. Any files in this directory will be
validated against development and production Kafka services.

### Topic Naming Conventions

The file name is important. It identifies the name of the schema subject that will be used in the schema registry.
For example, if a schema file path is `analytics/avro/some_topic-value.avsc` then the schema subject would be
`analytics.avro.some_topic-value`. This maintains the namespaces by directory with the final namespace being the
unique identifier for the topic/schema.

#### Analytic Events/Redshift

Currently, only the `analytics.avro` namespace is being consumed by the S3Sink that feeds into Redshift. Therefore,
if I want my new event to be queryable from Redshift then my file path would need to be
`events/analytics/avro/some_topic-value.avsc`.

### Validity Rules

In order for a schema file to be valid it must pass the following rules:

1. The topic associated with the schema file must already be created in development and production Kafka services.

   Topics are managed via terraform and all schema subjects should be tied to a specific topic that is already
   created. The schemas are tied to topic using the name of the file and the TopicNamingStrategy defined
   [here.](https://github.com/*company-data-covered*/services/pull/6588).

2. The schema subject name must map to `key` or `value`.

   Schema subjects refer to a field within the Kafka message. The only fields in a Kafka message that can have a
   schema are `key` or `value` so the schema file must match one of these using the TopicNamingStrategy discussed
   above.

   Valid schema files:

   - some_topic-value.avsc
   - some_topic-key.json

   Invalid schema files:

   - some_topic.avsc
   - some_topic_key.json

3. The schema must be brand new or compatible with the latest version of the existing schema.

   Schema evolution compatibility is set on the schema subject itself. The default and most likely scenario is the
   compatibility is set to BACKWARDS and therefore any schema changes should be backwards compatible.
