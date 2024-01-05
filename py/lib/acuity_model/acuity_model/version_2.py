# -*- coding: utf-8 -*-
from __future__ import annotations

from . import utils
from .base_model import BaseModel
from proto.common import risk_strat_pb2 as risk_strat_proto  # type: ignore[attr-defined]
from proto.ml_models.acuity import service_pb2 as acuity_proto  # type: ignore[attr-defined]


class V2(BaseModel):
    """
    V2 builds upon V0 and its initial goal is to validate the Acuity Model and
    perform experimentation to reduce the number of care requests that are
    marked as high acuity.
    """

    @property
    def model_namespace(self) -> str:
        return "acuity_model.V2"

    def run(self, request: acuity_proto.GetAcuityRequest):
        # assume request has been validated

        age = request.age
        if (
            request.HasField(self.OVERRIDE_REASON_FIELD_NAME)
            and request.override_reason == self.HIGH_ACUITY_OVERRIDE_REASON
        ):
            self.statsd.increment(self.OVERRIDE_REASON_FIELD_NAME)
            return acuity_proto.ACUITY_HIGH

        if request.HasField("risk_strat_bypassed") and request.risk_strat_bypassed is True:
            self.statsd.increment("risk_strat_bypassed")
            return acuity_proto.ACUITY_MEDIUM

        match request.risk_protocol:
            case risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN:
                if age <= 45:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_ALLERGIC_REACTION:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_ANIMAL_BITE:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_ANXIETY:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_BACK_PAIN:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_BLADDER_CATHETER_ISSUE:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_IN_STOOL:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_BLOOD_SUGAR_CONCERNS:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_BURN:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_CHEST_PAIN:
                if age <= 45:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_CONFUSION:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_CONSTIPATION:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_COUGH:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_DEHYDRATION:
                if age <= 65:
                    return acuity_proto.ACUITY_LOW
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_DENTAL_PAIN:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_DIARRHEA:
                if age <= 65:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_DIFFICULTY_URINATING:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_DIZZINESS:
                if age <= 65:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_EAR_PAIN:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_EPISTAXIS:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_EXTREMITY_INJURY_OR_PAIN:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_EXTREMITY_SWELLING:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_FALL_WITHOUT_INJURY:
                if age <= 65:
                    return acuity_proto.ACUITY_LOW
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_FEVER:
                if age <= 65:
                    return acuity_proto.ACUITY_LOW
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_GASTRIC_TUBE_ABNORMALITY:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_GENERAL_COMPLAINT:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_HEAD_INJURY:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_HEADACHE:
                if age <= 65:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_HIGH_RISK_UNDER_18:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_HIGH_RISK_OVER_18:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_HYPERTENSION:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_LABORATORY_TEST_CONCERN:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_LACERATION:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_LETHARGY:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_HYPOTENSION:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_NAUSEA_OR_VOMITING:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_NEUROLOGIC_COMPLAINT:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_NUMBNESS:
                if age <= 45:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_OVERDOSE_POISONING:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_PACEMAKER_COMPLICATIONS:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_PALPITATIONS_ABNORMAL_HEART_RATE:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_POST_ACUTE_PATIENT_FOLLOW_UP:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_RECTAL_PAIN:
                if age <= 65:
                    return acuity_proto.ACUITY_LOW
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_SELF_HARM:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_SHORTNESS_OF_BREATH:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_SINUS_PAIN:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_SKIN_RASH:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_SORE_THROAT:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_SYNCOPE:
                if age <= 45:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_TESTICULAR_PAIN:
                if age <= 40:
                    return acuity_proto.ACUITY_HIGH
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_UNABLE_TO_URINATE:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_VISION_PROBLEM:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_WEAKNESS:
                if age <= 45:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_WOUND_EVALUATION:
                return acuity_proto.ACUITY_LOW
            # The following protocols were generated by looking up the most populous
            # risk strat names over the last 2 months (from ~Jun-Aug 10th 2022)
            # Getting clinical to provide an estimate of what their acuity is and
            # list it in a spreasheet:
            # https://*company-data-covered*-my.sharepoint.com/:x:/p/enrique_hernandez/EZNLvAyh6fFNqtKlpJfRhfIBrVTdINK5Mk4L5OeDIsgY-A?e=z8cmI2
            case risk_strat_proto.RISK_PROTOCOL_V1_FLU_LIKE_SYMPTOMS:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_EDUCATIONAL_PROGRAM:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_SEIZURE:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_HOSPICE:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_PULSE_HEART:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_RESPIRATORY_COMPLAINT_SENIOR_LIVING:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_ADVANCED_CARE_MONOCLONAL_ANTIBODIES:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_ASYMPTOMATIC_COVID_TESTING:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_HALLUCINATIONS:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_GYNECOLOGICAL:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_PROVIDER_REQUESTED:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_EMS_ET3_TREAT_IN_PLACE:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_ADVANCED_CARE:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_NECK_PAIN:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_EMERGENCY_DEPARTMENT_TO_HOME:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_REGISTERED_NURSE:
                return acuity_proto.ACUITY_MEDIUM
            # The following protocols are from a clincial effort to consolidate similar
            # protocols, requiring updated acuity logic. Notes from the conversation were
            # included in the following pull request:
            # https://github.com/*company-data-covered*/services/pull/2118
            case risk_strat_proto.RISK_PROTOCOL_V1_NAUSEA_OR_VOMITING_OR_DIARRHEA:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_ABDOMINAL_PAIN_OR_CONSTIPATION:
                if age <= 65:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_COUGH_OR_URI_OR_SINUSITIS_OR_SORE_THROAT:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_NECK_BACK_SPINE_PAIN:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_PREGNANCY_GYNECOLOGICAL:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_ANXIETY_PANIC_HALLUCINATION:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_PALPITATIONS_ABNORMAL_HEART_RATE_PACEMAKER:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_WEAKNESS_DEHYDRATION:
                if age <= 3:
                    return acuity_proto.ACUITY_HIGH
                if age <= 65:
                    return acuity_proto.ACUITY_MEDIUM
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_NEUROLOGIC_NUMBNESS:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_DH_PROVIDER_RISK_STRATIFICATION:
                return acuity_proto.ACUITY_HIGH
            case risk_strat_proto.RISK_PROTOCOL_V1_COVID19_FACILITY_TESTING:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_OPTUM_SKILLED_NURSING_FACILITIES_ONBOARDING_PROCESS:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_PARTNER_USING_NATIONALLY_ACCREDITED_RISK_STRAT_PROCESS:
                return acuity_proto.ACUITY_MEDIUM
            case risk_strat_proto.RISK_PROTOCOL_V1_TOUCHLESS_WEB_ONBOARDING:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_WELLNESS_VISIT_HEDIS_PROACTIVE_APPOINTMENT:
                return acuity_proto.ACUITY_LOW
            case risk_strat_proto.RISK_PROTOCOL_V1_UNSPECIFIED:
                # RISK_PROTOCOL_V1_UNSPECIFIED is allowed because proto buf convertion is imprecise
                # since clinicians can change or add protocols at will, an unspecified protocol inevitably arises
                self.statsd.increment("risk_protocol_v1_unspecified")
                return acuity_proto.ACUITY_LOW
            case _:
                err = utils.ProtocolNotHandledInModelException()
                self.logger.error(str(err))
                raise err
