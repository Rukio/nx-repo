# -*- coding: utf-8 -*-
from __future__ import annotations

import pytest
from on_scene.enums import ModelName


def test_model_name():
    assert ModelName.ON_SCENE.value == "ON_SCENE"
    with pytest.raises(AttributeError):
        _ = ModelName.ONSCENE
