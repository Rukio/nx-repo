# -*- coding: utf-8 -*-
from __future__ import annotations

from copy import deepcopy

import pytest
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from telep.service.clinical_overrides import ClinicalOverrideRule
from telep.service.clinical_overrides import TelepClinicalOverrideMetadata
from telep.service.clinical_overrides import TelepClinicalOverrideNotesHelper
from telep.service.clinical_overrides import TelepClinicalOverrides

from proto.common import date_pb2 as date_proto
from proto.common import demographic_pb2 as demog_proto
from proto.ml_models.telep import service_pb2 as telep_proto


@pytest.fixture
def override(risk_protocol_mapping) -> TelepClinicalOverrides:
    preprocessor = RiskProtocolPreprocessor(risk_protocol_mapping)
    return TelepClinicalOverrides(preprocessor=preprocessor)


class TestClinicalOverrideMetadata:
    def test_is_market_enhanced(self):
        basic_market_vers_str = "basic-v1.2"
        enhanced_market_vers_str = "enhanced-v1.2"
        metadata = TelepClinicalOverrideMetadata(model_version=basic_market_vers_str)

        assert metadata.is_market_enhanced() is False

        metadata.model_version = enhanced_market_vers_str
        assert metadata.is_market_enhanced() is True


valid_notes_str1 = " tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\n"
valid_notes_str2 = "mOre.    stuff\there"

notes_ineligibility_test_case = [
    (  # base case + enhanced
        [],
        [],
        True,
        False,
    ),
    (  # base case + basic
        [],
        [],
        False,
        False,
    ),
    (  # valid case with messy text in dispatcher note, no banned words or phrases
        [valid_notes_str1, valid_notes_str2],
        [],
        False,
        False,
    ),
    (  # valid, only secondary screen text
        [],
        [valid_notes_str1, valid_notes_str2],
        False,
        False,
    ),
    (  # valid, text in both notes
        [valid_notes_str1],
        [valid_notes_str2],
        False,
        False,
    ),
    (  # invalid in secondary screen (only word) enhanced
        [valid_notes_str1],
        ["mOre.    stuff\there catheter"],
        True,
        True,
    ),
    (  # invalid in secondary screen (only phrase) enhanced
        [valid_notes_str1],
        ["mOre.    stuff\there\tanythi,ng dow:?n"],
        True,
        True,
    ),
    (  # invalid in secondary screen notes (both phrase and word exist) enhanced
        [valid_notes_str1],
        ["mOre.    stuff\there\ranything down catheter"],
        True,
        True,
    ),
    (  # invalid in dispatcher notes (only word) enhanced
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\ncatheter"],
        [valid_notes_str2],
        True,
        True,
    ),
    (  # invalid in dispatcher notes (only phrase) enhanced
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\nanything down"],
        [valid_notes_str2],
        True,
        True,
    ),
    (  # invalid in dispatcher notes (both phrase and word exist) enhanced
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\nanything down catheter"],
        [valid_notes_str2],
        True,
        True,
    ),
    (  # invalid in dispatcher notes (phrase), split between two list elements, enhanced
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\nanything", "down"],
        [valid_notes_str2],
        True,
        True,
    ),
    (  # valid, enhanced market with a  banned word from basic market
        [valid_notes_str1],
        ["mOre.    stuff\there migraine"],
        True,
        False,
    ),
    (  # invalid, basic market with a  banned word from basic market
        [valid_notes_str1],
        ["mOre.    stuff\there migraine"],
        False,
        True,
    ),
    (  # valid, enhanced market with a  banned phrase from basic market
        [valid_notes_str1],
        ["mOre.    stuff\there breathing treatment"],
        True,
        False,
    ),
    (  # invalid, basic market with a  banned phrase from basic market
        [valid_notes_str1],
        ["mOre.    stuff\there breathing treatment"],
        False,
        True,
    ),
]


