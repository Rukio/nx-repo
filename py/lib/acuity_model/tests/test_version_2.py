# -*- coding: utf-8 -*-
from __future__ import annotations

from unittest.mock import call
from unittest.mock import Mock
from unittest.mock import patch

import pytest
from acuity_model import utils
from acuity_model import version_2
from acuity_model.base_model import BaseModel

from proto.common import risk_strat_pb2 as risk_strat_proto
from proto.ml_models.acuity import service_pb2 as acuity_proto

# test_data is used in parameterized testing of the model.
# the data is 1-1 translation of the acuities.csv file, with the caveat that
# since the acuities.csv has 5 acuity values instead of 3, there are some aggregation
# of acuity values that merge rows
# ie if age <45 == 1 and age >45 == 2, we would merge and say all ages are high acuity
# NOTE: since 0 is valid, and we are exclusive on the bottom, start the bottom range at -1
# Structure (defined in the test_run func):
# "lower_bound_age,upper_bound_age,risk_protocol,expected_output,should_raise"
#  lower_bound_age: lowest age this protocol applies to. NON INCLUSIVE
#  upper_bound_age: highest age this protocol applies to. INCLUSIVE
#  risk_protocol: the risk protocol
#  expected_output: expected model output. Type: proto.Acuity
# fmt: off

