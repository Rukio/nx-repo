# -*- coding: utf-8 -*-
from __future__ import annotations

import pytest
from model_utils.reader import LocalConfigReader
from model_utils.reader import StatsigConfigReader
from statsig import statsig

# initialize with dummy data
statsig.initialize("secret-key")


class TestLocalConfigReader:
    def test_successful_read(
        self, default_telep_model_config_file, local_config_dir, default_telep_model_config_json, mock_model_name
    ):
        reader = LocalConfigReader(local_config_dir)
        config_json = reader.read(default_telep_model_config_file)

        # convert model name str to enum
        for key, old_values in config_json.items():
            if key in ("model_dirs", "ml_rules"):
                new_values = {}
                for model_name_str in old_values:
                    model_name_enum = getattr(mock_model_name, model_name_str)
                    new_values[model_name_enum] = old_values[model_name_str]
                config_json[key] = new_values

        assert config_json == default_telep_model_config_json

    def test_unsuccessful_read(self, default_telep_model_config_file, local_config_dir):
        reader = LocalConfigReader(local_config_dir / "test_dir")
        with pytest.raises(FileNotFoundError):
            # read a config that doesn't exist in reader.config_dir
            reader.read(default_telep_model_config_file)


class TestStatsigConfigReader:
    def test_read(self):
        # dummy test to see if we get an empty config from a non-existent config
        reader = StatsigConfigReader()
        assert reader.read("mock-config") == {}
