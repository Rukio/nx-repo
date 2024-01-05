import {
  ServiceLine,
  QuestionResponse,
  StationServiceLine,
  StationProtocolRequirement,
  StationQuestionResponse,
  ServiceLineQuestionResponse,
  StationInsurancePlanServiceLine,
  StationServiceLineQuestionResponse,
} from '@*company-data-covered*/consumer-web-types';
import {
  CreateServiceLineQuestionResponseDto,
  UpdateServiceLineQuestionResponseDto,
} from './dto/service-line-question.dto';

const StationServiceLineToServiceLine = (
  input: StationServiceLine
): ServiceLine => {
  const output: ServiceLine = {
    createdAt: input.created_at,
    default: input.default,
    existingPatientAppointmentType: input.existing_patient_appointment_type,
    followup2Day: input.followup_2_day,
    followup_14_30_day: input.followup_14_30_day,
    id: input.id,
    insurancePlanServiceLines:
      input.insurance_plan_service_lines &&
      input.insurance_plan_service_lines.map(
        (value: StationInsurancePlanServiceLine) => ({
          id: value.id,
          serviceLineId: value.service_line_id,
          insurancePlanId: value.insurance_plan_id,
          scheduleNow: value.schedule_now,
          scheduleFuture: value.schedule_future,
          captureCcOnScene: value.capture_cc_on_scene,
          note: value.note,
          createdAt: value.created_at,
          updatedAt: value.updated_at,
          allChannelItems: value.all_channel_items,
          enabled: value.enabled,
          newPatientAppointmentType: value.new_patient_appointment_type,
          existingPatientAppointmentType:
            value.existing_patient_appointment_type,
          onboardingCcPolicy: value.onboarding_cc_policy,
        })
      ),
    is911: input.is_911,
    name: input.name,
    newPatientAppointmentType: input.new_patient_appointment_type,
    outOfNetworkInsurance: input.out_of_network_insurance,
    parentId: input.parent_id,
    requireCheckout: input.require_checkout,
    requireConsentSignature: input.require_consent_signature,
    requireMedicalNecessity: input.require_medical_necessity,
    serviceLineQuestions: input.service_line_questions,
    shiftTypeId: input.shift_type_id,
    subServiceLines:
      input.sub_service_lines &&
      input.sub_service_lines.map(StationServiceLineToServiceLine),
    protocolRequirements:
      input.protocol_requirements &&
      input.protocol_requirements.map(
        (requirement: StationProtocolRequirement) => ({
          id: requirement.id,
          color: requirement.color,
          name: requirement.name,
          serviceLineId: requirement.service_line_id,
          maximumAge: requirement.maximum_age,
          minimumAge: requirement.minimum_age,
        })
      ),
    updatedAt: input.updated_at,
    upgradeableWithScreening: input.upgradeable_with_screening,
  };

  return output;
};

const StationServiceLineQuestionResponseToServiceLineQuestionResponse = (
  input: StationServiceLineQuestionResponse
): ServiceLineQuestionResponse => {
  const output: ServiceLineQuestionResponse = {
    careRequestId: input.care_request_id,
    createdAt: input.created_at,
    id: input.id,
    responses: input.responses.map((value: StationQuestionResponse) => ({
      id: value.id,
      serviceLineId: value.service_line_id,
      questionType: value.question_type,
      questionText: value.question_text,
      syncToAthena: value.sync_to_athena,
      order: value.order,
      createdAt: value.created_at,
      updatedAt: value.updated_at,
    })),
    serviceLineId: input.service_line_id,
    updatedAt: input.updated_at,
    userId: input.user_id,
  };

  return output;
};

const ServiceLineQuestionResponseToStationServiceLineQuestionResponse = (
  input:
    | CreateServiceLineQuestionResponseDto
    | UpdateServiceLineQuestionResponseDto
): Partial<StationServiceLineQuestionResponse> => {
  const output: Partial<StationServiceLineQuestionResponse> = {
    service_line_id: input.serviceLineId,
    responses: input.responses.map((value: QuestionResponse) => ({
      id: value.id,
      service_line_id: value.serviceLineId,
      sync_to_athena: value.syncToAthena,
      order: value.order,
      question_text: value.questionText,
      question_type: value.questionType,
      created_at: value.createdAt,
      updated_at: value.updatedAt,
    })),
  };

  return output;
};

export default {
  StationServiceLineToServiceLine,
  StationServiceLineQuestionResponseToServiceLineQuestionResponse,
  ServiceLineQuestionResponseToStationServiceLineQuestionResponse,
};