test_data = [
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN, acuity_proto.ACUITY_MEDIUM),
    (45, 64, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN, acuity_proto.ACUITY_HIGH),
    (64, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ALLERGIC_REACTION, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ANIMAL_BITE, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ANXIETY, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_BACK_PAIN, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_BLADDER_CATHETER_ISSUE, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_IN_STOOL, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_SUGAR_CONCERNS, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_BURN, acuity_proto.ACUITY_LOW),
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_CHEST_PAIN, acuity_proto.ACUITY_MEDIUM),
    (45, 64, risk_strat_proto.RISK_PROTOCOL_V1_CHEST_PAIN, acuity_proto.ACUITY_HIGH),
    (64, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_CHEST_PAIN, acuity_proto.ACUITY_HIGH),
    # ISSUE: CONFUSION protocol doesn't make sense, is not the full range of ages.
    #    AS the given ages are all high acuity, will make the whole range high acuity
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_CONFUSION, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_CONSTIPATION, acuity_proto.ACUITY_LOW),
    # ISSUE: COUGH doesn't cover all age groups
    #  As its low acuity, will have whole range be low acuity
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_COUGH, acuity_proto.ACUITY_LOW),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_DEHYDRATION, acuity_proto.ACUITY_LOW),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_DEHYDRATION, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_DENTAL_PAIN, acuity_proto.ACUITY_LOW),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_DIARRHEA, acuity_proto.ACUITY_MEDIUM),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_DIARRHEA, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_DIFFICULTY_URINATING, acuity_proto.ACUITY_MEDIUM),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_DIZZINESS, acuity_proto.ACUITY_MEDIUM),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_DIZZINESS, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_EAR_PAIN, acuity_proto.ACUITY_LOW),
    # ISSUE: Two entries for the full range of nose bleed. Not of great import, as both are high acuity
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_EPISTAXIS, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_EXTREMITY_INJURY_OR_PAIN, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_EXTREMITY_SWELLING, acuity_proto.ACUITY_MEDIUM),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_FALL_WITHOUT_INJURY, acuity_proto.ACUITY_LOW),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_FALL_WITHOUT_INJURY, acuity_proto.ACUITY_MEDIUM),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_FEVER, acuity_proto.ACUITY_LOW),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_FEVER, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_GASTRIC_TUBE_ABNORMALITY, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_GENERAL_COMPLAINT, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_HEAD_INJURY, acuity_proto.ACUITY_HIGH),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_HEADACHE, acuity_proto.ACUITY_MEDIUM),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_HEADACHE, acuity_proto.ACUITY_HIGH),
    (-1, 17, risk_strat_proto.RISK_PROTOCOL_V1_HIGH_RISK_UNDER_18, acuity_proto.ACUITY_HIGH),
    (17, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_HIGH_RISK_OVER_18, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_HYPERTENSION, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_LABORATORY_TEST_CONCERN, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_LACERATION, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_LETHARGY, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_HYPOTENSION, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_NAUSEA_OR_VOMITING, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_NEUROLOGIC_COMPLAINT, acuity_proto.ACUITY_HIGH),
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_NUMBNESS, acuity_proto.ACUITY_MEDIUM),
    (45, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_NUMBNESS, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_OVERDOSE_POISONING, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_PACEMAKER_COMPLICATIONS, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_PALPITATIONS_ABNORMAL_HEART_RATE, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_POST_ACUTE_PATIENT_FOLLOW_UP, acuity_proto.ACUITY_MEDIUM),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_RECTAL_PAIN, acuity_proto.ACUITY_LOW),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_RECTAL_PAIN, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_SELF_HARM, acuity_proto.ACUITY_HIGH),
    # NOTE: aggregate SHORTNESS_OF_BREATH since all high acuity
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_SHORTNESS_OF_BREATH, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_SINUS_PAIN, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_SKIN_RASH, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_SORE_THROAT, acuity_proto.ACUITY_LOW),
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_SYNCOPE, acuity_proto.ACUITY_MEDIUM),
    (45, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_SYNCOPE, acuity_proto.ACUITY_HIGH),
    (-1, 40, risk_strat_proto.RISK_PROTOCOL_V1_TESTICULAR_PAIN, acuity_proto.ACUITY_HIGH),
    (40, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_TESTICULAR_PAIN, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_UNABLE_TO_URINATE, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_VISION_PROBLEM, acuity_proto.ACUITY_LOW),
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_WEAKNESS, acuity_proto.ACUITY_MEDIUM),
    (45, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_WEAKNESS, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_WOUND_EVALUATION, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_FLU_LIKE_SYMPTOMS, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_EDUCATIONAL_PROGRAM, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_SEIZURE, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_HOSPICE, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_PULSE_HEART, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_RESPIRATORY_COMPLAINT_SENIOR_LIVING, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ADVANCED_CARE_MONOCLONAL_ANTIBODIES, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ASYMPTOMATIC_COVID_TESTING, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_HALLUCINATIONS, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_GYNECOLOGICAL, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_PROVIDER_REQUESTED, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_EMS_ET3_TREAT_IN_PLACE, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ADVANCED_CARE, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_NECK_PAIN, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_EMERGENCY_DEPARTMENT_TO_HOME, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_REGISTERED_NURSE, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_UNSPECIFIED, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_NAUSEA_OR_VOMITING_OR_DIARRHEA, acuity_proto.ACUITY_MEDIUM),
    (-1, 65, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN_OR_CONSTIPATION, acuity_proto.ACUITY_MEDIUM),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN_OR_CONSTIPATION, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_COUGH_OR_URI_OR_SINUSITIS_OR_SORE_THROAT, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_NECK_BACK_SPINE_PAIN, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_PREGNANCY_GYNECOLOGICAL, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ANXIETY_PANIC_HALLUCINATION, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_PALPITATIONS_ABNORMAL_HEART_RATE_PACEMAKER, acuity_proto.ACUITY_HIGH),
    (-1, 3, risk_strat_proto.RISK_PROTOCOL_V1_WEAKNESS_DEHYDRATION, acuity_proto.ACUITY_HIGH),
    (3, 65, risk_strat_proto.RISK_PROTOCOL_V1_WEAKNESS_DEHYDRATION, acuity_proto.ACUITY_MEDIUM),
    (65, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_WEAKNESS_DEHYDRATION, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_NEUROLOGIC_NUMBNESS, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_DH_PROVIDER_RISK_STRATIFICATION, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_COVID19_FACILITY_TESTING, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_OPTUM_SKILLED_NURSING_FACILITIES_ONBOARDING_PROCESS, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_PARTNER_USING_NATIONALLY_ACCREDITED_RISK_STRAT_PROCESS, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_TOUCHLESS_WEB_ONBOARDING, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_WELLNESS_VISIT_HEDIS_PROACTIVE_APPOINTMENT, acuity_proto.ACUITY_LOW),
]

other_override_reason = "Other"

test_data_override = [
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN, other_override_reason, acuity_proto.ACUITY_MEDIUM),
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN, BaseModel.HIGH_ACUITY_OVERRIDE_REASON, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ALLERGIC_REACTION, other_override_reason, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ALLERGIC_REACTION, BaseModel.HIGH_ACUITY_OVERRIDE_REASON, acuity_proto.ACUITY_HIGH),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ANIMAL_BITE, other_override_reason, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ANIMAL_BITE, BaseModel.HIGH_ACUITY_OVERRIDE_REASON, acuity_proto.ACUITY_HIGH),
]

test_data_risk_strat_bypass = [
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN, False, acuity_proto.ACUITY_MEDIUM),
    (-1, 45, risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN, True, acuity_proto.ACUITY_MEDIUM),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ANIMAL_BITE, False, acuity_proto.ACUITY_LOW),
    (-1, utils.OLD_AGE, risk_strat_proto.RISK_PROTOCOL_V1_ANIMAL_BITE, True, acuity_proto.ACUITY_MEDIUM),
]


