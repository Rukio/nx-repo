# -*- coding: utf-8 -*-
from __future__ import annotations

import os

IGNORE_FILES = [".gitkeep", "README.md"]
AIVEN_API_TOKEN_NAME = "AIVEN_API_TOKEN"


def get_token() -> str:
    """Get the API token from the environment"""
    token = os.getenv(AIVEN_API_TOKEN_NAME)
    if not token:
        raise EnvironmentError(
            f"An API token is required at the environment variable '{AIVEN_API_TOKEN_NAME}'. "
            f"Please check your environment."
        )

    return token