class TestClinicalOverrides:
    def test_head_injury(
        self,
        override: TelepClinicalOverrides,
        default_proto: dict,
        default_request: telep_proto.GetEligibilityRequest,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.HEAD_INJURY, telep_clinical_override_metadata) is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "head injury"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.HEAD_INJURY, telep_clinical_override_metadata) is False
        )
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.HEAD_INJURY_AGE_FIVE, telep_clinical_override_metadata)
            is False
        )

        custom_proto2 = deepcopy(default_proto)
        custom_proto2["risk_protocol"] = "Head Injury"
        custom_proto2["patient_age"] = 1
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.HEAD_INJURY, telep_clinical_override_metadata) is True
        )
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.HEAD_INJURY_AGE_FIVE, telep_clinical_override_metadata)
            is True
        )

        # test at age 5; should be False
        custom_proto3 = deepcopy(custom_proto2)
        custom_proto3["patient_age"] = 5
        custom_request3 = telep_proto.GetEligibilityRequest(**custom_proto3)
        assert (
            override.apply(custom_request3, ClinicalOverrideRule.HEAD_INJURY, telep_clinical_override_metadata) is False
        )
        assert (
            override.apply(custom_request3, ClinicalOverrideRule.HEAD_INJURY_AGE_FIVE, telep_clinical_override_metadata)
            is False
        )

    def test_abdominal_pain(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.ABDOMINAL_PAIN, telep_clinical_override_metadata)
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Abdominal Pain (Non Covid-19)"
        custom_proto1["patient_age"] = 25
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.ABDOMINAL_PAIN, telep_clinical_override_metadata)
            is False
        )

        custom_proto2 = deepcopy(default_proto)
        custom_proto2["risk_protocol"] = "Constipation"
        custom_proto2["patient_age"] = 25
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.ABDOMINAL_PAIN, telep_clinical_override_metadata)
            is False
        )

        custom_proto3 = deepcopy(default_proto)
        custom_proto3["risk_protocol"] = "Abdominal Pain (Non Covid-19)"
        custom_proto3["patient_age"] = 65
        custom_request3 = telep_proto.GetEligibilityRequest(**custom_proto3)
        assert (
            override.apply(custom_request3, ClinicalOverrideRule.ABDOMINAL_PAIN, telep_clinical_override_metadata)
            is True
        )

    def test_bladder_catheter_issue(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(
                default_request, ClinicalOverrideRule.BLADDER_CATHETER_ISSUE, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Bladder Catheter Issue (Non Covid-19)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(
                custom_request1, ClinicalOverrideRule.BLADDER_CATHETER_ISSUE, telep_clinical_override_metadata
            )
            is True
        )

    def test_blood_in_stool(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.BLOOD_IN_STOOL, telep_clinical_override_metadata)
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Blood in Stool (Non Covid-19)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.BLOOD_IN_STOOL, telep_clinical_override_metadata)
            is True
        )

    def test_blood_sugar_concerns(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.BLOOD_SUGAR_CONCERNS, telep_clinical_override_metadata)
            is False
        )

        # default_request has age = 30
        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Blood sugar concerns"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.BLOOD_SUGAR_CONCERNS, telep_clinical_override_metadata)
            is False
        )

        # make a new request with age = 10
        custom_proto2 = deepcopy(custom_proto1)
        custom_proto2["patient_age"] = 10
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.BLOOD_SUGAR_CONCERNS, telep_clinical_override_metadata)
            is True
        )

    def test_confusion(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert override.apply(default_request, ClinicalOverrideRule.CONFUSION, telep_clinical_override_metadata) is True

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Confusion (Non Covid-19)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.CONFUSION, telep_clinical_override_metadata) is True

        custom_proto2 = deepcopy(custom_proto1)
        custom_proto2["risk_protocol"] = "Blood Sugar Concerns"
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.CONFUSION, telep_clinical_override_metadata) is False
        )

    def test_difficulty_urinating(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.DIFFICULTY_URINATING, telep_clinical_override_metadata)
            is False
        )

        # default_request has age = 30
        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Difficulty, pain or blood with urination"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.DIFFICULTY_URINATING, telep_clinical_override_metadata)
            is False
        )

        # make a new request with age = 4
        custom_proto2 = deepcopy(custom_proto1)
        custom_proto2["patient_age"] = 4
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.DIFFICULTY_URINATING, telep_clinical_override_metadata)
            is True
        )

    def test_fracture(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert override.apply(default_request, ClinicalOverrideRule.FRACTURE, telep_clinical_override_metadata) is False

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Extremity Injury/Pain"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.FRACTURE, telep_clinical_override_metadata) is True

        custom_proto2 = deepcopy(default_proto)
        custom_proto2["risk_protocol"] = "Fracture"
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert override.apply(custom_request2, ClinicalOverrideRule.FRACTURE, telep_clinical_override_metadata) is False

    def test_dizziness(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.DIZZINESS, telep_clinical_override_metadata) is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Dizziness"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.DIZZINESS, telep_clinical_override_metadata) is True

        custom_proto2 = deepcopy(default_proto)
        custom_proto2["risk_protocol"] = " Dizziness"
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert override.apply(custom_request2, ClinicalOverrideRule.DIZZINESS, telep_clinical_override_metadata) is True

    def test_domestic_violence_sexual_assault(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(
                default_request, ClinicalOverrideRule.DOMESTIC_VIOLENCE_SEXUAL_ASSAULT, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Domestic Violence / Sexual Assault"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(
                custom_request1, ClinicalOverrideRule.DOMESTIC_VIOLENCE_SEXUAL_ASSAULT, telep_clinical_override_metadata
            )
            is True
        )

    def test_extremity_injury(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.EXTREMITY_INJURY, telep_clinical_override_metadata)
            is False
        )

        # default age is 30, which should still evaluates to False
        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Extremity Injury/Pain (includes hip pain)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.EXTREMITY_INJURY, telep_clinical_override_metadata)
            is False
        )

        # test at age = 5; should still be, telep_clinical_override_metadata: TelepClinicalOverrideMetadata, False
        custom_proto2 = deepcopy(custom_proto1)
        custom_proto2["patient_age"] = 5
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.EXTREMITY_INJURY, telep_clinical_override_metadata)
            is False
        )

        # test at age = 4; should be true, telep_clinical_override_metadata: TelepClinicalOverrideMetadata, now
        custom_proto3 = deepcopy(custom_proto1)
        custom_proto3["patient_age"] = 4
        custom_request3 = telep_proto.GetEligibilityRequest(**custom_proto3)
        assert (
            override.apply(custom_request3, ClinicalOverrideRule.EXTREMITY_INJURY, telep_clinical_override_metadata)
            is True
        )

    def test_gastric_tube_abnormality(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(
                default_request, ClinicalOverrideRule.GASTRIC_TUBE_ABNORMALITY, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Gastric tube abnormality (G-tube)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(
                custom_request1, ClinicalOverrideRule.GASTRIC_TUBE_ABNORMALITY, telep_clinical_override_metadata
            )
            is True
        )

    def test_hallucinations(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.HALLUCINATIONS, telep_clinical_override_metadata)
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Hallucinations (Non Covid-19)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.HALLUCINATIONS, telep_clinical_override_metadata)
            is True
        )

    def test_laboratory_test_concerns(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(
                default_request, ClinicalOverrideRule.LABORATORY_TEST_CONCERNS, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Laboratory test concern (Non Covid-19)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(
                custom_request1, ClinicalOverrideRule.LABORATORY_TEST_CONCERNS, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto2 = deepcopy(custom_proto1)
        custom_proto2["patient_age"] = 10
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(
                custom_request2, ClinicalOverrideRule.LABORATORY_TEST_CONCERNS, telep_clinical_override_metadata
            )
            is True
        )

    def test_laceration(
        self, override, default_proto, default_request, telep_clinical_override_metadata: TelepClinicalOverrideMetadata
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.LACERATION, telep_clinical_override_metadata) is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Laceration (Non Covid-19)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.LACERATION, telep_clinical_override_metadata) is True
        )

    def test_neck_back_spine_pain(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.NECK_BACK_SPINE_PAIN, telep_clinical_override_metadata)
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Neck / Back / Spine pain"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.NECK_BACK_SPINE_PAIN, telep_clinical_override_metadata)
            is False
        )

        custom_proto2 = deepcopy(custom_proto1)
        custom_proto2["patient_age"] = 4
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.NECK_BACK_SPINE_PAIN, telep_clinical_override_metadata)
            is True
        )

    def test_pregnancy_gynecological(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(
                default_request, ClinicalOverrideRule.PREGNANCY_GYNECOLOGICAL, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = '"Pregnancy / Gynecological issues (Vaginal pain, bleeding or discharge)"'
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(
                custom_request1, ClinicalOverrideRule.PREGNANCY_GYNECOLOGICAL, telep_clinical_override_metadata
            )
            is True
        )

    def test_neurologic_complaint_numbness(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(
                default_request, ClinicalOverrideRule.NEUROLOGIC_COMPLAINT_NUMBNESS, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = '"Neurologic, Neuro (nervous system) complaint"'
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(
                custom_request1, ClinicalOverrideRule.NEUROLOGIC_COMPLAINT_NUMBNESS, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto2 = deepcopy(custom_proto1)
        custom_proto2["patient_age"] = 4
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(
                custom_request2, ClinicalOverrideRule.NEUROLOGIC_COMPLAINT_NUMBNESS, telep_clinical_override_metadata
            )
            is True
        )

    def test_overdose_poisoning(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.OVERDOSE_POISONING, telep_clinical_override_metadata)
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Overdose poisoning"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.OVERDOSE_POISONING, telep_clinical_override_metadata)
            is True
        )

    def test_risk_assessment_bypass(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(
                default_request, ClinicalOverrideRule.RISK_ASSESSMENT_BYPASS, telep_clinical_override_metadata
            )
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        risk_protocol1 = (
            '"Partner using Nationally Accredited Risk Stratification process '
            + '(formerly: R.C.C. (Resource Coordination Center) - Optum Las Vegas, NV)"'
        )
        custom_proto1["risk_protocol"] = risk_protocol1
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(
                custom_request1, ClinicalOverrideRule.RISK_ASSESSMENT_BYPASS, telep_clinical_override_metadata
            )
            is True
        )

        custom_proto2 = deepcopy(default_proto)
        risk_protocol2 = (
            '"Partner using Schmitt-Thompson protocols '
            + '(formerly R.C.C. - Resource Coordination Center - Optum Las Vegas, NV)"'
        )
        custom_proto2["risk_protocol"] = risk_protocol2
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(
                custom_request2, ClinicalOverrideRule.RISK_ASSESSMENT_BYPASS, telep_clinical_override_metadata
            )
            is True
        )

    def test_rectal_pain(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.RECTAL_PAIN, telep_clinical_override_metadata) is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Rectal pain"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.RECTAL_PAIN, telep_clinical_override_metadata) is True
        )

    def test_seizure(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert override.apply(default_request, ClinicalOverrideRule.SEIZURE, telep_clinical_override_metadata) is False

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Seizure (Non Covid-19)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.SEIZURE, telep_clinical_override_metadata) is True

    def test_self_harm(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.SELF_HARM, telep_clinical_override_metadata) is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = '"Self harm, suicidal thoughts"'
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.SELF_HARM, telep_clinical_override_metadata) is True

    def test_syncope(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert override.apply(default_request, ClinicalOverrideRule.SYNCOPE, telep_clinical_override_metadata) is False

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = '"Syncope, fainting, passing-out"'
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.SYNCOPE, telep_clinical_override_metadata) is True

    def test_testicular_pain(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.TESTICULAR_PAIN, telep_clinical_override_metadata)
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Testicular pain or swelling"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.TESTICULAR_PAIN, telep_clinical_override_metadata)
            is True
        )

    def test_young_patient(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.YOUNG_PATIENT, telep_clinical_override_metadata)
            is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["patient_age"] = 1
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert (
            override.apply(custom_request1, ClinicalOverrideRule.YOUNG_PATIENT, telep_clinical_override_metadata)
            is True
        )

        custom_proto2 = deepcopy(default_proto)
        custom_proto2["patient_age"] = 2
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert (
            override.apply(custom_request2, ClinicalOverrideRule.DIZZINESS, telep_clinical_override_metadata) is False
        )

    def test_epistaxis(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert (
            override.apply(default_request, ClinicalOverrideRule.EPISTAXIS, telep_clinical_override_metadata) is False
        )

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Epistaxis (nose bleed)"
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.EPISTAXIS, telep_clinical_override_metadata) is True

    def test_nausea(
        self,
        override,
        default_proto,
        default_request,
        telep_clinical_override_metadata: TelepClinicalOverrideMetadata,
    ):
        assert override.apply(default_request, ClinicalOverrideRule.NAUSEA, telep_clinical_override_metadata) is False

        custom_proto1 = deepcopy(default_proto)
        custom_proto1["risk_protocol"] = "Nausea/Vomitting"
        custom_proto1["patient_age"] = 25
        custom_request1 = telep_proto.GetEligibilityRequest(**custom_proto1)
        assert override.apply(custom_request1, ClinicalOverrideRule.NAUSEA, telep_clinical_override_metadata) is False

        custom_proto2 = deepcopy(default_proto)
        custom_proto2["risk_protocol"] = "Diarrhea"
        custom_proto2["patient_age"] = 25
        custom_request2 = telep_proto.GetEligibilityRequest(**custom_proto2)
        assert override.apply(custom_request2, ClinicalOverrideRule.NAUSEA, telep_clinical_override_metadata) is False

        custom_proto3 = deepcopy(default_proto)
        custom_proto3["risk_protocol"] = "Diarrhea"
        custom_proto3["patient_age"] = 65
        custom_request3 = telep_proto.GetEligibilityRequest(**custom_proto3)
        assert override.apply(custom_request3, ClinicalOverrideRule.NAUSEA, telep_clinical_override_metadata) is True

    @pytest.mark.parametrize(
        "input_dispatcher_notes, input_secondary_screening_notes, is_enhanced_market, exp_response",
        notes_ineligibility_test_case,
    )
    def test_notes(
        self,
        override: TelepClinicalOverrides,
        input_dispatcher_notes,
        input_secondary_screening_notes,
        is_enhanced_market,
        exp_response,
    ):
        req_proto, metadata = helper_create_get_elegibility_proto_and_metadata(
            dispatcher_notes=input_dispatcher_notes,
            secondary_screening_notes=input_secondary_screening_notes,
            is_enhanced_market=is_enhanced_market,
        )
        act_resp = override.apply(request=req_proto, rule=ClinicalOverrideRule.NOTES, metadata=metadata)
        assert act_resp == exp_response


