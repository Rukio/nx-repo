# On-Scene Model

This package contains logic to be used by the on-scene model server to return
predictions of on-scene times for each shift team. The main functionalities are
as follows:

- The `OnSceneModel` class will handle transforming features, making predictions,
  and validating loaded models
- Looking up provider score from online feature store, then calculate average
  score for each shift team

## Expected Dynamic Config Schema

The on-scene model service requires these dynamic configs:

- service-level config `on_scene_model_service`: this is the service-level config that defines which version to use as "factual" (meaning it is what server returns) and which version(s) to run in "shadow"
- model-level config: for each version in service-level config, there should be a dynamic config named `on_scene_model_{ver_str}` where `ver_str` is formatted from semantic version in service-level config. These configs define the model version (in model registry) to use as well as other parameters.

### Service Config

Here is what the content of `on_scene_model_service` could look like:

```json
{
  "factual": "v1.0",
  "shadow": ["v1.1", "v1.2"]
}
```

- `factual` has the "factual" model version and is used to form the dynamic config name storing parameters of this version. For example, `v1.0` gets mapped to dynamic config name `on_scene_model_v1p0`.
- `shadow` has a **list** of model versions we are running in shadow, does not have to be defined

### Model Config

Each model-level config should look like this:

```json
{
  "model_name": "ON_SCENE",
  "model_version": "20230519-215238-UTC",
  "description": "Minimal features + prov score from feature store",
  "prediction_adjustment": 0,
  "minimum_on_scene_time": 5
}
```

- `model_name` should always be `ON_SCENE`
- `model_version` is the version of the ML model in **model registry**. This is generally the timestamp when an ML model is registered and is used to identify the exact model file to load from.
- `description`: a short description of this model
- `prediction_adjustment`: any additive blanket adjustment to the predicted on-scene time by ML model.
- `minimum_on_scene_time`: sets a floor of what the minimum predicted on-scene time to return. For example, if it's set to 5, then any prediction less than 5 by the model will become 5.
