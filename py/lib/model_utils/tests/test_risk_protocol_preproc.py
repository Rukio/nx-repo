# -*- coding: utf-8 -*-
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from model_utils.errors import MissingRiskProtocolColumn
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor


CUSTOM_ILLNESS = "something mysterious"
HEAD_INJURY = "head injury"


class TestRiskProtocolPreprocessor:
    def test__map_to_std_risk_protocol(self, risk_protocol_mapping):
        preprocessor = RiskProtocolPreprocessor(rp_map=risk_protocol_mapping)
        assert preprocessor.map_to_std_risk_protocol("Animal bite/Bite injury") == "animal bite"
        # no match in mapping returns itself
        assert preprocessor.map_to_std_risk_protocol("Advanced Care (Covid-19)") == "advanced care (covid-19)"

    def test__normalize_risk_protocol(self, risk_protocol_mapping):
        preprocessor = RiskProtocolPreprocessor(rp_map=risk_protocol_mapping)
        assert preprocessor.normalize_risk_protocol("Head Injury") == HEAD_INJURY
        assert preprocessor.normalize_risk_protocol(" Head Injury") == HEAD_INJURY
        assert preprocessor.normalize_risk_protocol(' "Head Injury "') == HEAD_INJURY
        assert preprocessor.normalize_risk_protocol('" Head Injury " ') == HEAD_INJURY

    def test_map_df_from_raw_to_standardized(self, risk_protocol_mapping):
        preprocessor = RiskProtocolPreprocessor(rp_map=risk_protocol_mapping)
        df = pd.DataFrame({"risk_protocol": ["Animal bite/Bite injury", "Advanced Care (Covid-19)"]})
        df_processed = preprocessor.map_df_from_raw_to_standardized(df)
        assert "risk_protocol_std" in df_processed.columns
        assert df_processed["risk_protocol_std"].iloc[0] == "animal bite"
        assert df_processed["risk_protocol_std"].iloc[1] == "advanced care (covid-19)"

        # test that the correct exception is raised with missing input column
        df = df.rename(columns={"risk_protocol": "risk_protocol_raw"})
        with pytest.raises(MissingRiskProtocolColumn):
            preprocessor.map_df_from_raw_to_standardized(df)

    def test__map_to_risk_protocol_keyword(self, risk_protocol_mapping):
        preprocessor = RiskProtocolPreprocessor(rp_map=risk_protocol_mapping)
        # single match
        assert preprocessor.map_to_risk_protocol_keyword("wound infection") == "wound"
        # multiple matches, pick the longest keyword (in # of characters)
        assert preprocessor.map_to_risk_protocol_keyword("headache and abdominal pain") == "abdominal"
        # zero match
        assert preprocessor.map_to_risk_protocol_keyword(CUSTOM_ILLNESS) == CUSTOM_ILLNESS
        assert preprocessor.map_to_risk_protocol_keyword("dizziness") == "dizz"
        assert preprocessor.map_to_risk_protocol_keyword("epistaxis (nose bleed)") == "nose"

    def test_map_df_from_standardized_to_keyword(self, risk_protocol_mapping):
        preprocessor = RiskProtocolPreprocessor(rp_map=risk_protocol_mapping)
        df = pd.DataFrame(
            {
                "risk_protocol_std": [
                    "wound infection",
                    "headache and abdominal pain",
                    CUSTOM_ILLNESS,
                    "dizziness",
                    "epistaxis (nose bleed)",
                ]
            }
        )
        df_processed = preprocessor.map_df_from_standardized_to_keyword(df)
        assert "protocol_keyword" in df_processed.columns
        assert df_processed["protocol_keyword"].iloc[0] == "wound"
        assert df_processed["protocol_keyword"].iloc[1] == "abdominal"
        assert df_processed["protocol_keyword"].iloc[2] == CUSTOM_ILLNESS
        assert df_processed["protocol_keyword"].iloc[3] == "dizz"
        assert df_processed["protocol_keyword"].iloc[4] == "nose"

        # test that the correct exception is raise with missing input column
        df = df.rename(columns={"risk_protocol_std": "risk_protocol_standard"})
        with pytest.raises(MissingRiskProtocolColumn):
            preprocessor.map_df_from_standardized_to_keyword(df)

    def test_run_df(self, risk_protocol_mapping, raw_features_rp):
        preprocessor = RiskProtocolPreprocessor(rp_map=risk_protocol_mapping)
        result = preprocessor.run(raw_features_rp)
        assert "protocol_keyword" in result.columns
        # test all input values are correctly standardized according to the mapping we store in test dir
        expected_rp_results = [
            ("Head Injury (Non Covid-19)", "head injury"),
            ("Abdominal Pain (Non Covid-19)", "abdominal"),
            ("Seizure (Non Covid-19)", "seizure"),
            ("Confusion (other)", "confus"),
            ("diarrhea", "diarrhea"),
        ]
        for raw_rp, std_rp in expected_rp_results:
            matched_rows = result.loc[raw_features_rp.risk_protocol == raw_rp]
            assert len(matched_rows) > 0
            assert np.all(matched_rows.protocol_keyword == std_rp.lower())

        # test that exception is raised if input column is missing
        df_bad = raw_features_rp.copy()
        df_bad = df_bad.rename(columns={"risk_protocol": "risk_protocol_raw"})
        with pytest.raises(MissingRiskProtocolColumn):
            preprocessor.run(df_bad)
