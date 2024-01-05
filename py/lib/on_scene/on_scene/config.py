# -*- coding: utf-8 -*-
from __future__ import annotations

from pydantic import BaseModel


class OnSceneModelConfig(BaseModel):
    model_name: str
    model_version: str
    description: str
    prediction_adjustment: int
    minimum_on_scene_time: int


class OnSceneModelServiceConfig(BaseModel):
    factual_model_version: str
    shadow_model_versions: list[str] = []
