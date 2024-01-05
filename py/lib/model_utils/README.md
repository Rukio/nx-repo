## What's in this package

This package defines tools for ML infra. Mainly it defines the following components:

- convenience functions for model training and evaluation (`training/*.py`)
- model config (`ModelConfig` class in `model_config.py`)
- model name enums (`ModelName` in `enums.py`)
- config reader classes in `config_reader.py`
- utilities for reading/writing to/from S3 & local filesystem for model config (`file_utils.py`)
- test fixtures useful for testing `ModelConfig` that can also be imported by other packages. Since tests for `ModelConfig` were written first for Tele-p models, these fixtures are also imported by `telep` and `telep_model_server` packages.

## How to train new models

- Create new directory under `py/lib/` with your project name (e.g. `telep` or `bounceback`)
  - _Note:_ For convenience, users can run `poetry new project-name` in `py/lib/` to automatically
    create a new project with a Poetry environment.
- Add `model_utils` as a dependency to this project.
  - Run: `poetry add -G dev --editable path/to/py/lib/model_utils` to add as a development dependency
- Write notebooks and train model in this project
  - Add folders for `notebooks/` and `data/`
  - Where it makes sense, `git add` data used in model development such as crosswalks or reference codesets
  - Make sure to add any SQL queries used to generate training data

## How to add a new model

The general steps of adding a new model involves the following broad steps:

1. Register your new model along with feature preprocessing pipeline to the
   model registry using the `ModelConfig` API.
   - The model registry bucket is: `"s3://prod.ml-model-registry.*company-data-covered*"`
2. Implement a new model class that inherits from `BaseMLModel`, which combines
   feature preprocessing with prediction.
3. Implement a new microservice to serve the model.

More details and examples will follow. Steps 2 & 3 can be done in separate
packages (e.g., add a new package under `py/lib` to implement a new model class
and a new package under `py/projects` to implement the microservice) or both
can be implemented in the microservice itself.

### Models that have used this so far

Currently we have the following models using the same framework:

- Tele-p model:
  - model library is in `py/lib/telep`
  - model server is in `py/projects/telep_model_server`

### Are these classes used for training models?

The functions in `training/` are meant to help in training and evaluation.
The rest of the code is meant for _deploying_ trained models and feature processing
pipelines. Once you finish training models and are happy with the model you end up with,
you can add a library and a model server using the classes defined here.

### Should I separate model from feature pre-processing pipeline(s)?

Yes, we assume that you have separate instances for the model itself (getting features
as input and making predictions on them directly) and any feature pre-processing logic
(e.g., one-hot encoding, normalization, imputation). These two will be saved separately
in the model registry.

### ModelConfig

This class packages everything necessary to load, save, and validate a model. It implements a method to save all
relevant files for a model (model object itself, training data, scikit-learn column transformer). There is also a
method to load all the saved objects back into memory.

After saving all relevant files, it also creates a `metadata.json` file to record necessary information to load
everything back:

```
{
    "model_name": "iv",
    "model_filename": "model.json",
    "model_class": "XGBClassifier",
    "training_set_filenames": ["trainX.npy", "trainY.npy"],
    "test_set_filenames": ["testX.npy", "testY.npy"],
    "column_transformer_filename": "transformer.pkl",
    "author_email": "author@*company-data-covered*.com",
    "version": "20230111-152433PST"
}
```

Notes:

- All files referenced in `metadata.json` will be saved in the same directory as
  `metadata.json` itself.
- For now, only `XGBClassifier` model class is supported. We will add support for
  more model types as needed.
- training set and test set files are pickled numpy arrays (`np.ndarray`) or
  scipy sparse matrices (`csr_matrix`).
- column transformer is a pickled `sklearn.pipeline.Pipeline` object (preferred) or a
  `sklearn.compose.ColumnTransformer` object (supported for backwards compatability).
  The `Pipeline` object should contain all feature preprocessing logic and will be
  used by the model class to transform features before prediction.
- `author_email` needs to be a `*company-data-covered*.com` email address.
- model `version` is automatically generated when `ModelConfig` is created,
  unless it is specified by the user.

#### How might one use the `ModelConfig` class?

There are two main uses of the `ModelConfig` class:

1. Tele-p ML service loads the correct `ModelConfig` classes from S3 when the
   service starts. It will then validate the loaded model by evaluating on the
   test set and check if the evaluation metric matches those stored inside the model.
2. For users who wish to re-train Tele-p models, after training is finished,
   the user can package everything like the following:

```
model_config = ModelConfig(
    model_name="iv",
    model=model,
    training_set=(X_train, y_train),
    test_set=(X_test, y_test),
    column_transformer=column_transformer,
    author_email="author@*company-data-covered*.com",
)
# save to S3
model_config.save_to_model_store()
```

where `model` is the trained model object itself, `X_train` and `y_train` are
training features and labels, `X_test` and `y_test` are test set features and labels,
and `column_transformer` is a scikit-learn `Pipeline` or `ColumnTransformer` object.
User can also provide a version string; if not provided, a version string based on
timestamp will be generated.

### New model class that inherits from BaseMLModel

Details to be added in a future PR. The new model class can be added in a new Python
package such as `py/lib/telep`.

### New microservice

Please see `py/projects/telep_model_server` for an sample microservice that
serves an ML model.

## Config Readers

This package also contains two config reader classes, `StatsigConfigReader` and `LocalConfigReader`
for reading configs from statsig and local filesystem, respectively. In production,
we will use `StatsigConfigReader`, but `LocalConfigReader` could also be useful
for testing/experimentation.

### Examples

#### `StatsigConfigReader`

```
reader = StatsigConfigReader()
reader.read('config-name')
```

#### `LocalConfigReader`

```
reader = LocalConfigReader(config_dir='/path/to/configs')
reader.read('test_config.json')
```