def helper_create_get_elegibility_proto_and_metadata(
    dispatcher_notes: list[str], secondary_screening_notes: list[str], is_enhanced_market: bool
) -> tuple[telep_proto.GetEligibilityRequest, TelepClinicalOverrideMetadata]:
    proto_dict = {
        "risk_protocol": "confusion",
        "patient_age": 30,
        "risk_score": 10,
        "place_of_service": "A",
        "market_name": "DEN",
        "timestamp": date_proto.DateTime(year=2023, month=1, day=3),
        "gender": demog_proto.Sex.SEX_FEMALE,
        "care_request_id": 12345,
        "dispatcher_notes": dispatcher_notes,
        "secondary_screening_notes": secondary_screening_notes,
    }
    model_version = "basic-v0.0"
    if is_enhanced_market:
        model_version = "enhanced-v0.0"

    metadata = TelepClinicalOverrideMetadata(model_version=model_version)
    return telep_proto.GetEligibilityRequest(**proto_dict), metadata


exp_clean_and_aggregate_line1 = "three trees exist in the forest more stuff here"
clean_and_aggregate_test_cases = [
    (  # base case
        [],
        [],
        set([]),
        "",
    ),
    (  # example with words with capitol letters, punctuation, spacing weirdness
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\n"],
        [],
        set(["three", "trees", "exist", "in", "the", "forest"]),
        "three trees exist in the forest",
    ),
    (  # all text weirdness split between two elements in dispatcher notes
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\n\r", valid_notes_str2],
        [],
        set(["three", "trees", "exist", "in", "the", "forest", "more", "stuff", "here"]),
        exp_clean_and_aggregate_line1,
    ),
    (  # no dispatcher_notes, only secondary_screening_notes with all weirdness
        [],
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\n\t", valid_notes_str2],
        set(["three", "trees", "exist", "in", "the", "forest", "more", "stuff", "here"]),
        exp_clean_and_aggregate_line1,
    ),
    (  # all text weirdness split between dispatcher note and secondary screening note
        [" tH'ree tr.Ees\r   eX,.ist iN  THE f:orest\t\n\n"],
        [valid_notes_str2],
        set(["three", "trees", "exist", "in", "the", "forest", "more", "stuff", "here"]),
        exp_clean_and_aggregate_line1,
    ),
]


