# -*- coding: utf-8 -*-
# NOTE: the current test pipeline requires that tests pass, and seemingly treats
#       no tests running as a failure
from __future__ import annotations

from copy import deepcopy

import pytest
from telep.config import errors
from telep.config.enums import ClinicalOverrideRule
from telep.config.enums import ModelName
from telep.config.telep_model_config import _model_name_enum_to_str
from telep.config.telep_model_config import _validate_market_overrides
from telep.config.telep_model_config import FactualModelConfigs
from telep.config.telep_model_config import ShadowModelConfigs
from telep.config.telep_model_config import TelepModelConfig
from telep.config.telep_model_config import TelepServiceConfig


def test__model_name_enum_to_str():
    params = {ModelName.IV: 1, ModelName.CATHETER: 2}
    params_with_str = _model_name_enum_to_str(params)
    assert params_with_str == {"IV": 1, "CATHETER": 2}


class TestTelepModelConfig:
    def test_valid_config(self, default_telep_model_config_json):
        print(
            "model_registry_home =",
            default_telep_model_config_json["model_registry_home"],
        )
        telep_model_config = TelepModelConfig(**default_telep_model_config_json)

        assert telep_model_config.name == "DEFAULT"
        assert ModelName.IV in telep_model_config.model_dirs.keys()
        assert ModelName.CATHETER in telep_model_config.model_dirs.keys()
        assert ModelName.RX_ADMIN in telep_model_config.model_dirs.keys()

        assert ClinicalOverrideRule.HEAD_INJURY in telep_model_config.clinical_overrides_enums
        assert ClinicalOverrideRule.ABDOMINAL_PAIN in telep_model_config.clinical_overrides_enums
        assert ClinicalOverrideRule.BLADDER_CATHETER_ISSUE in telep_model_config.clinical_overrides_enums
        assert ClinicalOverrideRule.CONFUSION in telep_model_config.clinical_overrides_enums

    def test_incorrect_schema(self, default_telep_model_config_json):
        # looks like beartype does NOT check the types inside of Dicts, so we need to check them ourselves...
        bad_config = deepcopy(default_telep_model_config_json)
        bad_config["ml_rules"][ModelName.IV]["threshold"] = "abc"
        with pytest.raises(errors.BadConfigSchemaError):
            TelepModelConfig(**bad_config)

    def test_invalid_operator(self, default_telep_model_config_json):
        bad_config = deepcopy(default_telep_model_config_json)
        bad_config["ml_rules"][ModelName.IV]["operator"] = "sum"
        with pytest.raises(errors.InvalidOperator):
            TelepModelConfig(**bad_config)

    def test_load_model_config(self, model_registry_home, default_telep_model_config_json, s3):
        telep_model_config = TelepModelConfig(**default_telep_model_config_json)
        model_config = telep_model_config.load_model_config(ModelName.IV, s3=s3)
        assert model_config.model_name == ModelName.IV
        assert model_config.model_class == "XGBClassifier"

        # test if model name does not exist in TelepModelConfig
        bad_telep_model_config_json = deepcopy(default_telep_model_config_json)
        del bad_telep_model_config_json["model_dirs"][ModelName.IV]
        bad_telep_model_config = TelepModelConfig(**bad_telep_model_config_json)
        with pytest.raises(errors.ModelNotFoundError):
            bad_telep_model_config.load_model_config(ModelName.IV, s3=s3)

    def test_unsupported_clinical_override_rules(self, default_telep_model_config_json):
        bad_config = deepcopy(default_telep_model_config_json)
        bad_config["clinical_overrides_risk_protocol"].append("unknown_rule")
        with pytest.raises(errors.InvalidClinicalOverrideRuleError):
            TelepModelConfig(**bad_config)

    def test_dump_to_json(self, default_telep_model_config_json):
        telep_model_config = TelepModelConfig(**default_telep_model_config_json)
        exported_json = telep_model_config.dump_to_json()
        assert exported_json["name"] == telep_model_config.name
        assert exported_json["model_registry_home"] == telep_model_config.model_registry_home
        for model_name in exported_json["model_dirs"].keys():
            assert isinstance(model_name, str)
            assert getattr(ModelName, model_name) is not None
        assert exported_json["clinical_overrides_risk_protocol"] == telep_model_config.clinical_overrides_risk_protocol
        for model_name in exported_json["ml_rules"].keys():
            assert isinstance(model_name, str)
            assert getattr(ModelName, model_name) is not None


