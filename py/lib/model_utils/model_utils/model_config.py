# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
import os
from datetime import datetime
from datetime import timezone
from enum import EnumMeta
from urllib.parse import urlparse

import numpy as np
from beartype import beartype
from beartype.typing import Any
from beartype.typing import Dict
from beartype.typing import Optional
from beartype.typing import Tuple
from beartype.typing import Union
from botocore.client import BaseClient
from decouple import config
from model_utils.file_utils import get_storage_class
from scipy.sparse import csr_matrix
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from xgboost.sklearn import XGBClassifier
from xgboost.sklearn import XGBRegressor

from .enums import BaseModelName
from .errors import EmptyDescriptionError
from .errors import IncompatibleTraingAndTestSet
from .errors import InvalidAuthors
from .errors import InvalidPath
from .errors import InvalidTestSet
from .errors import InvalidTrainingSet
from .errors import VersionConflictError


logger = logging.getLogger("telep.config")


MODEL_METADATA_FILE = "metadata.json"
SUPPORTED_MODEL_CLASSES = {"XGBClassifier": XGBClassifier, "XGBRegressor": XGBRegressor}
STANDARD_MODEL_FILENAME = {"XGBClassifier": "model.json", "XGBRegressor": "model.json"}

MODEL_REGISTRY_HOME = config("MODEL_REGISTRY_HOME", default="s3://prod.ml-model-registry.*company-data-covered*")


