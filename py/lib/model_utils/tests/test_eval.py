# -*- coding: utf-8 -*-
from __future__ import annotations

import numpy as np
import pytest
from model_utils.eval import EvalFunctions


def test_rmse(rng):
    y_true = rng.uniform(0, 100, size=1000)
    y_pred = rng.uniform(0, 100, size=1000)
    expected = np.sqrt(np.mean((y_true - y_pred) ** 2))
    assert pytest.approx(EvalFunctions.rmse(y_true, y_pred)) == expected
