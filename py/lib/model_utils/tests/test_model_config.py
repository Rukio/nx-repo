# -*- coding: utf-8 -*-
from __future__ import annotations

import os
import time

import pytest
from model_utils import errors
from model_utils.model_config import ModelConfig
from xgboost.sklearn import XGBClassifier


AUTHOR_EMAIL = "author@*company-data-covered*.com"
INVALID_AUTHOR_EMAIL = "author@gmail.com"


class TestModelConfig:
    def test_valid_model_config(
        self,
        toy_models,
        x_train,
        training_labels,
        column_transformer,
        descriptions,
        latest_risk_protocol_mapping_version,
        mock_model_name,
    ):
        y_train = training_labels[mock_model_name.IV]
        model_config = ModelConfig(
            model_name=mock_model_name.IV,
            model=toy_models[mock_model_name.IV],
            training_set=(x_train, y_train),
            test_set=(x_train, y_train),
            column_transformer=column_transformer,
            risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
            description=descriptions[mock_model_name.IV],
            author_email=AUTHOR_EMAIL,
        )
        # check that it generates a new version
        assert model_config.version is not None
        assert model_config.model_class == "XGBClassifier"
        assert model_config.risk_protocol_mapping_version == latest_risk_protocol_mapping_version

    def test_invalid_author_email(
        self,
        toy_models,
        x_train,
        training_labels,
        column_transformer,
        descriptions,
        latest_risk_protocol_mapping_version,
        mock_model_name,
    ):
        y_train = training_labels[mock_model_name.IV]
        with pytest.raises(errors.InvalidAuthors):
            ModelConfig(
                model_name=mock_model_name.IV,
                model=toy_models[mock_model_name.IV],
                training_set=(x_train, y_train),
                test_set=(x_train, y_train),
                column_transformer=column_transformer,
                risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
                description=descriptions[mock_model_name.IV],
                author_email=INVALID_AUTHOR_EMAIL,
            )

    def test_invalid_training_set_data(
        self,
        toy_models,
        x_train,
        training_labels,
        column_transformer,
        descriptions,
        latest_risk_protocol_mapping_version,
        mock_model_name,
    ):
        y_train_bad = training_labels[mock_model_name.IV][:-1]
        with pytest.raises(errors.InvalidTrainingSet):
            ModelConfig(
                model_name=mock_model_name.IV,
                model=toy_models[mock_model_name.IV],
                training_set=(x_train, y_train_bad),
                test_set=(x_train, y_train_bad),
                column_transformer=column_transformer,
                risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
                description=descriptions[mock_model_name.IV],
                author_email=INVALID_AUTHOR_EMAIL,
            )

    def test_incompatible_training_test_set_data(
        self,
        toy_models,
        x_train,
        training_labels,
        column_transformer,
        descriptions,
        latest_risk_protocol_mapping_version,
        mock_model_name,
    ):
        x_test_bad = x_train[:, :-1]
        y_train = training_labels[mock_model_name.IV]
        with pytest.raises(errors.IncompatibleTraingAndTestSet):
            ModelConfig(
                model_name=mock_model_name.IV,
                model=toy_models[mock_model_name.IV],
                training_set=(x_train, y_train),
                test_set=(x_test_bad, y_train),
                column_transformer=column_transformer,
                risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
                description=descriptions[mock_model_name.IV],
                author_email=INVALID_AUTHOR_EMAIL,
            )

    def test_load_from_model_registry(
        self,
        model_registry_home,
        default_telep_model_config_json,
        s3,
        latest_risk_protocol_mapping_version,
        test_version,
        mock_model_name,
    ):
        model_dir = os.path.join(model_registry_home, default_telep_model_config_json["model_dirs"][mock_model_name.IV])
        model_config = ModelConfig.load_from_model_registry(model_dir, model_name_class=mock_model_name, s3=s3)
        assert isinstance(model_config.model, XGBClassifier)
        assert model_config.description == "IV model for unit tests."
        assert model_config.risk_protocol_mapping_version == latest_risk_protocol_mapping_version
        assert model_config.version == test_version

        # check that the loaded model can predict on the loaded test set
        y_pred = model_config.model.predict_proba(model_config.test_set[0])
        assert len(y_pred) == len(model_config.test_set[1])

    def test_save_to_model_registry(
        self,
        s3,
        test_bucket,
        toy_models,
        x_train,
        training_labels,
        column_transformer,
        descriptions,
        latest_risk_protocol_mapping_version,
        mock_model_name,
    ):
        # sleep for 1 second so we're sure model versions won't conflict
        time.sleep(1)

        y_train = training_labels[mock_model_name.IV]
        model_config = ModelConfig(
            model_name=mock_model_name.IV,
            model=toy_models[mock_model_name.IV],
            training_set=(x_train, y_train),
            test_set=(x_train, y_train),
            column_transformer=column_transformer,
            risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
            description=descriptions[mock_model_name.IV],
            author_email=AUTHOR_EMAIL,
        )
        print(f"in test_save_to_model_registry: model version = {model_config.version}")
        s3.create_bucket(Bucket=test_bucket)
        model_dir = model_config.save_to_model_registry(f"s3://{test_bucket}", s3=s3)
        assert os.path.split(model_dir)[-1] == model_config.version

        # we expect an error if we try to save this model again, which already exists in model registry
        with pytest.raises(errors.VersionConflictError):
            model_config.save_to_model_registry(f"s3://{test_bucket}", s3=s3)

    def test__check_version_exists(
        self,
        s3,
        test_bucket,
        toy_models,
        x_train,
        training_labels,
        column_transformer,
        descriptions,
        latest_risk_protocol_mapping_version,
        mock_model_name,
    ):
        # sleep for 1 second so we're sure model versions won't conflict
        time.sleep(1)

        y_train = training_labels[mock_model_name.IV]
        model_config = ModelConfig(
            model_name=mock_model_name.IV,
            model=toy_models[mock_model_name.IV],
            training_set=(x_train, y_train),
            test_set=(x_train, y_train),
            column_transformer=column_transformer,
            risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
            description=descriptions[mock_model_name.IV],
            author_email=AUTHOR_EMAIL,
        )
        print(f"in test__check_version_exists: model version = {model_config.version}")
        s3.create_bucket(Bucket=test_bucket)
        _ = model_config.save_to_model_registry(f"s3://{test_bucket}", s3=s3)
        assert model_config._check_version_exists(f"s3://{test_bucket}", s3=s3) is True

    def test_version(
        self,
        toy_models,
        x_train,
        training_labels,
        column_transformer,
        descriptions,
        latest_risk_protocol_mapping_version,
        mock_model_name,
    ):
        y_train = training_labels[mock_model_name.IV]
        model_config = ModelConfig(
            model_name=mock_model_name.IV,
            model=toy_models[mock_model_name.IV],
            training_set=(x_train, y_train),
            test_set=(x_train, y_train),
            column_transformer=column_transformer,
            risk_protocol_mapping_version=latest_risk_protocol_mapping_version,
            description=descriptions[mock_model_name.IV],
            author_email=AUTHOR_EMAIL,
        )
        assert model_config._gen_version().endswith("-UTC")