@beartype
class ModelConfig:
    """configuration of an individual model"""

    def __init__(
        self,
        model_name: BaseModelName,
        model: Union[XGBClassifier, XGBRegressor],
        training_set: Tuple[Union[csr_matrix, np.ndarray], np.ndarray],
        test_set: Tuple[Union[csr_matrix, np.ndarray], np.ndarray],
        column_transformer: Union[ColumnTransformer, Pipeline],
        risk_protocol_mapping_version: str,
        author_email: str,
        description: str,
    ) -> None:
        self.model_name = model_name
        self.model = model
        self.column_transformer = column_transformer
        self.training_set = training_set
        self.test_set = test_set
        self.risk_protocol_mapping_version = risk_protocol_mapping_version
        self.author_email = author_email
        self.description = description
        # assign model version: using timestamp
        self.version = self._gen_version()

        self.model_class = type(self.model).__name__

        self.validate_model_config()

    def _gen_version(self) -> str:
        """Generate a version string like 20230112-151303-UTC"""
        now = datetime.now(timezone.utc)
        ts = now.strftime("%Y%m%d-%H%M%S")
        return f"{ts}-UTC"

    def validate_model_config(self) -> None:
        """Validate this model config.

        Note we only validate things without loading any file from model registry.

        """
        self._validate_training_and_test_set()
        self._validate_author_email()
        self._validate_description()

    def _validate_training_and_test_set(self) -> None:
        x_train, y_train = self.training_set
        # check features & labels have the same number of rows
        if x_train.shape[0] != y_train.shape[0]:
            raise InvalidTrainingSet("Training set features & labels have different number of records.")
        if len(y_train.shape) != 1:
            raise InvalidTrainingSet("Training set label has more than one column.")

        x_test, y_test = self.test_set
        if x_test.shape[0] != y_test.shape[0]:
            raise InvalidTestSet("Test set features & labels have different number of records.")
        if len(y_test.shape) != 1:
            raise InvalidTestSet("Test set label has more than one column.")

        if x_train.shape[1] != x_test.shape[1]:
            raise IncompatibleTraingAndTestSet("Training set and test set have different number of features.")

    def _validate_author_email(self):
        # assume an author's email is their *company-data-covered* email
        if not self.author_email.endswith("@*company-data-covered*.com"):
            text = "error in validation: provided author is not a dispatch email"
            logger.error(text, extra={"author": self.author_email})
            raise InvalidAuthors(text)

    def _validate_description(self):
        if len(self.description) == 0:
            raise EmptyDescriptionError("Description is empty, please provide something.")

    def _check_version_exists(
        self, model_registry_home: str = MODEL_REGISTRY_HOME, s3: Optional[BaseClient] = None
    ) -> bool:
        """Check if a model with the same version already exists.

        Parameters
        ----------
        model_registry_home
            Path to the home directory of model registry
        s3
            A boto3 S3 client instance is required if model_registry_home is on S3

        Returns
        -------
        True if the current ModelConfig's version already exists in model registry,
        otherwise False.

        """
        storage = get_storage_class(path=model_registry_home, s3=s3)
        model_dir = os.path.join(model_registry_home, "models", self.model_name.name, self.version, "")
        exists = storage.path_exists(model_dir)
        return exists

    def save_to_model_registry(
        self, model_registry_home: str = MODEL_REGISTRY_HOME, s3: Optional[BaseClient] = None
    ) -> str:
        """Serialize ModelConfig to storage. Also saves model-related artifacts.

        ModelConfig will be serialized to a JSON file with content that looks like this:
        {
            "model_name": "IV",
            "model_filename": "model.json",
            "model_class": "XGBClassifier",
            "training_set_filenames": ["trainX.npy", "trainY.npy"],
            "test_set_filenames": ["testX.npy", "testY.npy"],
            "column_transformer_filename": "transformer.pkl",
            "risk_protocol_mapping_version": "b5fdc72ea5019ede38e048d39e58b71f",
            "author_email": "author@*company-data-covered*.com",
            "version": "20230111-152433PST",
            "description": "Some model description text"
        }

        Parameters
        ----------
        model_registry_home
            Path to the home directory of model registry
        s3
            A boto3 S3 client instance. This is required if model_registry_home is on S3.

        Returns
        -------
        model_dir
            Full path to the directory that we saved everything from this ModelConfig to.

        """
        if urlparse(model_registry_home).scheme not in ("s3", ""):
            raise InvalidPath(f"model_registry_home path '{model_registry_home}' is not valid.")
        # use str as model_name when saving to storage
        model_name_str = self.model_name.name

        config_json: Dict[str, Any] = {}
        config_json["model_name"] = model_name_str
        config_json["model_filename"] = STANDARD_MODEL_FILENAME[self.model_class]
        config_json["model_class"] = self.model_class
        config_json["training_set_filenames"] = ["trainX.npy", "trainY.npy"]
        config_json["test_set_filenames"] = ["testX.npy", "testY.npy"]
        config_json["column_transformer_filename"] = "transformer.pkl"
        config_json["risk_protocol_mapping_version"] = self.risk_protocol_mapping_version
        config_json["author_email"] = self.author_email
        config_json["version"] = self.version
        config_json["description"] = self.description

        # save files
        model_dir = os.path.join(model_registry_home, "models", model_name_str, self.version)
        model_filename = STANDARD_MODEL_FILENAME[self.model_class]

        # check if version exists, if yes then throw an error here
        if self._check_version_exists(model_registry_home, s3=s3):
            raise VersionConflictError(f"Model {self.model_name} with version {self.version} already exists!")

        storage = get_storage_class(path=model_registry_home, s3=s3)

        # save model
        storage.save_model(model=self.model, path=os.path.join(model_dir, model_filename))

        # save training set
        x_train, y_train = self.training_set
        storage.save_pickle(obj=x_train, path=os.path.join(model_dir, "trainX.npy"))
        storage.save_pickle(obj=y_train, path=os.path.join(model_dir, "trainY.npy"))

        # save test set
        x_test, y_test = self.test_set
        storage.save_pickle(obj=x_test, path=os.path.join(model_dir, "testX.npy"))
        storage.save_pickle(obj=y_test, path=os.path.join(model_dir, "testY.npy"))

        # save column transformer
        storage.save_pickle(obj=self.column_transformer, path=os.path.join(model_dir, "transformer.pkl"))

        # save config_json
        storage.save_json(obj=config_json, path=os.path.join(model_dir, MODEL_METADATA_FILE))

        return model_dir

    @staticmethod
    def load_from_model_registry(
        model_dir: str, model_name_class: EnumMeta, s3: Optional[BaseClient] = None
    ) -> ModelConfig:
        """Load from a json file object.

        Parameters
        ----------
        model_dir
            Path (on S3) to a DIRECTORY/PREFIX containing metadata.json
        model_name_class
            Enum class that defines the model name for this model config.
        s3
            A boto3 S3 client instance. This is required if model_dir is on S3.

        Returns
        -------
        A ModelConfig object with parameters from metadata.json.
        """
        storage = get_storage_class(path=model_dir, s3=s3)

        metadata_path = os.path.join(model_dir, MODEL_METADATA_FILE)
        config_json = storage.load_json(metadata_path)
        kwargs = {}
        kwargs["model_name"] = getattr(model_name_class, config_json["model_name"])

        # load model
        model_file_path = os.path.join(model_dir, config_json["model_filename"])
        model_obj = storage.load_xgb_model(model_class=config_json["model_class"], path=model_file_path)
        kwargs["model"] = model_obj

        # load training set
        training_set = []
        for fn in config_json["training_set_filenames"]:
            training_set.append(storage.load_npy(os.path.join(model_dir, fn)))
        kwargs["training_set"] = tuple(training_set)

        # load test set
        test_set = []
        for fn in config_json["test_set_filenames"]:
            test_set.append(storage.load_npy(os.path.join(model_dir, fn)))
        kwargs["test_set"] = tuple(test_set)

        # load column transformer
        kwargs["column_transformer"] = storage.load_pickle(
            os.path.join(model_dir, config_json["column_transformer_filename"])
        )

        kwargs["risk_protocol_mapping_version"] = config_json["risk_protocol_mapping_version"]
        kwargs["author_email"] = config_json["author_email"]
        kwargs["description"] = config_json["description"]

        config = ModelConfig(**kwargs)
        # correctly set the version to the loaded version, not the new auto-generated version
        config.version = config_json["version"]

        return config
