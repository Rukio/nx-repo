# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import os
import pathlib
import pickle
from abc import ABC
from abc import abstractmethod
from tempfile import TemporaryDirectory
from urllib.parse import urlparse

import numpy as np
from beartype import beartype
from beartype.typing import Any
from beartype.typing import Callable
from beartype.typing import Dict
from beartype.typing import Optional
from beartype.typing import Tuple
from beartype.typing import Union
from botocore.client import BaseClient
from scipy.sparse import csr_matrix
from xgboost.sklearn import XGBClassifier
from xgboost.sklearn import XGBRegressor

MODEL_CLASSES = {"XGBClassifier": XGBClassifier, "XGBRegressor": XGBRegressor}
JSON_EXTENSION = ".json"


class MissingS3ClientError(Exception):
    pass


@beartype
def create_parent_dir(func: Callable) -> Callable:
    """A decorator to create parent directory.

    The need is that sometimes if func is saving a file to a path whose parent
    directory isn't created yet, it would fail. This decorator will create the
    parent directory first before calling func.

    Arguments
    ---------
    func
        A function that we will decorate.

    Returns
    -------
    A decorated func.
    """

    def wrapper(*args, **kwargs) -> Any:
        """Expects path to be the last arg in any function this will decorate."""
        parent = pathlib.Path(kwargs["path"]).parent
        pathlib.Path(parent).mkdir(parents=True, exist_ok=True)
        return func(*args, **kwargs)

    return wrapper


@beartype
class BaseStorage(ABC):
    @abstractmethod
    def read_bytes(self, path):
        pass

    @abstractmethod
    def read_text(self, path):
        pass

    @abstractmethod
    def save_xgb_model(self, *, model, path):
        pass

    @abstractmethod
    def load_pickle(self, path):
        pass

    @abstractmethod
    def save_pickle(self, *, obj, path):
        pass

    @abstractmethod
    def save_json(self, *, obj, path):
        pass

    @abstractmethod
    def load_json(self, path):
        pass

    @abstractmethod
    def save_npy(self, *, obj, path):
        pass

    @abstractmethod
    def load_npy(self, path):
        pass

    @abstractmethod
    def path_exists(self, path):
        pass

    def save_model(self, *, model: Union[XGBClassifier, XGBRegressor], path: Union[str, pathlib.Path]) -> None:
        """Wrapper around the proper method to save model.

        This is added so we can support saving more types of models.

        Arguments
        ---------
        model
            Model object to be saved.
        path
            Path where model will be saved to (including filename).
        """
        modelclass_to_method = {
            "XGBClassifier": self.save_xgb_model,
            "XGBRegressor": self.save_xgb_model,
        }
        model_classname = type(model).__name__
        _method = modelclass_to_method[model_classname]
        # use the appropriate method to save
        _method(model=model, path=path)


@beartype
class LocalStorage(BaseStorage):
    def read_bytes(self, path: Union[str, pathlib.Path]):
        """Returns file content in bytes."""
        with open(path, "rb") as f:
            content = f.read()
        return content

    def read_text(self, path: Union[str, pathlib.Path]):
        """Returns file content in text."""
        with open(path, "r") as f:
            content = f.read()
        return content

    def load_xgb_model(self, *, model_class: str, path: Union[str, pathlib.Path]) -> Union[XGBClassifier, XGBRegressor]:
        """Load an XGB model from a local path."""
        assert os.path.splitext(path)[1] == JSON_EXTENSION
        assert model_class in MODEL_CLASSES
        model = MODEL_CLASSES[model_class]()
        model.load_model(path)
        return model

    @create_parent_dir
    def save_xgb_model(self, *, model: Union[XGBClassifier, XGBRegressor], path: Union[str, pathlib.Path]):
        """Save an XGB model to a local path."""
        assert os.path.splitext(path)[1] == JSON_EXTENSION
        model.save_model(path)

    def load_pickle(self, path: Union[str, pathlib.Path]):
        """Use pickle to load an object from path."""
        obj = self.read_bytes(path)
        return pickle.loads(obj)

    @create_parent_dir
    def save_pickle(self, *, obj: Any, path: Union[str, pathlib.Path]):
        """Pickle an object to a path."""
        with open(path, "wb") as f:
            pickle.dump(obj, f)

    @create_parent_dir
    def save_json(self, *, obj: Dict[str, Any], path: Union[str, pathlib.Path]):
        """Save a Python dict to JSON"""
        with open(path, "w") as f:
            json.dump(obj, f)

    def load_json(self, path: Union[str, pathlib.Path]) -> Dict[str, Any]:
        """Load content of a JSON file."""
        with open(path, "r") as f:
            data = json.load(f)
        return data

    @create_parent_dir
    def save_npy(self, *, obj: Union[np.ndarray, csr_matrix], path: Union[str, pathlib.Path]) -> None:
        """Save a numpy array or sparse matrix to path."""
        with open(path, "wb") as f:
            np.save(f, obj, allow_pickle=True)

    def load_npy(self, path: Union[str, pathlib.Path]) -> Union[np.ndarray, csr_matrix]:
        """Load a numpy array back."""
        with open(path, "rb") as f:
            obj = np.load(f)
        return obj

    def path_exists(self, path: Union[str, pathlib.Path]) -> bool:
        """Check if a path exist"""
        return os.path.exists(path)


