# -*- coding: utf-8 -*-
from __future__ import annotations

import itertools
import string
from dataclasses import dataclass

from beartype import beartype
from model_utils.risk_protocol_preproc import RiskProtocolPreprocessor
from telep.config.enums import ClinicalOverrideRule

from proto.ml_models.telep.service_pb2 import GetEligibilityRequest


ENHANCED_MODEL_VERS_STR = "enhanced"


@dataclass
class TelepClinicalOverrideMetadata:
    """Class for metadata passed into overrides"""

    model_version: str

    def is_market_enhanced(self) -> bool:
        """Is the current request for an enhanced market or not"""
        return ENHANCED_MODEL_VERS_STR == self.model_version.split("-")[0].lower()


class TelepClinicalOverrideNotesHelper:
    """Class that has helper funcs + caches needed for note parsing"""

    def __init__(self):
        # NOTE: prior to adding to these lists, lowcase + remove punctuation
        self._all_market_hybrid_ineligible_words = set(
            [
                "abscess",
                "anus",
                "boil",
                "boils",
                "breast",
                "butt",
                "cath",
                "catheter",
                "colostomy",
                "constipation",
                "disimpaction",
                "enema",
                "foley",
                "groin",
                "hemorrhoids",
                "impacted",
                "indwelling",
                "nephrostomy",
                "ostomy",
                "penile",
                "penis",
                "piles",
                "rectal",
                "rectum",
                "sacrum",
                "sediment",
                "staples",
                "stitches",
                "suprapubic",
                "suture",
                "sutures",
                "tailbone",
                "testicle",
                "testicular",
                "tracheostomy",
                "ulcer",
                "ulcers",
                "wound",
            ]
        )
        self._all_markets_hybrid_ineligible_phrases = set(
            [
                "anything down",
                "feeding tube",
            ]
        )

        self._basic_markets_only_hybrid_inelegible_words = set(
            [
                "albuterol",
                "croup",
                "dehydrated",
                "fluid",
                "fluids",
                "lasix",
                "migraine",
                "nebulizer",
                "wheezing",
            ]
        )

        self._basic_markets_only_hybrid_ineligible_phrases = set(
            [
                "breathing treatment",
                "breathing treatments",
                "request medication",
                "request medications",
            ]
        )

        # the canonical sets needed for all or basic markets
        self.all_market_hybrid_ineligible_words = self._all_market_hybrid_ineligible_words
        self.all_markets_hybrid_ineligible_phrases = self._all_markets_hybrid_ineligible_phrases
        self.basic_markets_hybrid_ineligible_words = (
            self.all_market_hybrid_ineligible_words | self._basic_markets_only_hybrid_inelegible_words
        )
        self.basic_markets_hybrid_ineligible_phrases = (
            self.all_markets_hybrid_ineligible_phrases | self._basic_markets_only_hybrid_ineligible_phrases
        )

        self._punctuation_removal_translation_table = str.maketrans("", "", string.punctuation)

    def clean_and_aggregate_notes(
        self, dispatcher_notes: list[str], secondary_screening_notes: list[str]
    ) -> tuple[str, set[str]]:
        """create a list and set:
        - join all notes together,lowcase + remove punctuation, each element is a line
        - same as above but split whitespace; each element is a word
        """
        all_notes_concat = ""
        all_notes_words = set()
        for note in itertools.chain(dispatcher_notes, secondary_screening_notes):
            clean_note_line = note.lower().translate(self._punctuation_removal_translation_table)
            words_only = clean_note_line.split()
            all_notes_words.update(words_only)

            all_notes_concat += " " + " ".join(words_only)
        # we always add an empty st
        return all_notes_concat[1:], all_notes_words

    def notes_ineligiblity(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        # determine if all markets or basic market sets are needed
        # since we want to exclude more where the provider isn't trained/allowed,
        # the basic is a super set of all + basic market only words
        word_ineligible_set = self.basic_markets_hybrid_ineligible_words
        phrases_ineligible_set = self.basic_markets_hybrid_ineligible_phrases

        if metadata.is_market_enhanced():
            word_ineligible_set = self.all_market_hybrid_ineligible_words
            phrases_ineligible_set = self.all_markets_hybrid_ineligible_phrases

        all_notes_concat, all_notes_words = self.clean_and_aggregate_notes(
            dispatcher_notes=request.dispatcher_notes, secondary_screening_notes=request.secondary_screening_notes
        )

        # check if any of the words overlap
        if not all_notes_words.isdisjoint(word_ineligible_set):
            return True

        # phrase search
        for inelgible_phrase in phrases_ineligible_set:
            if inelgible_phrase in all_notes_concat:
                return True

        return False


@beartype
class TelepClinicalOverrides:
    def __init__(self, preprocessor: RiskProtocolPreprocessor):
        """Defines methods that implement each clinical override rule.

        In general, if a rule evaluates to TRUE, that means the care request
        will be DISQUALIFIED for hybrid visit.
        """
        self._preprocessor = preprocessor
        # maps rule to the method that implements it
        self._rules_map = {
            ClinicalOverrideRule.HEAD_INJURY: self._head_injury,
            ClinicalOverrideRule.ABDOMINAL_PAIN: self._abdominal_pain,
            ClinicalOverrideRule.BLADDER_CATHETER_ISSUE: self._bladder_catheter_issue,
            ClinicalOverrideRule.CONFUSION: self._confusion,
            ClinicalOverrideRule.FRACTURE: self._fracture,
            ClinicalOverrideRule.DIZZINESS: self._dizziness,
            ClinicalOverrideRule.YOUNG_PATIENT: self._young_patient,
            ClinicalOverrideRule.HEAD_INJURY_AGE_FIVE: self._head_injury_age_five,
            ClinicalOverrideRule.BLOOD_IN_STOOL: self._blood_in_stool,
            ClinicalOverrideRule.BLOOD_SUGAR_CONCERNS: self._blood_sugar_concerns,
            ClinicalOverrideRule.DIFFICULTY_URINATING: self._difficulty_urinating,
            ClinicalOverrideRule.DOMESTIC_VIOLENCE_SEXUAL_ASSAULT: self._domestic_violence_sexual_assault,
            ClinicalOverrideRule.EXTREMITY_INJURY: self._extremity_injury,
            ClinicalOverrideRule.GASTRIC_TUBE_ABNORMALITY: self._gastric_tube_abnormality,
            ClinicalOverrideRule.HALLUCINATIONS: self._hallucinations,
            ClinicalOverrideRule.LABORATORY_TEST_CONCERNS: self._laboratory_test_concerns,
            ClinicalOverrideRule.LACERATION: self._laceration,
            ClinicalOverrideRule.NECK_BACK_SPINE_PAIN: self._neck_back_spine_pain,
            ClinicalOverrideRule.PREGNANCY_GYNECOLOGICAL: self._pregnancy_gynecological,
            ClinicalOverrideRule.NEUROLOGIC_COMPLAINT_NUMBNESS: self._neurologic_complaint_numbness,
            ClinicalOverrideRule.OVERDOSE_POISONING: self._overdose_poisoning,
            ClinicalOverrideRule.RISK_ASSESSMENT_BYPASS: self._risk_assessment_bypass,
            ClinicalOverrideRule.RECTAL_PAIN: self._rectal_pain,
            ClinicalOverrideRule.SEIZURE: self._seizure,
            ClinicalOverrideRule.SELF_HARM: self._self_harm,
            ClinicalOverrideRule.SYNCOPE: self._syncope,
            ClinicalOverrideRule.TESTICULAR_PAIN: self._testicular_pain,
            ClinicalOverrideRule.EPISTAXIS: self._epistaxis,
            ClinicalOverrideRule.NAUSEA: self._nausea,
            ClinicalOverrideRule.NOTES: self._notes,
        }
        self._notes_helper = TelepClinicalOverrideNotesHelper()

    def apply(
        self, request: GetEligibilityRequest, rule: ClinicalOverrideRule, metadata: TelepClinicalOverrideMetadata
    ) -> bool:
        """Apply a single clinical override rule on request data.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.
        rule
            The clinical rule to be evaluated. Must be one of the
            supported rules.

        Returns
        -------
        True if it matches the clinical rule, otherwise False. True means
        the ML predictions will be overridden by this clinical rule and will
        NOT be eligible for hybrid visits.

        Examples
        --------
        >>> override = TelepClinicalOverrides()
        >>> override.apply(request, ClinicalOverrideRule.HEAD_INJURY)

        """
        result = self._rules_map[rule](request, metadata)
        return result

    def _head_injury(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out head injury for age <= 2 (used in pilot run).

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.

        Returns
        -------
        True if request data matches this rule, otherwise False.

        """
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "head injury" and request.patient_age <= 2:
            return True
        return False

    def _head_injury_age_five(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Head injury for age < 5."""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "head injury" and request.patient_age < 5:
            return True
        return False

    def _abdominal_pain(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for abdominal pain.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.

        Returns
        -------
        True if request data matches this rule, otherwise False.

        """
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "abdominal pain / constipation" and request.patient_age >= 65:
            return True
        return False

    def _bladder_catheter_issue(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for bladder catheter issue.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.

        Returns
        -------
        True if request data matches this rule, otherwise False.

        """
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "bladder catheter issue":
            return True
        return False

    def _blood_in_stool(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Blood in stool"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Blood in Stool".lower():
            return True
        return False

    def _blood_sugar_concerns(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Blood sugar concerns for age < 12"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Blood sugar concerns".lower() and request.patient_age < 12:
            return True
        return False

    def _confusion(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for confusion.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.

        Returns
        -------
        True if request data matches this rule, otherwise False.

        """
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "confusion":
            return True
        return False

    def _difficulty_urinating(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Difficulty urinating for age < 5"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Difficulty Urinating".lower() and request.patient_age < 5:
            return True
        return False

    def _fracture(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for fractures.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.

        Returns
        -------
        True if request data matches this rule, otherwise False.

        """
        if request.risk_protocol.lower().strip() == "Extremity Injury/Pain".lower():
            return True
        return False

    def _dizziness(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for dizziness/vertigo.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.

        Returns
        -------
        True if request data matches this rule, otherwise False.

        """
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "dizziness":
            return True
        return False

    def _domestic_violence_sexual_assault(
        self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata
    ) -> bool:
        """Rule out Domestic violence & sexual assault."""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Domestic Violence / Sexual Assault".lower():
            return True
        return False

    def _extremity_injury(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Extremity injury."""
        if (
            self._preprocessor.normalize_risk_protocol(request.risk_protocol)
            == "Extremity Injury/Pain (includes hip pain)".lower()
            and request.patient_age < 5
        ):
            return True
        return False

    def _gastric_tube_abnormality(
        self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata
    ) -> bool:
        """Rule out Gastric tube abnormality (G-tube)"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Gastric tube abnormality (G-tube)".lower():
            return True
        return False

    def _hallucinations(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Hallucinations"""
        if "hallucination" in request.risk_protocol.lower():
            return True
        return False

    def _laboratory_test_concerns(
        self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata
    ) -> bool:
        """Rule out lab test concerns for age < 12"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Laboratory test concern".lower() and request.patient_age < 12:
            return True
        return False

    def _laceration(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Laceration"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Laceration".lower():
            return True
        return False

    def _neck_back_spine_pain(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Neck / back / spine pain for age < 5"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Neck / Back / Spine pain".lower() and request.patient_age < 5:
            return True
        return False

    def _pregnancy_gynecological(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out Pregnancy & Gynecological issues"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Pregnancy / Gynecological".lower():
            return True
        return False

    def _neurologic_complaint_numbness(
        self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata
    ) -> bool:
        """Rule out neurologic complaints and numbness for age < 5"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Neurologic complaint / Numbness".lower() and request.patient_age < 5:
            return True
        return False

    def _overdose_poisoning(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out overdose poisoning"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Overdose poisoning".lower():
            return True
        return False

    def _risk_assessment_bypass(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out partners using nationally accredited or Schmitt-Thompson protocol"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if "nationally accredited" in risk_protocol_std or "schmitt-thompson" in risk_protocol_std:
            return True
        return False

    def _rectal_pain(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out rectal pain"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Rectal pain".lower():
            return True
        return False

    def _seizure(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out seizure"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Seizure".lower():
            return True
        return False

    def _self_harm(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out self harm & suicidal thoughts"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Self harm".lower():
            return True
        return False

    def _syncope(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out syncope / faining / passing out for age < 5"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Syncope (passing out)".lower():
            return True
        return False

    def _testicular_pain(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Rule out testicular pain"""
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Testicular pain".lower():
            return True
        return False

    def _young_patient(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for patients younger than 2.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.
        metadata
            Metadata associated with the model, essentially data needed thats not in the request

        Returns
        -------
        True if request data matches this rule, otherwise False.
        """
        if request.patient_age < 2:
            return True
        return False

    def _epistaxis(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for epistaxis/nose bleed.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.
        metadata
            Metadata associated with the model, essentially data needed thats not in the request

        Returns
        -------
        True if request data matches this rule, otherwise False.
        """
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Epistaxis (nose bleed)".lower():
            return True
        return False

    def _nausea(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Clinical override for nausea / vomitting / diarrhea.

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.
        metadata
            Metadata associated with the model, essentially data needed thats not in the request

        Returns
        -------
        True if request data matches this rule, otherwise False.
        """
        risk_protocol_std = self._preprocessor.map_to_std_risk_protocol(request.risk_protocol)
        if risk_protocol_std == "Nausea / Vomiting / Diarrhea".lower() and request.patient_age >= 65:
            return True
        return False

    def _notes(self, request: GetEligibilityRequest, metadata: TelepClinicalOverrideMetadata) -> bool:
        """Parse notes for a ineligible strings + phrases. Returns true if inelgible

        Parameters
        ----------
        request
            Incoming request for hybrid eligibility.


        Returns
        -------
        True if request data matches this rule, otherwise False.
        """

        return self._notes_helper.notes_ineligiblity(request=request, metadata=metadata)
