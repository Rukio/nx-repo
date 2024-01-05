# -*- coding: utf-8 -*-
from __future__ import annotations

import logging

import pandas as pd
from beartype import beartype
from beartype.typing import Dict
from model_utils.errors import ConflictingRiskProtocolMappingError
from model_utils.errors import MissingRiskProtocolColumn


# These are the categorical values for risk protocol feature during training
# The goal is to reduce the cardinality of the risk protocol feature.
RISK_PROTOCOL_KEYWORDS = [
    "headache",
    "gastric",
    "self harm",
    "neuro",
    "gyne",
    "wound",
    "heart",
    "calling",
    "head injury",
    "abdominal",
    "laceration",
    "urin",
    "bite",
    "rect",
    "partner",
    "lab",
    "diarrhea",
    "hallucinat",
    "post",
    "burn",
    "nausea",
    "weakness",
    "home",
    "boarding",
    "assessment",
    "suicid",
    "cough",
    "wellness",
    "pacemaker",
    "rash",
    "rn",
    "cellulitis",
    "seizure",
    "hpotension",
    "covid",
    "overdose",
    "fever",
    "hypertension",
    "hypotension",
    "syncope",
    "dizz",
    "dental",
    "allerg",
    "advanced care",
    "chest",
    "stool",
    "flu",
    "numb",
    "leth",
    "follow",
    "extremity",
    "anxiety",
    "catheter",
    "testic",
    "leg",
    "ear",
    "ems",
    "hospice",
    "vision",
    "domestic",
    "breath",
    "general",
    "spine",
    "sugar",
    "dehy",
    "constip",
    "preg",
    "throat",
    "back",
    "fall",
    "sinus",
    "syncompe",
    "education",
    "nose",
    "confus",
    "palpitat",
]

# this merges a few categories
SUBSTRING_MAP = {
    "cough": "flu",
    "headache": "flu",
    "leth": "weakness",
    "post": "follow",
    "cellulitis": "rash",
    "leg": "extremity",
    "partner": "calling",
    "suicid": "self harm",
    "laceration": "wound",
}


