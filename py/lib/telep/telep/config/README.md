# Config sub-package

This sub-package defines the `TelepModelConfig` and `TelepServiceConfig` classes.

## TelepModelConfig

This config specifies (1) which ML models to use, and (2) how different model
scores are combined to form a final Hybrid (fmk as Tele-p) eligibility decision.
The config parameters are loaded from our **statsig** service and are loaded into the
`TelepModelConfig` class. Each config represents a different **version** of the
Hybrid model.

It must have all parameters defined in the schema to be a valid `TelepModelConfig`:

```yaml
- name
- model_store_home
- model_dirs
- ml_rules
- clinical_overrides_risk_protocol # these are clinical overrides or heuristics
```

One example of the input for `TelepModelConfig`:

```python
config = {
    "name": "DEFAULT",
    "model_registry_home": "s3://prod.ml-model-registry.*company-data-covered*",
    "model_dirs": {
        "IV": "models/IV/20221229",
        "CATHETER": "models/CATHETER/20221229",
        "RX_ADMIN": "models/RX_ADMIN/20221229"
    },
    "ml_rules": {
        "IV": {
            "operator": "lt",
            "threshold": 0.2
        },
        "CATHETER": {
            "operator": "lt",
            "threshold": 0.2
        },
        "RX_ADMIN": {
            "operator": "lt",
            "threshold": 0.2
        },
    },
    "clinical_overrides_risk_protocol": [
        "head_injury",
        "abdominal_pain",
        "bladder_catheter_issue",
        "confusion"
    ],
}
```

### Notes on parameters

- `model_store_home` is the home/root path of the model store.
- `models`: parameters about each model is stored under one key:
  - `model_dir`: relative path from `model_store_home` to the directory for the model directory; we assume all files
    from this model are saved in this directory
  - `threshold`:
  - `operator`:
- `ml_rules`: this defines a list of rules on ML model predictions. These rules + clinical override rules **ALL** need to
  evaluate to `True` in order for the tele-p service to return `True` as the final decision. Each rule is defined by the
  following: - key: name of the model score (must be from one of the models listed under `models`) - value: a list containing two elements: 1. `operator`: each model can specify its own operator for how it will compare against the threshold to get a
  True/False decision for that model. The following operators defined in Python's `operator` module are
  supported: `gt`, `ge`, `lt`, `le`, `ne`, and `eq`. 2. `threshold`: each model has an associated threshold that we will use to compare against model scores (scores
  should be between 0 and 1). - for example, if a rule says `"iv": ["lt", 0.6]`, then it returns `True` iff `iv_score < 0.6`, otherwise it
  returns `False`.
- `clinical_overrides_risk_protocol`: these are clinical overrides (aka heuristics) that are rule-based decisions
  mostly based on passed in `risk_protocol` values. If any of them evaluates to `True`, then they veto the ML model
  decisions and forces tele-p service to return `False`. For example, `head_injury` rule returns `False` if
  `risk_protocol == "head injury" && age < 2`. We implement these rules separately.

## TelepServiceConfig

This config defines which "model version" to use. Here is some nomenclature:

- model version: a combination of which sub-models (IV, catheter, or Rx_Admin) models + which clinical override rules to use. This is all specified in a `TelepModelConfig`, so each `TelepModelConfig` represents one model version;
- factual: what we expect to be used in business logic. Each CR should only have one factual model version
- shadow: which model versions (each CR can have multiple) to also run but not affecting business outcome
- model versions have this naming convention: `basic-v1.0` or `enhanced-v1.0`, and for each model version we will look up
  the dynamic config name like this: `hybrid-model-config-{hybrid_model_version}` but with dots replaced with `p`. For example,
  the dynamic config name for model version `basic-v1.1` is `hybrid-model-config-basic-v1p1`. This extends to patch version
  as well (e.g., `basic-v1.1.1` will map to `hybrid-model-config-basic-v1p1p1`).

This config is also stored on statsig (right now the config name is `telep-ml-service-config`) that looks like this:

```yaml
{
  factual:
    { default: 'basic-v1.0', market_overrides: { phx: 'enhanced-v1.0' } },
  shadow:
    { default: ['basic-v1.0'], market_overrides: { PHX: ['enhanced-v1.0'] } },
}
```

Note that each model version is one dynamic config name on statsig.