class TestTelepClinicalOverrideNotesHelper:
    notes_helper = TelepClinicalOverrideNotesHelper()

    @pytest.mark.parametrize(
        "input_dispatcher_notes, input_secondary_screening_notes, expected_word_set, expected_line_concat",
        clean_and_aggregate_test_cases,
    )
    def test_clean_and_aggregate_notes(
        self, input_dispatcher_notes, input_secondary_screening_notes, expected_word_set, expected_line_concat
    ):
        # verify the spacing is fixed, the punctuation is removed,
        # everything is lower cased, spaces removed from start and end
        # and lines are concatenated between lines

        act_line_concat, act_word_set = self.notes_helper.clean_and_aggregate_notes(
            dispatcher_notes=input_dispatcher_notes, secondary_screening_notes=input_secondary_screening_notes
        )
        assert act_word_set == expected_word_set
        assert act_line_concat == expected_line_concat

    @pytest.mark.parametrize(
        "input_dispatcher_notes, input_secondary_screening_notes, is_enhanced_market, exp_response",
        notes_ineligibility_test_case,
    )
    def test_notes_ineligibility(
        self, input_dispatcher_notes, input_secondary_screening_notes, is_enhanced_market, exp_response
    ):
        req_proto, metadata = helper_create_get_elegibility_proto_and_metadata(
            dispatcher_notes=input_dispatcher_notes,
            secondary_screening_notes=input_secondary_screening_notes,
            is_enhanced_market=is_enhanced_market,
        )
        act_resp = self.notes_helper.notes_ineligiblity(request=req_proto, metadata=metadata)
        assert act_resp == exp_response
