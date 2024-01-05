# -*- coding: utf-8 -*-
from __future__ import annotations

import numbers
import os
from dataclasses import dataclass

import botocore
from beartype import beartype
from beartype.typing import Any
from beartype.typing import Dict
from beartype.typing import List
from beartype.typing import Optional
from beartype.typing import Set
from beartype.typing import Union
from model_utils.model_config import MODEL_METADATA_FILE
from model_utils.model_config import ModelConfig
from pydantic import BaseModel
from pydantic import validator

from .enums import ClinicalOverrideRule
from .enums import ModelName
from .errors import BadConfigSchemaError
from .errors import InvalidClinicalOverrideRuleError
from .errors import InvalidOperator
from .errors import MarketNameError
from .errors import ModelNotFoundError

# we should only include those in Python's operator module for now
SUPPORTED_OPERATORS = frozenset(["lt", "le", "gt", "ge", "ne", "eq"])


@dataclass
@beartype
class MLRule:
    operator: str
    threshold: numbers.Number

    def __post_init__(self):
        if self.operator not in SUPPORTED_OPERATORS:
            raise InvalidOperator(f"operator '{self.operator}' is not supported.")
        try:
            self.threshold = float(self.threshold)
        except ValueError:
            raise BadConfigSchemaError(f"Cannot convert threshold '{self.threshold}' to a number.")


@beartype
def _model_name_enum_to_str(params: Dict[ModelName, Any]) -> Dict[str, Any]:
    """Convert ModelName enum to str.

    This is useful for TelepModelConfig.load_from_json(). In the loaded
    MarketConfig, the model names will be enums instead of strings.

    Parameters
    ----------
    params
        A section of TelepModelConfig where keys are ModelName enums.

    Returns
    -------
    A dict mapping model name string to values.
    """
    output = {}
    for model_name_enum in params:
        model_name_str = model_name_enum.name
        output[model_name_str] = params[model_name_enum]
    return output


@beartype
def _model_name_str_to_enum(params: Dict[str, Any]) -> Dict[ModelName, Any]:
    """Convert model name str to ModelName enum.

    This is useful for TelepModelConfig.dump_to_json(), where model name enums
    are written as strings in JSON.

    Parameters
    ----------
    params
        A section of TelepModelConfig where keys are model name strings.

    Returns
    -------
    A dict mapping ModelName enums to values.

    """
    output = {}
    for model_name_str in params:
        model_name_enum = getattr(ModelName, model_name_str)
        output[model_name_enum] = params[model_name_str]
    return output


@beartype
class TelepModelConfig:
    """Config for a single region/market of Tele-p ML service."""

    def __init__(
        self,
        name: str,
        model_registry_home: str,
        model_dirs: Dict[ModelName, str],
        clinical_overrides_risk_protocol: List[str],
        ml_rules: Dict[str, Dict[str, Union[str, float]]],
    ) -> None:
        """Instantiate a TelepModelConfig object.

        Parameters
        ----------
        name
            Name of this config
        model_registry_home
            Path to the home directory of model registry
        model_dirs
            Dict mapping model name *enum* to their directory (relative to model registry home)
        clinical_overrides_risk_protocol
            List of clinical override rule enums
        ml_rules
            Dict mapping model name to a rule that uses the score from this model. NOTE: it only supports one rule
            per model for now.

        """
        # set attributes
        self._name = name
        self._model_registry_home = model_registry_home
        self._model_dirs = model_dirs
        self._clinical_overrides_risk_protocol = clinical_overrides_risk_protocol
        self._ml_rules = ml_rules
        self._metadata_files = {}

        # form path to each model's metadata.json
        for model_name in self._model_dirs:
            self._metadata_files[model_name] = self._get_model_metadata_path(model_name)

        self._validate_config()

        # store clinical override rule enums
        self._clinical_overrides_enums = [
            self._get_clinical_override_rule_from_name(name) for name in self._clinical_overrides_risk_protocol
        ]

    @property
    def name(self):
        return self._name

    @property
    def model_registry_home(self):
        return self._model_registry_home

    @property
    def model_dirs(self):
        return self._model_dirs

    @property
    def clinical_overrides_risk_protocol(self):
        return self._clinical_overrides_risk_protocol

    @property
    def ml_rules(self):
        return self._ml_rules

    @property
    def metadata_files(self):
        return self._metadata_files

    @property
    def clinical_overrides_enums(self):
        return self._clinical_overrides_enums

    def _get_model_metadata_path(self, model_name: ModelName) -> str:
        """Get model metadata path.

        Parameters
        ----------
        model_name
            name of model

        Returns
        -------
        Absolute path to the metadata file

        """
        path = os.path.join(
            self.model_registry_home,
            self.model_dirs[model_name],
            MODEL_METADATA_FILE,
        )
        return path

    def load_model_config(self, model_name: ModelName, s3: Optional[botocore.client.BaseClient] = None) -> ModelConfig:
        """Load ModelConfig for one model."""
        if model_name not in self.model_dirs.keys():
            raise ModelNotFoundError(f"Model '{model_name}' not found in this market config.")
        return ModelConfig.load_from_model_registry(
            model_dir=os.path.join(self.model_registry_home, self.model_dirs[model_name]),
            model_name_class=ModelName,
            s3=s3,
        )

    @staticmethod
    def load_from_json(config_json: Dict[str, Any]):
        """Load and return an instance of TelepModelConfig from JSON-loaded config.

        Mostly this converts model_name in config_json (which are str) to ModelName enums before instantiating
        TelepModelConfig.

        Parameters
        ----------
        config_json
            Dict containing parameters loaded from JSON file

        Returns
        -------
        An instance of TelepModelConfig class.
        """
        converted_config_json = {}
        for key in config_json.keys():
            if key in ("model_dirs", "ml_rules"):
                converted_config_json[key] = _model_name_str_to_enum(config_json[key])
            else:
                converted_config_json[key] = config_json[key]

        return TelepModelConfig(**converted_config_json)

    def dump_to_json(self) -> Dict[str, Any]:
        """Dump itself to a JSON-compatible dict."""
        output = {}
        output["name"] = self.name
        output["model_registry_home"] = self.model_registry_home
        output["model_dirs"] = _model_name_enum_to_str(self.model_dirs)
        output["clinical_overrides_risk_protocol"] = self.clinical_overrides_risk_protocol
        output["ml_rules"] = _model_name_enum_to_str(self.ml_rules)

        return output

    def _get_clinical_override_rule_from_name(self, rule_name: str) -> ClinicalOverrideRule:
        """Get SupportedClinicalOverrideRule enum from rule name."""
        return getattr(ClinicalOverrideRule, rule_name.upper())

    def _validate_config(self) -> None:
        """Validate config schema and operators for each model.

        Beartype seems to only check the top-level container type but not the type within the container. For example,
        if an argument expects Dict[str, str], beartype throws an error if you pass a list, but not if you pass a
        Dict[str, float].
        """
        for model_name in self.model_dirs.keys():
            # model_dir
            if not isinstance(self.model_dirs[model_name], str):
                raise BadConfigSchemaError(f"model_dir for model {model_name} is not a str.")

            if model_name not in self._metadata_files:
                raise BadConfigSchemaError(f"Metadata file path is missing for model '{model_name}'.")

        for model_name, rule in self.ml_rules.items():
            # use dataclass to validate the types in rule
            _ = MLRule(**rule)

        for rule_name in self.clinical_overrides_risk_protocol:
            try:
                self._get_clinical_override_rule_from_name(rule_name)
            except AttributeError:
                raise InvalidClinicalOverrideRuleError(f"Clinical override rule '{rule_name}' is not supported.")