@beartype
class S3Storage(BaseStorage):
    def __init__(self, s3: BaseClient):
        self.s3 = s3

    def parse_s3_path(self, path: str) -> Tuple[str, str]:
        """Parse S3 path into bucket and object names.
        Parameters
        ----------
        path:
            Input path
        Returns
        -------
        bucket, object_name:
            Name of S3 bucket and object name
        """
        parsed = urlparse(path)
        if parsed.scheme != "s3":
            raise ValueError(f"Path {path} is not an S3 path.")
        key = parsed.path
        # remove leading '/' from path
        if len(key) > 0 and key[0] == "/":
            key = key[1:]
        return parsed.netloc, key

    def read_bytes(self, path: str):
        """Returns a file handle opened in read mode."""
        bucket, object_name = self.parse_s3_path(path)
        obj = self.s3.get_object(Bucket=bucket, Key=object_name)
        return obj["Body"].read()

    def read_text(self, path: str, encoding: str = "utf-8"):
        """Returns file content in text."""
        content = self.read_bytes(path)
        return content.decode(encoding)

    def load_xgb_model(self, *, model_class: str, path: str) -> Union[XGBClassifier, XGBRegressor]:
        """Load an XGB model back from S3 path. Need an instance of the appropriate model class as argument."""
        assert os.path.splitext(path)[1] == JSON_EXTENSION
        assert model_class in MODEL_CLASSES
        model = MODEL_CLASSES[model_class]()
        content = self.read_bytes(path)
        model.load_model(bytearray(content))
        return model

    def save_xgb_model(self, *, model: Union[XGBClassifier, XGBRegressor], path: str):
        """Save an XGBoost model to path on S3."""
        assert os.path.splitext(path)[1] == JSON_EXTENSION
        bucket, object_name = self.parse_s3_path(path)
        with TemporaryDirectory() as tmp_dir:
            tmp_file = os.path.join(tmp_dir, "model.json")
            model.save_model(tmp_file)
            self.s3.upload_file(Filename=tmp_file, Bucket=bucket, Key=object_name)

    def load_pickle(self, path: str):
        """Use pickle to load an object from S3 path."""
        obj = self.read_bytes(path)
        return pickle.loads(obj)

    def save_pickle(self, *, obj: Any, path: str):
        """Pickle an object to an S3 path."""
        bucket, object_name = self.parse_s3_path(path)
        filename = os.path.split(path)[1]
        with TemporaryDirectory() as tmp_dir:
            tmp_file = os.path.join(tmp_dir, filename)
            with open(tmp_file, "wb") as f:
                pickle.dump(obj, f)
            self.s3.upload_file(Filename=tmp_file, Bucket=bucket, Key=object_name)

    def save_json(self, *, obj: Dict[str, Any], path: str):
        """Save a Python dict to JSON on S3"""
        bucket, object_name = self.parse_s3_path(path)
        filename = os.path.split(path)[1]
        assert os.path.splitext(filename)[1] == JSON_EXTENSION
        with TemporaryDirectory() as tmp_dir:
            tmp_file = os.path.join(tmp_dir, filename)
            with open(tmp_file, "w") as f:
                json.dump(obj, f)
            self.s3.upload_file(Filename=tmp_file, Bucket=bucket, Key=object_name)

    def load_json(self, path: str) -> Dict[str, Any]:
        """Load the content of a JSON file on S3"""
        bucket, object_name = self.parse_s3_path(path)
        filename = os.path.split(path)[1]
        assert os.path.splitext(filename)[1] == JSON_EXTENSION
        obj = self.s3.get_object(Bucket=bucket, Key=object_name)
        return json.loads(obj["Body"].read())

    def save_npy(self, *, obj: Union[np.ndarray, csr_matrix], path: str) -> None:
        """Save a numpy array or sparse matrix to S3 path."""
        bucket, object_name = self.parse_s3_path(path)
        filename = os.path.split(path)[1]
        with TemporaryDirectory() as tmp_dir:
            tmp_file = os.path.join(tmp_dir, filename)
            with open(tmp_file, "wb") as f:
                np.save(f, obj, allow_pickle=True)
            self.s3.upload_file(Filename=tmp_file, Bucket=bucket, Key=object_name)

    def load_npy(self, path: str) -> Union[np.ndarray, csr_matrix]:
        """Load a numpy array or csr_matrix back from S3 path."""
        bucket, object_name = self.parse_s3_path(path)
        filename = os.path.split(path)[1]
        assert os.path.splitext(filename)[1] == ".npy"
        # unfortunately, np.load only takes paths or opened file handles as input, so need to download this file first
        with TemporaryDirectory() as tmp_dir:
            tmp_file = os.path.join(tmp_dir, filename)
            self.s3.download_file(bucket, object_name, tmp_file)
            obj = np.load(tmp_file, allow_pickle=True)
        return obj

    def path_exists(self, path: str) -> bool:
        """Check if a path/prefix exists on S3"""
        bucket, prefix = self.parse_s3_path(path)
        results = self.s3.list_objects(Bucket=bucket, Prefix=prefix)
        return "Contents" in results


def get_storage_class(
    *, path: Union[str, pathlib.Path], s3: Optional[BaseClient] = None
) -> Union[LocalStorage, S3Storage]:
    """Get proper class to read/write from/to path."""
    if isinstance(path, pathlib.Path):
        path = path.as_posix()
    if path.startswith("s3://"):
        if s3 is None:
            raise MissingS3ClientError("Please provide a boto3 S3 client if path is on S3.")
        return S3Storage(s3=s3)
    else:
        return LocalStorage()
