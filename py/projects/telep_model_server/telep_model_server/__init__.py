# -*- coding: utf-8 -*-
from __future__ import annotations

__version__ = "0.1.0"

from telep_model_server.server import TelepService, serve, SERVICE_CONFIG_NAME_V1, SERVICE_CONFIG_NAME_V2

__all__ = ["TelepService", "serve", "SERVICE_CONFIG_NAME_V1", "SERVICE_CONFIG_NAME_V2"]