def test_validate_request_invalid_age():
    model = version_2.V2(logger=Mock(), statsd=Mock())

    # verify valid input does not raise
    valid_acuity_request = acuity_proto.GetAcuityRequest(age=10, risk_protocol=risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN)
    model.validate_request(valid_acuity_request)

    # verify invalid age raises
    invalid_age_requests = [
        acuity_proto.GetAcuityRequest(age=-1, risk_protocol=risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN),
    ]

    for invalid_age_request in invalid_age_requests:
        with pytest.raises(utils.InvalidAgeException):
            model.validate_request(request=invalid_age_request)
        assert call(str(utils.InvalidAgeException()), extra={"age": invalid_age_request.age}) in model.logger.error.call_args_list
        model.logger.error.reset_mock()


def test_validate_request_invalid_risk_protocol():
    model = version_2.V2(logger=Mock(), statsd=Mock())
    # verify raise if provided an out of bound enum
    invalid_risk_protocol = acuity_proto.GetAcuityRequest(age=10, risk_protocol=1000)

    with pytest.raises(utils.InvalidRiskProtocolEnumException):
        model.validate_request(request=invalid_risk_protocol)
    assert call(str(utils.InvalidRiskProtocolEnumException()), extra={"risk_protocol_V1_enum_int": invalid_risk_protocol.risk_protocol}) in model.logger.error.call_args_list
    model.logger.error.reset_mock()


def run(lower_bound_age, upper_bound_age, risk_protocol, expected_output, override_reason=None, risk_strat_bypassed=None):
    # NOTE: these tests are written with the assumption that ranges are covered by the model,
    #       so if the upper and lower bound are covered, the inbetween values are covered as well
    model = version_2.V2(logger=Mock(), statsd=Mock())
    # expect the lower bound to be exlusive, upper to be inclusive ie:
    # lowest_valid_age == lower_bound_age +1
    # upper_valid_age == uppper_bound_age

    with patch.object(model.statsd, "increment") as increment:
        lower_bound_input = acuity_proto.GetAcuityRequest(age=lower_bound_age+1, risk_protocol=risk_protocol, override_reason=override_reason, risk_strat_bypassed=risk_strat_bypassed)
        lower_bound_output = model.run(lower_bound_input)
        assert expected_output == lower_bound_output, f"Lower age bound failure for:\n\trisk_strat_protocol: {risk_strat_proto.RiskProtocolV1.Name(risk_protocol)}"

        upper_bound_input = acuity_proto.GetAcuityRequest(age=upper_bound_age, risk_protocol=risk_protocol, override_reason=override_reason, risk_strat_bypassed=risk_strat_bypassed)
        upper_bound_output = model.run(upper_bound_input)
        assert expected_output == upper_bound_output, f"Upper age bound failure for:\n\trisk_strat_protocol: {risk_strat_proto.RiskProtocolV1.Name(risk_protocol)}"
        if risk_protocol == 0:
            increment.assert_called_with("risk_protocol_v1_unspecified")


@pytest.mark.parametrize("lower_bound_age,upper_bound_age,risk_protocol,expected_output", test_data)
def test_run(lower_bound_age, upper_bound_age, risk_protocol, expected_output):
    run(lower_bound_age=lower_bound_age, upper_bound_age=upper_bound_age, risk_protocol=risk_protocol, expected_output=expected_output)


@pytest.mark.parametrize("lower_bound_age,upper_bound_age,risk_protocol,override_reason,expected_output", test_data_override)
def test_run_override(lower_bound_age, upper_bound_age, risk_protocol, override_reason, expected_output):
    run(lower_bound_age=lower_bound_age, upper_bound_age=upper_bound_age, risk_protocol=risk_protocol, override_reason=override_reason, expected_output=expected_output)


@pytest.mark.parametrize("lower_bound_age,upper_bound_age,risk_protocol,risk_strat_bypassed,expected_output", test_data_risk_strat_bypass)
def test_run_risk_strat_bypass(lower_bound_age, upper_bound_age, risk_protocol, risk_strat_bypassed, expected_output):
    run(lower_bound_age=lower_bound_age, upper_bound_age=upper_bound_age, risk_protocol=risk_protocol, risk_strat_bypassed=risk_strat_bypassed, expected_output=expected_output)


def test_model_handles_enum_with_no_implementation():
    # test for no implementation for given protocol
    model = version_2.V2(logger=Mock(), statsd=Mock())

    # arbitrarily large enum value, should not exist
    non_existent_risk_protocol = 100000
    raise_input = acuity_proto.GetAcuityRequest(risk_protocol=non_existent_risk_protocol)
    with pytest.raises(utils.ProtocolNotHandledInModelException):
        model.run(raise_input)
    assert call(str(utils.ProtocolNotHandledInModelException())) in model.logger.error.call_args_list
    model.logger.error.reset_mock()
    return
