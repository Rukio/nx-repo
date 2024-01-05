# -*- coding: utf-8 -*-
from __future__ import annotations

from enum import Enum

from beartype import beartype
from model_utils.enums import BaseModelName


@beartype
class ModelName(BaseModelName):
    """These define supported model names. Each enum's value becomes the model name in model registry."""

    IV = "IV"
    CATHETER = "CATHETER"
    RX_ADMIN = "RX_ADMIN"


@beartype
class ClinicalOverrideRule(Enum):
    """An enum class that maps rule name to function that applies the rule."""

    HEAD_INJURY = 1
    ABDOMINAL_PAIN = 2
    BLADDER_CATHETER_ISSUE = 3
    CONFUSION = 4
    FRACTURE = 5
    DIZZINESS = 6
    YOUNG_PATIENT = 7
    HEAD_INJURY_AGE_FIVE = 8
    BLOOD_IN_STOOL = 9
    BLOOD_SUGAR_CONCERNS = 10
    DIFFICULTY_URINATING = 11
    DOMESTIC_VIOLENCE_SEXUAL_ASSAULT = 12
    EXTREMITY_INJURY = 13
    GASTRIC_TUBE_ABNORMALITY = 14
    HALLUCINATIONS = 15
    LABORATORY_TEST_CONCERNS = 16
    LACERATION = 17
    NECK_BACK_SPINE_PAIN = 18
    PREGNANCY_GYNECOLOGICAL = 19
    NEUROLOGIC_COMPLAINT_NUMBNESS = 20
    OVERDOSE_POISONING = 21
    RISK_ASSESSMENT_BYPASS = 22
    RECTAL_PAIN = 23
    SEIZURE = 24
    SELF_HARM = 25
    SYNCOPE = 26
    TESTICULAR_PAIN = 27
    EPISTAXIS = 28
    NAUSEA = 29
    NOTES = 30
