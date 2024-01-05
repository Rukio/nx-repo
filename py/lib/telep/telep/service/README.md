## Overview

This sub-package contains important classes for the operation of Tele-p ML
service. We break down the documentation into major functionalities below.

### Preprocessing

We define `TelepPreprocessor` that's responsible for preprocessing of features
before any column transformation (i.e., feature scaling, imputation, and
one-hot encoding). Here is an example:

```
rp_mapping = json.load(open('risk_protocol_mapping.json'))
preproc = TelepPreprocessor(rp_mapping)
df_preprocessed = preproc.run(df)
```

### Clinical Override

In addition to ML predictions, we also have a few clinical rules for Tele-p
eligibility. These rules can override ML predictions.

Currently the following rules are implemented:

- head injury with age <= 2
- abdominal pain
- bladder catheter issue
- confusion

Example:

```
override = TelepClinicalOverrides()
override.apply(request, "head_injury")
```

### Handling request for a market

The `TelepMarketHandler` class implements all steps needed to get a Tele-p
eligibility decision for a given market. The market is configured by `TelepMarketConfig`,
which is passed in when instantiating a `TelepMarketHandler` object. In production,
there should be one `TelepMarketHandler` instance for each market on the server.

Here is an example of market config (dynamic config on statsig):

```
"name": "DEFAULT",
"model_store_home": "s3://prod.ml-model-registry.*company-data-covered*",
"model_dirs": {
    "iv": "models/iv/20221229",
    "catheter": "models/catheter/20221229",
    "rx_admin": "models/rx_admin/20221229"
},
"ml_rules": {
    "iv": ["lt", 0.6],
    "catheter": ["lt", 0.8],
    "rx_admin":  ["le", 0.8]
},
"clinical_overrides_risk_protocol": [
    "head_injury",
    "abdominal_pain",
    "bladder_catheter_issue",
    "confusion"
],
```

Here is an example of how `TelepMarketHandler` is used:

```
handler = TelepMarketHandler(market_config, preprocessor, statsd)
handler.run(request)  # returns True/False
```

It performs the following steps:

1. Preprocess/standardizes the request data
2. Make predictions using ML models
3. Combine ML predictions from all models into a single ML decision
4. Evaluates clinical override logic.

### Handling request for the entire service

The `TelepMLServiceHandler` class handles all incoming requests for the service.
It looks up the proper `TelepMarketHandler` for each request and then delegates
the work to it. There should be **one** instance of `TelepMLServiceHandler`
for the server.

When the service starts, a `TelepMLServiceHandler` instance is created, and then
it reads all market configs from statsig to create `TelepMarketHandler`
instances. Therefore, this is the only class that reads configs from statsig.

Here is what service config `telep-ml-service-config` can look like on statsig:

```
"DEFAULT": "telep-default-market-config",
"DEN": "telep-denver-market-config",
"PHX": "telep-phoenix-market-config"
```

Essentially each key is the market name, and each value is the market config
name on statsig.

A quick example of how `TelepMLServiceHandler` is used:

```
telep_service = TelepMLServiceHandler(service_config_name="telep-ml-service-config")
telep_service.run(request)  # returns True/False
```
