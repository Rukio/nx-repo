# -*- coding: utf-8 -*-
from __future__ import annotations

import os
import pathlib
from abc import ABC
from abc import abstractmethod

from beartype import beartype
from beartype.typing import Any
from beartype.typing import Dict
from beartype.typing import Union
from model_utils.file_utils import LocalStorage
from statsig import statsig
from statsig.statsig_user import StatsigUser

STATSIG_DEFAULT_USER = "default-user"


@beartype
class BaseConfigReader(ABC):
    @abstractmethod
    def read(
        self,
        config_name: str,
    ) -> Dict[str, Any]:
        pass


@beartype
class StatsigConfigReader(BaseConfigReader):
    """Config reader class for configs on statsig."""

    def __init__(self):
        """Initialize a StatsigConfigReader object.

        This class facilitates reading configs from statsig. It requires the statsig secret key
        to be passed in

        # NOTE: assume statsig.initizialize has been called prior
        """

    def read(
        self,
        config_name: str,
        user: StatsigUser = StatsigUser(STATSIG_DEFAULT_USER),
    ) -> Dict[str, Any]:
        """Read a config from statsig.

        Parameters
        ----------
        config_name
            Name of config on statsig
        user
            Optional StatsigUser object for dynamically retrieving configs
            (e.g., if features are gated by user attributes).

        Returns
        -------
        A dict representing the dynamic config retrieved from statsig.

        Examples
        --------
        >>> reader = StatsigConfigReader()
        >>> reader.read('config-name')

        """
        config_json = statsig.get_config(user, config_name).get_value()
        return config_json


@beartype
class LocalConfigReader(BaseConfigReader):
    """A config reader class for reading configs from local filesystem."""

    def __init__(self, config_dir: Union[str, pathlib.Path]) -> None:
        """Instantiates a LocalConfigReader object.

        Parameters
        ----------
        config_dir
            Directory on local filesystem where all configs are stored.

        """
        if isinstance(config_dir, pathlib.Path):
            config_dir = config_dir.as_posix()
        self._config_dir = config_dir

    @property
    def config_dir(self):
        """Local directory where configs are stored."""
        return self._config_dir

    def read(self, config_name: str) -> Dict[str, Any]:
        """Read config from local filesystem.

        Parameters
        ----------
        config_name
            Relative path from self.config_dir of the config file. The file
            has to be in JSON format.

        Returns
        -------
        A dict representing the loaded config.

        Examples
        --------
        >>> reader = LocalConfigReader(config_dir='/path/to/configs')
        >>> reader.read('test_config.json')

        """
        config_path = os.path.join(self.config_dir, config_name)
        storage = LocalStorage()
        config_json = storage.load_json(config_path)

        return config_json
