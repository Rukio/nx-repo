# Feature Store

A set of wrappers for [SageMaker Feature Store](https://sagemaker.readthedocs.io/en/stable/amazon_sagemaker_featurestore.html).

The Feature Store is a managed service that simplifies the process of storing, managing, and serving features for machine learning models. It provides a central repository for feature data, enabling easy access to features and ensuring that they are always up-to-date and accurate.

## Basic Concepts

### Feature

A feature is an individual measurable property or characteristic of an entity, such as a user, product, or sensor reading. In the context of machine learning, features are used as input variables for models to make predictions or to discover patterns in the data. Examples of features include age, gender, temperature, or product ratings.

Features can be numerical, categorical, or textual in nature, and they often undergo preprocessing, transformation, or engineering steps to make them suitable for machine learning models.

### Feature Group

A feature group is a collection of features that belong to the same entity or share some common context. It serves as a central repository for organizing and managing features in a structured manner. A feature group contains feature definitions that describe the name and data type of each feature.

Feature groups in AWS Feature Store support both online and offline storage. The online storage enables low-latency access to feature data for real-time inference, while the offline storage is designed for training machine learning models or batch processing tasks.

In addition to feature definitions, a feature group has a record identifier and an event time attribute. The record identifier is a unique key that identifies each record in the feature group, while the event time attribute represents the point in time when a new event occurs that corresponds to the creation or update of a record in the feature group.

### Record

A record in a feature group is a collection of feature values associated with a specific instance of an entity. It can be thought of as a row in a table or a data point in a dataset. Each record has a unique record identifier and an event time attribute, as mentioned earlier.

### Ingestion

Ingestion is the process of adding new records or updating existing records in a feature group. Ingestion can be performed in real-time or as a batch process, depending on the use case and requirements.

### Query

Querying is the process of retrieving feature data from a feature group for a specific record or a set of records. Feature data can be queried for online or offline use cases. For online use cases, low-latency access to feature data is provided for real-time inference, while for offline use cases, feature data is available for training machine learning models or batch processing tasks.

### Feature Types

In AWS Feature Store, there are three primary feature types: Integral, String, and Fractional. Here is an explanation of each type along with the additional information about storing date, datetime, and time objects:

#### 1. Integral:

The Integral feature type is used to store integer values. These can be whole numbers, either positive or negative, without any decimal point. It is a suitable type for representing counts, ranks, or other discrete numerical values. You can also use Integral to store UNIX timestamps, which are integer values representing the number of seconds elapsed since January 1, 1970, 00:00:00 UTC. This is useful when you want to store date, datetime, or time objects as integers.

#### 2. String:

The String feature type is used to store text data or categorical variables. It can store any sequence of characters, making it suitable for names, labels, or other textual information. When it comes to date, datetime, or time objects, you can store them as [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) strings, which are human-readable and standardized string formats for representing date and time information (e.g., "2023-04-09", "12:34:56", or "2023-04-09T12:34:56Z").

#### 3. Fractional:

The Fractional feature type is used to store floating-point numbers or real numbers with decimal points. It is suitable for representing continuous numerical values, such as measurements, probabilities, or percentages. However, it is not the ideal type for storing date, datetime, or time objects, as they require a more specific representation.

When defining feature definitions for your data, you can choose the appropriate feature type based on the data you want to store. For example, if you want to store a datetime object as a ([UNIX](https://kb.narrative.io/what-is-unix-time) timestamp, you would use `FeatureTypeEnum.INTEGRAL`:

```python
from sagemaker.feature_store.feature_group import FeatureDefinition
from sagemaker.feature_store.feature_definition import FeatureTypeEnum

feature_definitions = [
    # ...
    FeatureDefinition(feature_name='event_time_unix', feature_type=FeatureTypeEnum.INTEGRAL),
    # ...
]
```

Or if you want to store a datetime object as an ISO 8601 string, you would use `FeatureTypeEnum.STRING`:

```python
feature_definitions = [
    # ...
    FeatureDefinition(feature_name='event_time_iso', feature_type=FeatureTypeEnum.STRING),
    # ...
]
```

Keep in mind that you need to convert your date, datetime, and time objects to the chosen format (UNIX timestamp or ISO 8601 string) before ingesting them into the Feature Store.

### Required arguments for Feature Store:

- `sagemaker_session`: An instance of the Session class from the sagemaker library, which is used to manage interactions with the Amazon SageMaker APIs. This includes creating, updating, and querying feature groups, as well as other SageMaker services like training and deploying machine learning models.
- `feature_group_name`: A string that represents the name of the feature group in the SageMaker Feature Store. A feature group is a container for features and metadata related to a specific dataset, and it's important to choose a unique and descriptive name for each feature group you create.
- `record_identifier_name`: A string that represents the name of the record identifier column in the dataset. This is usually the primary key of your data, and it uniquely identifies each record in the feature group. The record identifier is used to retrieve and update individual records in the feature group.
- `event_time_feature_name`: A string that represents the name of the event time column in the dataset. The event time is a point in time (either in ([UNIX](https://kb.narrative.io/what-is-unix-time) or [ISO8601](https://www.iso.org/iso-8601-date-and-time-format.html) format) when a new event occurs that corresponds to the creation or update of a Record in a FeatureGroup. This timestamp allows SageMaker Feature Store to keep track of the latest version of each record and enables time-based queries on the data.
- `role`: A string that represents the Amazon Resource Name (ARN) of the AWS Identity and Access Management (IAM) role for the SageMaker Feature Store. This role defines the permissions that the SageMaker Feature Store has when accessing and managing the feature data. It should include permissions to access the required AWS services, such as Amazon S3 for storage and AWS Glue for data cataloging.

## Usage

You can ingest, query, and manage features in the Feature Store using the provided wrappers.

### Create Feature Groups

1. On a console, import the following libraries:

```python
from feature_store.ingest import IngestFeatureStore
from sagemaker.session import Session
from sagemaker.feature_store.feature_group import FeatureDefinition
from sagemaker.feature_store.feature_definition import FeatureTypeEnum
import pandas as pd
import time
```

2. Set the following variables:

```python
sagemaker_session = Session()
feature_group_name = "feature-group-name"
record_identifier_name = "customer_id"
event_time_feature_name = "event_time"
role = "arn:aws:iam::792470144447:role/sagemaker_feature_store"
```

3. Create an instance of the `IngestFeatureStore` class:

```python
ifs = IngestFeatureStore(
    sagemaker_session,
    feature_group_name,
    record_identifier_name,
    event_time_feature_name,
    role
)
```

4. Create a list with all your feature definitions. Feature definitions describe the name and type of each feature. There are three types: integral, string, and fractional.

```python
feature_definitions = [
    FeatureDefinition(feature_name='user_id', feature_type=FeatureTypeEnum.INTEGRAL),
    FeatureDefinition(feature_name='first_name', feature_type=FeatureTypeEnum.STRING),
    FeatureDefinition(feature_name='last_name', feature_type=FeatureTypeEnum.STRING),
    FeatureDefinition(feature_name='event_time', feature_type=FeatureTypeEnum.FRACTIONAL),
]
```

5. Create your feature group

```python
ifs.create_feature_group(feature_definitions)
```

**Note:** Feature groups are created asynchronously. You can verify the status with this:

```python
ifs.feature_group.describe()
```

or:

```python
ifs.feature_group_exist()
```

### Ingest data

Ingesting data into the Feature Store involves sending data to the appropriate feature groups.

1. On a console, import the following libraries:

```python
from feature_store.ingest import IngestFeatureStore
from sagemaker.session import Session
from sagemaker.feature_store.feature_group import FeatureDefinition
from sagemaker.feature_store.feature_definition import FeatureTypeEnum
import pandas as pd
import time
```

2. Set the following variables:

```python
sagemaker_session = Session()
feature_group_name = "feature-group-name"
record_identifier_name = "customer_id"
event_time_feature_name = "event_time"
role = "arn:aws:iam::792470144447:role/sagemaker_feature_store"
```

3. Get your data in a dataframe and set the event time if your data already doesn't have it.

```python
customer_data = pd.read_csv("feature_store/data/source_data.csv")
current_time_sec = int(round(time.time()))  # UNIX time
customer_data["event_time"] = current_time_sec
```

4. Ingest your data:

```python
ifs = IngestFeatureStore(sagemaker_session, feature_group_name, record_identifier_name, event_time_feature_name, role)
ifs.ingest(customer_data)
```

### Get Features

The `QueryFeatureStore` class allows you to query records from a feature group in the SageMaker Feature Store.

1. Import the required libraries:

```python
from feature_store.query import QueryFeatureStore
from sagemaker.session import Session
```

2. Set the following libraries:

```python
sagemaker_session = Session()
feature_group_name = "your-feature-group-name"
role = "arn:aws:iam::123456789012:role/sagemaker_feature_store"
```

3. Instantiate the `QueryFeatureStore` class:

```python
qfs = QueryFeatureStore(sagemaker_session, feature_group_name, role)
```

4. Get feature:

```python
record_identifier_value = "your-record-identifier-value"
record_data = qfs.get_record(record_identifier_value)
print(record_data)
```