@beartype
class RiskProtocolPreprocessor:
    """
    Handles risk protocol preprocessing.

    This handles risk protocol standardization & assign standardized risk
    protocols to broader categories defined in RISK_PROTOCOL_KEYWORDS.
    """

    def __init__(
        self,
        rp_map: Dict[str, str] = {},
        logger: logging.Logger = None,
    ) -> None:
        """Initializes a RiskProtocolPreprocessor object.

        Let's make sure all keys and values are in lower case so we don't have
        to worry about silly edge cases.

        Parameters
        ----------
        rp_map
            Mapping from raw risk protocol str to standardized risk protocol str.
        logger
            Python Logger

        Raises
        ------
        ConflictingRiskProtocolMappingError
            If two keys in rp_map are the same in lower case but they map to
            different values in lower case.

        """
        rp_map_lower = {}
        for key, value in rp_map.items():
            low_key = self.normalize_risk_protocol(key)
            low_value = self.normalize_risk_protocol(value)
            if low_key not in rp_map_lower:
                rp_map_lower[low_key] = low_value
            elif rp_map_lower[low_key] != low_value:
                raise ConflictingRiskProtocolMappingError(
                    f"Key {low_key} has more than one potential values '{rp_map_lower[low_key]}' and '{low_value}'."
                )
        self.rp_map = rp_map_lower

        if logger is None:
            logger = logging.getLogger()

        self.logger = logger

    def normalize_risk_protocol(self, risk_protocol: str) -> str:
        """Normalize raw risk protocol and deal with edge cases.

        Mostly we convert to lower cases and strip double quotes and spaces.

        Arguments
        ---------
        risk_protocol
            Input risk protocol value

        Returns
        -------
        Normalized risk protocol

        """
        return risk_protocol.lower().strip('" ')

    def map_to_std_risk_protocol(self, risk_protocol_raw: str) -> str:
        """Map raw risk protocol to standardized values.

        We will convert raw_risk_protocol to lower case before looking up
        standardized version.

        Parameters
        ----------
        risk_protocol_raw
            Raw risk protocol str (what comes in with the request).

        Returns
        -------
        A standardized (lower-case) risk protocol. If raw_risk_protocol is not
        found in self.rp_map, return itself (in lower case).

        """
        risk_protocol_input = self.normalize_risk_protocol(risk_protocol_raw)
        if risk_protocol_input not in self.rp_map:
            self.logger.warning(
                f"Risk protocol '{risk_protocol_raw}' is unknown to the mapping.",
                extra={
                    "risk_protocol": risk_protocol_raw,
                    "event_name": "unknown_risk_protocol",
                },
            )
        return self.rp_map.get(risk_protocol_input, risk_protocol_input)

    def map_df_from_raw_to_standardized(
        self, df: pd.DataFrame, input_col: str = "risk_protocol", output_col: str = "risk_protocol_std"
    ) -> pd.DataFrame:
        """Map raw risk protocol in df to standardized values.

        Arguments
        ---------
        df
            Input dataframe
        input_col
            Column containing raw risk protocol
        output_col
            Column name that will store standardized risk protocol

        Returns
        -------
        a dataframe with a new column for standardized risk protocol
        """
        if input_col not in df:
            raise MissingRiskProtocolColumn(f"Expected column with raw risk protocol '{input_col}' is missing.")
        df[output_col] = df[input_col].apply(self.map_to_std_risk_protocol)
        return df

    def map_to_risk_protocol_keyword(self, risk_protocol_std: str) -> str:
        """Map a standardized risk protocol to one of the defined keywords.

        The match happens this way:
        1. Find all keywords from RISK_PROTOCOL_KEYWORDS that matches any
           substring in risk_protocol_std;
        2. Choose the longest keyword that matches from step 1;
        3. If the longest keyword exists in the mapping SUBSTRING_MAP, then map
           them to a more general keyword.

        Parameters
        ----------
        risk_protocol_std
            Standardized risk protocol.

        Returns
        -------
        One of the categorical values for the risk protocol feature defined in
        RISK_PROTOCOL_KEYWORDS.

        """
        # convert risk_protocol_std to lower-case if not already done so
        risk_protocol_std = self.normalize_risk_protocol(risk_protocol_std)
        # find all keywords from RISK_PROTOCOL_KEYWORDS that exist in risk_protocol_std
        matches = [s for s in RISK_PROTOCOL_KEYWORDS if s in risk_protocol_std]
        if len(matches) > 0:
            # use the longest keyword as the best match
            best_match = max(matches, key=len)
            # for some keywords, map them to more generalized versions
            return SUBSTRING_MAP.get(best_match, best_match)
        else:
            return risk_protocol_std

    def map_df_from_standardized_to_keyword(
        self, df: pd.DataFrame, input_col: str = "risk_protocol_std", output_col="protocol_keyword"
    ) -> pd.DataFrame:
        """Map the standardized risk protocol in df to a keyword.

        Arguments
        ---------
        df
            Input dataframe
        input_col
            Column containing standardized risk protocol
        output_col
            Column name that will store risk protocol keywords

        Returns
        -------
        a dataframe with a new column for risk protocol keywords
        """
        if input_col not in df:
            raise MissingRiskProtocolColumn(
                f"Expected column with standardized risk protocol '{input_col}' is missing."
            )
        df[output_col] = df[input_col].apply(self.map_to_risk_protocol_keyword)
        return df

    def run(
        self, df: pd.DataFrame, input_col: str = "risk_protocol", output_col: str = "protocol_keyword"
    ) -> pd.DataFrame:
        """Standardize and map risk protocol in dataframe into keyword.

        This performs two steps:
        1. Maps raw risk protocol string to standardized risk protocol string;
        2. Converts standardized risk protocol string to one of the supported
           categories in SUBSTRINGS.

        Parameters
        ----------
        df
            Input dataframe whose "risk_protocol" column contains raw risk
            protocol strings.

        Returns
        -------
        A pd.DataFrame with two new columns: "risk_protocol_std" column has
        the standardized risk protocol, and "protocol_keyword" column has
        risk protocol keywords.

        """
        if input_col not in df.columns:
            raise MissingRiskProtocolColumn(f"Expected risk protocol column '{input_col}' is missing from dataframe.")

        df["risk_protocol_std"] = df[input_col].apply(lambda rp: self.map_to_std_risk_protocol(rp))
        df[output_col] = df["risk_protocol_std"].apply(lambda rp: self.map_to_risk_protocol_keyword(rp))

        return df
