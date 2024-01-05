# -*- coding: utf-8 -*-
from __future__ import annotations

import numpy as np
import pytest
from model_utils import file_utils

TEST_TXT_FILENAME = "test.txt"


@pytest.fixture(scope="module")
def test_str():
    return "Happy 2023!"


@pytest.fixture(scope="module")
def test_bucket():
    return "test-bucket-file-utils"


def test_get_storage_class(s3):
    assert isinstance(file_utils.get_storage_class(path="/Users/abc/models"), file_utils.LocalStorage)
    assert isinstance(
        file_utils.get_storage_class(path="s3://test-bucket/model.json", s3=s3),
        file_utils.S3Storage,
    )
    with pytest.raises(file_utils.MissingS3ClientError):
        file_utils.get_storage_class(path="s3://test-bucket/model.json")


class TestLocalStorage:
    def test_read_bytes(self, tmp_path):
        storage = file_utils.LocalStorage()
        test_msg = b"Easter eggs"
        tmp_file = tmp_path / TEST_TXT_FILENAME
        tmp_file.write_bytes(test_msg)
        read_msg = storage.read_bytes(tmp_file)
        assert read_msg == test_msg

    def test_read_text(self, tmp_path):
        storage = file_utils.LocalStorage()
        test_msg = "Easter eggs"
        tmp_file = tmp_path / TEST_TXT_FILENAME
        tmp_file.write_text(test_msg)
        read_msg = storage.read_text(tmp_file)
        assert read_msg == test_msg

    def test_xgb_model(self, toy_models, tmp_path, mock_model_name):
        storage = file_utils.LocalStorage()
        model = toy_models[mock_model_name.IV]
        model_path = tmp_path / "model.json"

        # save model
        storage.save_model(model=model, path=model_path)

        # load the model back
        model2 = storage.load_xgb_model(model_class="XGBClassifier", path=model_path)

        assert model.evals_result() == model2.evals_result()

    def test_pickle(self, tmp_path):
        storage = file_utils.LocalStorage()
        test_data = {"name": "foobar", "age": 17, "friends": ["kim", "nikki"]}
        tmp_file = tmp_path / "test.pkl"
        storage.save_pickle(obj=test_data, path=tmp_file)

        # load data back
        test_data2 = storage.load_pickle(tmp_file)
        assert test_data2 == test_data

    def test_npy(self, tmp_path):
        storage = file_utils.LocalStorage()
        test_data = np.random.uniform(size=10)
        tmp_file = tmp_path / "test.npy"
        storage.save_npy(obj=test_data, path=tmp_file)

        # load it back
        test_data2 = storage.load_npy(tmp_file)
        np.testing.assert_array_almost_equal(test_data, test_data2)

    def test_path_exists(self, tmp_path):
        storage = file_utils.LocalStorage()
        tmp_file = tmp_path / TEST_TXT_FILENAME
        tmp_file.write_text("Easter egg")
        assert storage.path_exists(tmp_file) is True
        assert storage.path_exists(tmp_path / "ghost.txt") is False

    def test_json(self, tmp_path):
        storage = file_utils.LocalStorage()
        tmp_file = tmp_path / "test.json"
        test_data = {"New York": "NY", "California": "CA", "Colorado": "CO"}
        storage.save_json(obj=test_data, path=tmp_file)
        test_data2 = storage.load_json(tmp_file)
        assert test_data2 == test_data


class TestS3Storage:
    def test_parse_s3_path(self, s3):
        storage = file_utils.S3Storage(s3=s3)
        path1 = "s3://abc"
        bucket1, name1 = storage.parse_s3_path(path1)
        assert bucket1 == "abc"
        assert name1 == ""

        path2 = "s3://abc/def/ghi"
        bucket2, name2 = storage.parse_s3_path(path2)
        assert bucket2 == "abc"
        assert name2 == "def/ghi"

    def test_read_bytes(self, s3, test_bucket):
        test_data = b"Easter eggs"
        s3.create_bucket(Bucket=test_bucket)
        s3.put_object(Body=test_data, Bucket=test_bucket, Key=TEST_TXT_FILENAME)
        # read bytes back
        storage = file_utils.S3Storage(s3=s3)
        test_data2 = storage.read_bytes(f"s3://{test_bucket}/test.txt")
        assert test_data2 == test_data

    def test_read_text(self, s3, test_bucket):
        test_data = "Easter eggs"
        s3.create_bucket(Bucket=test_bucket)
        s3.put_object(Body=test_data, Bucket=test_bucket, Key=TEST_TXT_FILENAME)
        # read text back
        storage = file_utils.S3Storage(s3=s3)
        test_data2 = storage.read_text(f"s3://{test_bucket}/test.txt")
        assert test_data2 == test_data

    def test_xgb_model(self, s3, test_bucket, toy_models, mock_model_name):
        storage = file_utils.S3Storage(s3=s3)
        model = toy_models[mock_model_name.IV]
        model_path = f"s3://{test_bucket}/model.json"
        s3.create_bucket(Bucket=test_bucket)

        # save model
        storage.save_model(model=model, path=model_path)

        # load the model back
        model2 = storage.load_xgb_model(model_class="XGBClassifier", path=model_path)

        assert model.evals_result() == model2.evals_result()

    def test_pickle(self, s3, test_bucket):
        storage = file_utils.S3Storage(s3=s3)
        s3.create_bucket(Bucket=test_bucket)
        test_data = {"name": "foobar", "age": 17, "friends": ["kim", "nikki"]}
        tmp_file = f"s3://{test_bucket}/test.pkl"
        storage.save_pickle(obj=test_data, path=tmp_file)

        # load data back
        test_data2 = storage.load_pickle(tmp_file)
        assert test_data2 == test_data

    def test_npy(self, s3, test_bucket):
        storage = file_utils.S3Storage(s3=s3)
        s3.create_bucket(Bucket=test_bucket)
        test_data = np.random.uniform(size=10)
        tmp_file = f"s3://{test_bucket}/test.npy"
        storage.save_npy(obj=test_data, path=tmp_file)

        # load it back
        test_data2 = storage.load_npy(tmp_file)
        np.testing.assert_array_almost_equal(test_data, test_data2)

    def test_json(self, s3, test_bucket):
        storage = file_utils.S3Storage(s3=s3)
        s3.create_bucket(Bucket=test_bucket)
        test_data = {"New York": "NY", "California": "CA", "Colorado": "CO"}
        tmp_file = f"s3://{test_bucket}/test.json"
        storage.save_json(obj=test_data, path=tmp_file)
        test_data2 = storage.load_json(tmp_file)
        assert test_data2 == test_data

    def test_path_exists(self, s3, test_bucket):
        storage = file_utils.S3Storage(s3=s3)
        s3.create_bucket(Bucket=test_bucket)
        test_data = {"name": "foobar", "age": 17, "friends": ["kim", "nikki"]}
        tmp_file = f"s3://{test_bucket}/test.pkl"
        storage.save_pickle(obj=test_data, path=tmp_file)

        assert storage.path_exists(tmp_file) is True
        assert storage.path_exists(f"s3://{test_bucket}/ghost_dir/") is False