def test__validate_market_overrides():
    assert _validate_market_overrides({"DEN": "denver-override"}) == {"den": "denver-override"}
    assert _validate_market_overrides({"DEN": ["DENVER-OVERRIDE"]}) == {"den": ["denver-override"]}
    with pytest.raises(errors.MarketNameError):
        _validate_market_overrides({"DENVER": "denver-override"})


class TestFactualModelConfigs:
    def test_validate_market_overrides(self):
        config = FactualModelConfigs(default="1.0", market_overrides={"PHX": "1.1"})
        assert "phx" in config.market_overrides.keys()
        assert "PHX" not in config.market_overrides.keys()


class TestShadowModelConfigs:
    def test_validate_market_overrides(self):
        config = ShadowModelConfigs(default=["1.0", "1.1"], market_overrides={"DEN": ["1.2"]})
        assert "den" in config.market_overrides.keys()
        assert "DEN" not in config.market_overrides.keys()


class TestTelepServiceConfig:
    factual = FactualModelConfigs(default="1.0", market_overrides={"phx": "1.2"})
    shadow = ShadowModelConfigs(default=["1.1"], market_overrides={"den": ["1.3"], "PHX": ["1.4", "1.5"]})
    config = TelepServiceConfig(factual=factual, shadow=shadow)

    def test_full_config(self):
        config = TelepServiceConfig(factual=self.factual, shadow=self.shadow)
        assert config.shadow is not None
        assert "phx" in config.shadow.market_overrides

    def test_missing_shadow(self):
        config = TelepServiceConfig(factual=self.factual)
        assert config.shadow is None

    def test_load_from_json(self):
        data = {
            "factual": {"default": "1.0", "market_overrides": {"phx": "1.2"}},
            "shadow": {
                "default": ["1.1"],
                "market_overrides": {"den": ["1.3"], "PHX": ["1.4", "1.5"]},
            },
        }
        config = TelepServiceConfig.load_from_json(data)
        assert config.shadow.market_overrides["phx"] == ["1.4", "1.5"]

    def test_load_from_json_no_shadow(self):
        data = {"factual": {"default": "1.0", "market_overrides": {"phx": "1.2"}}}
        config = TelepServiceConfig.load_from_json(data)
        assert config.shadow is None

        # try an empty shadow
        data["shadow"] = {}
        config = TelepServiceConfig.load_from_json(data)
        assert config.shadow is None

    def test_lookup_factual_version(self):
        assert self.config.lookup_factual_version("xyz") == "1.0"
        assert self.config.lookup_factual_version("PHX") == "1.2"

        with pytest.raises(errors.MarketNameError):
            self.config.lookup_factual_version("utah")

    def test_lookup_shadow_versions(self):
        assert self.config.lookup_shadow_versions("xyz") == ["1.1"]
        assert self.config.lookup_shadow_versions("DEN") == ["1.3"]
        assert self.config.lookup_shadow_versions("phx") == ["1.4", "1.5"]

        with pytest.raises(errors.MarketNameError):
            self.config.lookup_shadow_versions("utah")

    def test_lookup_shadow_versions_from_missing_shadow(self):
        data = {"factual": {"default": "1.0", "market_overrides": {"phx": "1.2"}}}
        config = TelepServiceConfig.load_from_json(data)
        assert config.lookup_shadow_versions("xyz") == []

    def test_unique_model_versions(self):
        assert self.config.unique_model_versions == set(["1.0", "1.1", "1.2", "1.3", "1.4", "1.5"])

        # try some duplicate version numbers
        data = {
            "factual": {"default": "1.0", "market_overrides": {"phx": "1.2"}},
            "shadow": {
                "default": ["1.1"],
                "market_overrides": {"den": ["1.3"], "PHX": ["1.0", "1.4", "1.5"]},
            },
        }
        config = TelepServiceConfig(**data)
        assert config.unique_model_versions == set(["1.0", "1.1", "1.2", "1.3", "1.4", "1.5"])

    def test_get_config_name_from_version(self):
        assert self.config.get_config_name_from_version("v1.0") == "hybrid-model-config-v1p0"
        assert self.config.get_config_name_from_version("v2") == "hybrid-model-config-v2"