@beartype
def _validate_market_overrides(overrides: Dict[str, Union[str, List[str]]]) -> Dict[str, Union[str, List[str]]]:
    """Util function to validate market names."""
    for name in overrides.keys():
        if len(name) != 3:
            raise MarketNameError(f"Market name has to be 3-lettered short names but '{name}' is seen.")
    output: Dict[str, Union[str, List[str]]] = {}
    for k, v in overrides.items():
        if isinstance(v, str):
            output[k.lower()] = v.lower()
        else:
            # otherwise v is a list of model versions
            output[k.lower()] = [vv.lower() for vv in v]
    return output


class FactualModelConfigs(BaseModel):
    default: str
    market_overrides: Optional[Dict[str, str]] = {}

    @validator("market_overrides")
    def validate_market_overrides(cls, overrides: Dict[str, str]) -> Dict[str, str]:
        return _validate_market_overrides(overrides)


class ShadowModelConfigs(BaseModel):
    default: Optional[List[str]] = []
    market_overrides: Optional[Dict[str, List[str]]] = {}

    @validator("market_overrides")
    def validate_market_overrides(cls, overrides: Dict[str, List[str]]) -> Dict[str, List[str]]:
        return _validate_market_overrides(overrides)


class TelepServiceConfig(BaseModel):
    factual: FactualModelConfigs
    shadow: Optional[ShadowModelConfigs] = None

    @staticmethod
    def load_from_json(data: Dict[str, Dict[str, Union[str, List[str], Dict[str, List[str]]]]]) -> TelepServiceConfig:
        """Load data in JSON format

        Arguments
        ---------
        data
            Input data loaded from JSON string

        Returns
        -------
        A TelepServoceConfig instance.

        """
        factual = FactualModelConfigs(**data["factual"])
        shadow = None
        if "shadow" in data and len(data["shadow"]) > 0:
            shadow = ShadowModelConfigs(**data["shadow"])
        return TelepServiceConfig(factual=factual, shadow=shadow)

    def lookup_factual_version(self, market: str) -> str:
        """Look up factual model version for a given market.

        Arguments
        ---------
        market
            Input market (3-letter short name)

        Returns
        -------
        version
            Factual model version

        """
        if len(market) != 3:
            raise MarketNameError(f"Input market name '{market}' is not valid.")

        # always convert market to lower case before lookup
        market = market.lower()
        version = self.factual.market_overrides.get(market, None)

        return version if version is not None else self.factual.default

    def lookup_shadow_versions(self, market: str) -> List[str]:
        """Look up a list of shadow versions to run.

        Arguments
        ---------
        market
            Input market (3-letter short name)

        Returns
        -------
        versions
            List of model versions to run in shadow mode
        """
        if not self.shadow:
            return []

        if len(market) != 3:
            raise MarketNameError(f"Input market name '{market}' is not valid.")

        market = market.lower()
        versions = self.shadow.market_overrides.get(market, [])

        return versions if len(versions) != 0 else self.shadow.default

    def get_config_name_from_version(self, version: str) -> str:
        """Use a simple naming convention to get statsig dynamic config names.

        We might have dots in version, but we need to replace them with 'p'
        because statsig config names cannot have dots

        Arguments
        ---------
        version
            Version string (e.g., v1.0)

        Returns
        -------
        config_name
            Statsig config name from version string

        """

        config_name = f'hybrid-model-config-{version.replace(".", "p")}'
        return config_name

    @property
    def unique_model_versions(self) -> Set[str]:
        """Return a set of unique model versions included in the service config."""
        versions = set()

        # factuals
        versions.add(self.factual.default)
        versions = versions.union(self.factual.market_overrides.values())

        # shadow
        if self.shadow:
            versions = versions.union(self.shadow.default)
            for sv_list in self.shadow.market_overrides.values():
                versions = versions.union(sv_list)

        return versions
