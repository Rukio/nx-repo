import {
  BillingCityPlaceOfService,
  CheckMarketAvailabilityBody,
  OssCareRequest,
  OssStationCareRequest,
  RiskQuestion,
  State,
  EtaRange,
  StationBillingCityPlaceOfService,
  StationCheckMarketAvailabilityBody,
  StationRiskQuestion,
  StationState,
  StationEtaRange,
  StationProtocolWithQuestions,
  ProtocolWithQuestions,
  RiskStratificationProtocolSearchParam,
  StationRiskStratificationProtocolSearchParam,
  CareRequestAcceptIfFeasible,
  CareRequestStatus,
  StationAcceptCareRequestIfFeasiblePayload,
  StationCareRequestStatusPayload,
  CareRequest,
  StationCareRequest,
  CareRequestType,
  StationTimeWindowsAvailability,
  TimeWindowsAvailability,
  StationChannelItem,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import InputNotSpecifiedException from '../common/exceptions/input-not-specified.exception';

const CheckMarketFeasibilityBodyToStationCheckMarketFeasibilityBody = (
  input: CheckMarketAvailabilityBody
): StationCheckMarketAvailabilityBody => ({
  zipcode: input.zipcode,
  market_id: input.marketId,
  latitude: input.latitude,
  longitude: input.longitude,
  date: input.date,
  start_timestamp_sec: input.startTimeSec,
  end_timestamp_sec: input.endTimeSec,
  care_request_id: input.careRequestId,
  service_line_id: input.serviceLineId,
});

const StationBillingCityPlaceOfServiceToBillingCityPlaceOfService = (
  input: StationBillingCityPlaceOfService
): BillingCityPlaceOfService => ({
  id: input.id,
  placeOfService: input.place_of_service,
  active: input.active,
  billingCityId: input.billing_city_id,
  athenaDepartmentId: input.athena_department_id,
  instamedTerminalId: input.instamed_terminal_id,
});

const BillingCityPlaceOfServiceToStationBillingCityPlaceOfService = (
  input: BillingCityPlaceOfService
): StationBillingCityPlaceOfService => ({
  id: input.id,
  place_of_service: input.placeOfService,
  active: input.active,
  billing_city_id: input.billingCityId,
  athena_department_id: input.athenaDepartmentId,
  instamed_terminal_id: input.instamedTerminalId,
});

const StationStateToState = (input: StationState): State => ({
  id: input.id,
  name: input.name,
  abbreviation: input.abbreviation,
  createdAt: input.created_at,
  updatedAt: input.updated_at,
});

const RiskQuestionToStationRiskQuestion = (
  input: RiskQuestion
): StationRiskQuestion => ({
  allow_na: input.allowNa,
  has_notes: input.hasNotes,
  id: input.id,
  name: input.name,
  order: input.order,
  protocol_id: input.protocolId,
  required: input.required,
  weight_no: input.weightNo,
  weight_yes: input.weightYes,
  answer: input.answer,
});

const StationRiskQuestionToRiskQuestion = (
  input: StationRiskQuestion
): RiskQuestion => ({
  allowNa: input.allow_na,
  hasNotes: input.has_notes,
  id: input.id,
  name: input.name,
  order: input.order,
  protocolId: input.protocol_id,
  required: input.required,
  weightNo: input.weight_no,
  weightYes: input.weight_yes,
  answer: input.answer,
});

const UpdateCareRequestPayloadToStationUpdateCareRequestPayload = (
  input: CareRequestStatus
): StationCareRequestStatusPayload => ({
  request_status: input.status,
  comment: input.comment,
  reassignment_reason: input.reassignmentReasonText,
  reassignment_reason_other: input.reassignmentReasonOtherText,
  meta_data:
    input.shiftTeamId && input.shiftTeamId > 0
      ? {
          shift_team_id: input.shiftTeamId,
        }
      : undefined,
});

const AcceptCareRequestIfFeasiblePayloadToStationAcceptCareRequestIfFeasiblePayload =
  (
    input: CareRequestAcceptIfFeasible
  ): StationAcceptCareRequestIfFeasiblePayload => ({
    comment: input.comment,
    meta_data: input?.shiftTeamId
      ? {
          shift_team_id: input.shiftTeamId,
        }
      : undefined,
    reassignment_reason: input.reassignmentReasonText,
    reassignment_reason_other: input.reassignmentReasonOtherText,
    skip_feasibility_check: !!input.skipFeasibilityCheck,
  });

const OssCareRequestToOssStationCareRequest = (
  input: OssCareRequest
): OssStationCareRequest => {
  const { careRequest, riskAssessment, mpoaConsent } = input;

  return {
    care_request: {
      id: careRequest.id,
      request_type: CareRequestType.oss,
      market_id: careRequest.marketId,
      caller_id: careRequest.requesterId,
      service_line_id: careRequest.serviceLineId,
      channel_item_id: careRequest.channelItemId,
      request_status: careRequest.requestStatus,
      bypass_screening_protocol: !!careRequest.bypassSreeningProtocol,
      channel_item_selected_with_origin_phone:
        careRequest.channelItemSelectedWithOriginPhone,
      billing_city_id: careRequest.billingCityId,
      place_of_service: careRequest.placeOfService,
      street_address_1: careRequest.address?.streetAddress1,
      street_address_2: careRequest.address?.streetAddress2,
      city: careRequest.address?.city,
      state: careRequest.address?.state,
      zipcode: careRequest.address?.zip,
      chief_complaint: careRequest.complaint?.symptoms,
      patient_id: careRequest.patientId,
      assignment_date: careRequest.assignmentDate,
      requested_service_line: careRequest.requestedServiceLine,
      assignment_status: careRequest.assignmentStatus,
      caller_attributes: careRequest.requester && {
        relationship_to_patient: careRequest.requester.relationToPatient,
        first_name: careRequest.requester.firstName,
        last_name: careRequest.requester.lastName,
        origin_phone: careRequest.requester.phone,
        dh_phone: careRequest.requester.dhPhone,
        contact_id: careRequest.requester.conversationId,
        organization_name: careRequest.requester.organizationName,
      },
      patient_preferred_eta_start:
        careRequest.patientPreferredEta?.patientPreferredEtaStart,
      patient_preferred_eta_end:
        careRequest.patientPreferredEta?.patientPreferredEtaEnd,
    },
    risk_assessment: riskAssessment && {
      created_at: riskAssessment.createdAt,
      dob: riskAssessment.dob,
      gender: riskAssessment.gender,
      id: riskAssessment.id,
      overridden_at: riskAssessment.overriddenAt,
      override_reason: riskAssessment.overrideReason,
      protocol_id: riskAssessment.protocolId,
      protocol_name: riskAssessment.protocolName,
      protocol_score: riskAssessment.protocolScore,
      protocol_tags: riskAssessment.protocolTags,
      responses: {
        questions:
          riskAssessment.responses?.questions.map(
            RiskQuestionToStationRiskQuestion
          ) || [],
      },
      chief_complaint: riskAssessment.complaint?.symptom,
      selected_symptoms: riskAssessment.complaint?.selectedSymptoms,
      score: riskAssessment.score,
      type: riskAssessment.type,
      updated_at: riskAssessment.updatedAt,
      user_id: riskAssessment.userId,
      worst_case_score: riskAssessment.worstCaseScore,
    },
    mpoa_consent: {
      power_of_attorney_id: mpoaConsent.powerOfAttorneyId,
      time_of_consent_change: mpoaConsent.timeOfConsentChange,
      consented: mpoaConsent.consented,
      user_id: mpoaConsent.userId,
      id: mpoaConsent.id,
    },
  };
};

const OssStationCareRequestToOssCareRequest = (
  input: OssStationCareRequest
): OssCareRequest => {
  const { care_request, risk_assessment, mpoa_consent } = input;

  return {
    careRequest: {
      id: care_request.id,
      marketId: care_request.market_id,
      requestType: care_request.request_type,
      requesterId: care_request.caller_id,
      patientId: care_request.patient_id,
      requestStatus: care_request.request_status,
      serviceLineId: care_request.service_line_id,
      channelItemId: care_request.channel_item_id,
      billingCityId: care_request.billing_city_id,
      placeOfService: care_request.place_of_service,
      requester: care_request.caller && {
        id: care_request.caller.id,
        relationToPatient: care_request.caller.relationship_to_patient,
        firstName: care_request.caller.first_name,
        lastName: care_request.caller.last_name,
        phone: care_request.caller.origin_phone,
        dhPhone: care_request.caller.dh_phone,
        conversationId: care_request.caller.contact_id,
        organizationName: care_request.caller.organization_name,
      },
      address: {
        city: care_request.city,
        state: care_request.state,
        zip: care_request.zipcode?.toString(),
        streetAddress1: care_request.street_address_1,
        streetAddress2: care_request.street_address_2,
        additionalDetails: care_request.additional_details,
      },
      complaint: {
        symptoms: care_request.chief_complaint,
      },
      appointmentSlot: care_request.appointment_slot && {
        id: care_request.appointment_slot.id,
        careRequestId: care_request.appointment_slot.care_request_id,
        startTime: care_request.appointment_slot.start_time,
        createdAt: care_request.appointment_slot.created_at,
        updatedAt: care_request.appointment_slot.updated_at,
      },
      serviceLine: care_request.service_line && {
        id: care_request.service_line.id,
        name: care_request.service_line.name,
        outOfNetworkInsurance:
          care_request.service_line.out_of_network_insurance,
        existingPatientAppointmentType:
          care_request.service_line.existing_patient_appointment_type,
        newPatientAppointmentType:
          care_request.service_line.new_patient_appointment_type,
      },
      bypassSreeningProtocol: care_request.bypass_screening_protocol,
      channelItemSelectedWithOriginPhone:
        care_request.channel_item_selected_with_origin_phone,
      riskAssessment: care_request.risk_assessment && {
        protocolName: care_request.risk_assessment.protocol_name,
      },
      riskAssessmentScore: care_request.risk_assessment_score,
      riskAssessmentWorstCaseScore:
        care_request.risk_assessment_worst_case_score,
      shiftTeamId: care_request.shift_team_id,
      assignmentDate: care_request.assignment_date,
      assignmentStatus: care_request.assignment_status,
      market: care_request.market && {
        id: care_request.market.id,
        allowEtaRangeModification:
          care_request.market.allow_eta_range_modification,
        autoAssignTypeOrDefault:
          care_request.market.auto_assign_type_or_default,
        autoAssignable: care_request.market.auto_assignable,
        name: care_request.market.name,
        nextDayEtaEnabled: care_request.market.next_day_eta_enabled,
        only911: care_request.market.only_911,
        primaryInsuranceSearchEnabled:
          care_request.market.primary_insurance_search_enabled,
        selfPayRate: care_request.market.self_pay_rate,
        shortName: care_request.market.short_name,
        state: care_request.market.state,
        tzName: care_request.market.tz_name,
        tzShortName: care_request.market.tz_short_name,
      },
      requestedServiceLine: care_request.requested_service_line,
      patientPreferredEta: (care_request.patient_preferred_eta_start ||
        care_request.patient_preferred_eta_end) && {
        patientPreferredEtaStart: care_request.patient_preferred_eta_start,
        patientPreferredEtaEnd: care_request.patient_preferred_eta_end,
      },
      bypassRiskStratificationData:
        care_request.bypass_risk_stratification_data && {
          accreditedRiskStratification:
            care_request.bypass_risk_stratification_data
              .accredited_risk_stratification,
          chiefComplaint:
            care_request.bypass_risk_stratification_data.chief_complaint,
          symptoms: care_request.bypass_risk_stratification_data.symptoms,
          patientNotes:
            care_request.bypass_risk_stratification_data.patient_notes,
        },
    },
    riskAssessment: risk_assessment && {
      createdAt: risk_assessment.created_at,
      dob: risk_assessment.dob,
      gender: risk_assessment.gender,
      id: risk_assessment.id,
      overriddenAt: risk_assessment.overridden_at,
      overrideReason: risk_assessment.override_reason,
      protocolId: risk_assessment.protocol_id,
      protocolName: risk_assessment.protocol_name,
      protocolScore: risk_assessment.protocol_score,
      protocolTags: risk_assessment.protocol_tags,
      responses: {
        questions:
          risk_assessment.responses?.questions.map(
            StationRiskQuestionToRiskQuestion
          ) || [],
      },
      score: risk_assessment.score,
      type: risk_assessment.type,
      updatedAt: risk_assessment.created_at,
      userId: risk_assessment.user_id,
      worstCaseScore: risk_assessment.worst_case_score,
      complaint: {
        symptom: risk_assessment.chief_complaint,
        selectedSymptoms: risk_assessment.selected_symptoms,
      },
    },
    mpoaConsent: {
      consented: mpoa_consent.consented,
      powerOfAttorneyId: mpoa_consent.power_of_attorney_id,
      timeOfConsentChange: mpoa_consent.time_of_consent_change,
      userId: mpoa_consent.user_id,
      id: mpoa_consent.id,
    },
  };
};

const EtaRangeToStationEtaRange = (input: EtaRange): StationEtaRange => {
  return {
    care_request_id: input.careRequestId,
    care_request_status_id: input.careRequestStatusId,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    display_time_window: input.displayTimeWindow,
  };
};

const StationEtaRangeToEtaRange = (input: StationEtaRange): EtaRange => {
  return {
    id: input.id,
    careRequestId: input.care_request_id,
    careRequestStatusId: input.care_request_status_id,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    startsAt: input.starts_at,
    endsAt: input.ends_at,
    userId: input.user_id,
    displayTimeWindow: input.display_time_window,
  };
};

const SearchRSPToStationRSP = (
  input: RiskStratificationProtocolSearchParam
): StationRiskStratificationProtocolSearchParam => {
  const output: StationRiskStratificationProtocolSearchParam = {
    dob: input.dob,
    gender: input.gender,
    keywords: input.keywords,
    service_line_id: input.serviceLineId,
    market_id: input.marketId,
    high_risk: input.highRisk,
  };

  return output;
};

const StationRSPToProtocolWithQuestions = (
  input: StationProtocolWithQuestions
): ProtocolWithQuestions => {
  const output: ProtocolWithQuestions = {
    id: input.id,
    name: input.name,
    weight: input.weight,
    tags: input.tags,
    highRisk: input.high_risk,
    general: input.general,
    questions: input.questions.map((question) => ({
      id: question.id,
      name: question.name,
      order: question.order,
      weightYes: question.weight_yes,
      weightNo: question.weight_no,
      protocolId: question.protocol_id,
      allowNa: question.allow_na,
      hasNotes: question.has_notes,
    })),
  };

  return output;
};

const CareRequestToStationCareRequest = (
  input: Partial<CareRequest>
): StationCareRequest => {
  const output: StationCareRequest = {
    request_type: input.requestType,
    skip_geocode: !!input.address?.latitude,
    market_id: input.marketId,
    caller_id: input.requesterId,
    service_line_id: input.serviceLineId,
    channel_item_id: input.channelItemId,
    bypass_screening_protocol: input.bypassSreeningProtocol,
    channel_item_selected_with_origin_phone:
      input.channelItemSelectedWithOriginPhone,
    billing_city_id: input.billingCityId,
    billing_status: input.billingStatus,
    place_of_service: input.placeOfService,
    street_address_1: input.address?.streetAddress1,
    street_address_2: input.address?.streetAddress2,
    additional_details: input.address?.additionalDetails,
    city: input.address?.city,
    state: input.address?.state,
    zipcode: input.address?.zip,
    latitude: input.address?.latitude,
    longitude: input.address?.longitude,
    chief_complaint: input.complaint?.symptoms,
    patient_attributes: input.patient && {
      id: input.patient.id,
      first_name: input.patient.firstName,
      last_name: input.patient.lastName,
      mobile_number: input.patient.phone,
      patient_email: input.patient.email,
      dob: input.patient.dateOfBirth,
      gender: input.patient.gender,
      class_name: input.patient.className,
      eligibility_file_id: input.patient.eligibilityFileId,
      eligible_patient_id: input.patient.eligiblePatientId,
      patient_id: input.patient.patientId,
    },
    caller_attributes: input.requester && {
      id: input.requester.id,
      relationship_to_patient: input.requester.relationToPatient,
      first_name: input.requester.firstName,
      last_name: input.requester.lastName,
      origin_phone: input.requester.phone,
      dh_phone: input.requester.dhPhone,
      contact_id: input.requester.conversationId,
      organization_name: input.requester.organizationName,
    },
    appointment_slot_attributes: input.appointmentSlot && {
      id: input.appointmentSlot.id,
      start_time: input.appointmentSlot.startTime,
      _destroy: input.appointmentSlot.destroy,
    },
    assignment_date: input.assignmentDate,
    requested_service_line: input.requestedServiceLine,
    priority_note: input.priorityNote,
  };

  return output;
};

const StationCareRequestToCareRequest = (
  input: StationCareRequest
): CareRequest => {
  if (!input) {
    throw new InputNotSpecifiedException(StationCareRequestToCareRequest.name);
  }
  const output: CareRequest = {
    id: input.id,
    marketId: input.market_id,
    requestType: input.request_type,
    requesterId: input.caller_id,
    patientId: input.patient_id,
    requestStatus: input.request_status,
    serviceLineId: input.service_line_id,
    channelItemId: input.channel_item_id,
    billingCityId: input.billing_city_id,
    statsigCareRequestId: input.statsig_care_request_id,
    billingStatus: input.billing_status,
    placeOfService: input.place_of_service,
    requester: input.caller && {
      id: input.caller.id,
      relationToPatient: input.caller.relationship_to_patient,
      firstName: input.caller.first_name,
      lastName: input.caller.last_name,
      phone: input.caller.origin_phone,
      dhPhone: input.caller.dh_phone,
      conversationId: input.caller.contact_id,
      organizationName: input.caller.organization_name,
    },
    address: {
      city: input.city,
      state: input.state,
      zip: input.zipcode?.toString(),
      streetAddress1: input.street_address_1,
      streetAddress2: input.street_address_2,
      additionalDetails: input.additional_details,
    },
    channelItem: input.channel_item && {
      id: input.channel_item.id,
      name: input.channel_item.name,
      typeName: input.channel_item.type_name,
    },
    patientPreferredEta: (input.patient_preferred_eta_start ||
      input.patient_preferred_eta_end) && {
      patientPreferredEtaStart: input.patient_preferred_eta_start,
      patientPreferredEtaEnd: input.patient_preferred_eta_end,
    },
    patient: input.patient && {
      id: input.patient.id,
      firstName: input.patient.first_name,
      lastName: input.patient.last_name,
      phone: input.patient.mobile_number,
      email: input.patient.patient_email,
      dateOfBirth: input.patient.dob,
      age: input.patient.age,
      gender: input.patient.gender,
      voicemailConsent: input.patient.voicemail_consent,
      channelItemId: input.patient.channel_item_id,
      eligiblePatientId: input.patient.eligible_patient_id,
      className: input.patient.class_name,
      eligibilityFileId: input.patient.eligibility_file_id,
      patientId: input.patient.patient_id,
      ehrPatientId: input.patient.ehr_id,
      address: {
        city: input.city,
        state: input.state,
        zip: input.zipcode?.toString(),
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
        streetAddress1: input.street_address_1,
        streetAddress2: input.street_address_2,
      },
      powerOfAttorney: input.patient.power_of_attorney,
      patientSafetyFlag: input.patient.patient_safety_flag && {
        id: input.patient.patient_safety_flag.id,
        flagType: input.patient.patient_safety_flag.flag_type,
        flagReason: input.patient.patient_safety_flag.flag_reason,
      },
    },
    complaint: {
      symptoms: input.chief_complaint,
    },
    appointmentSlot: input.appointment_slot && {
      id: input.appointment_slot.id,
      careRequestId: input.appointment_slot.care_request_id,
      startTime: input.appointment_slot.start_time,
      createdAt: input.appointment_slot.created_at,
      updatedAt: input.appointment_slot.updated_at,
    },
    serviceLine: input.service_line && {
      id: input.service_line.id,
      name: input.service_line.name,
      outOfNetworkInsurance: input.service_line.out_of_network_insurance,
      existingPatientAppointmentType:
        input.service_line.existing_patient_appointment_type,
      newPatientAppointmentType:
        input.service_line.new_patient_appointment_type,
    },
    bypassSreeningProtocol: input.bypass_screening_protocol,
    channelItemSelectedWithOriginPhone:
      input.channel_item_selected_with_origin_phone,
    riskAssessment: input.risk_assessment && {
      protocolName: input.risk_assessment.protocol_name,
    },
    riskAssessmentScore: input.risk_assessment_score,
    riskAssessmentWorstCaseScore: input.risk_assessment_worst_case_score,
    secondaryScreenings: input.secondary_screenings?.map(
      (secondary_screening) => ({
        id: secondary_screening.id,
        approvalStatus: secondary_screening.approval_status,
        note: secondary_screening.note,
        provider: secondary_screening.provider,
        mustBeSeenToday: secondary_screening.must_be_seen_today,
        telepresentationEligible: secondary_screening.telepresentation_eligible,
      })
    ),
    etaRanges: input.eta_ranges?.map((eta_range) => ({
      careRequestId: eta_range.care_request_id,
      careRequestStatusId: eta_range.care_request_status_id,
      createdAt: eta_range.created_at,
      endsAt: eta_range.ends_at,
      id: eta_range.id,
      startsAt: eta_range.starts_at,
      updatedAt: eta_range.updated_at,
      userId: eta_range.user_id,
    })),
    activeStatus: input.active_status && {
      comment: input.active_status.comment,
      commentorName: input.active_status.commentor_name,
      id: input.active_status.id,
      metaData: input.active_status.meta_data && {
        shiftTeamId: input.active_status.meta_data.shift_team_id,
        eta: input.active_status.meta_data.eta,
        autoAssigned: input.active_status.meta_data.auto_assigned,
        driveTime: input.active_status.meta_data.drive_time,
        assignmentId: input.active_status.meta_data.assignment_id,
        rto: input.active_status.meta_data.rto,
        why: input.active_status.meta_data.why,
      },
      name: input.active_status.name,
      startedAt: input.active_status.started_at,
      userId: input.active_status.user_id,
      userName: input.active_status.user_name,
    },
    shiftTeamId: input.shift_team_id,
    shiftTeam: input.shift_team && {
      id: input.shift_team.id,
      car: input.shift_team.car && {
        name: input.shift_team.car.name,
        marketId: input.shift_team.car.market_id,
        phone: input.shift_team.car.phone,
        secondaryScreeningPriority:
          input.shift_team.car.secondary_screening_priority,
      },
      carId: input.shift_team.car_id,
      marketId: input.shift_team.car.market_id,
      startTime: input.shift_team.start_time,
      endTime: input.shift_team.end_time,
      renderingProviderType: input.shift_team.rendering_provider_type,
      shiftTypeId: input.shift_team.shift_type_id,
      skillIds: input.shift_team.skill_ids,
      createdAt: input.shift_team.created_at,
      updatedAt: input.shift_team.updated_at,
    },
    assignmentDate: input.assignment_date,
    assignmentStatus: input.assignment_status,
    market: input.market && {
      id: input.market.id,
      allowEtaRangeModification: input.market.allow_eta_range_modification,
      autoAssignTypeOrDefault: input.market.auto_assign_type_or_default,
      autoAssignable: input.market.auto_assignable,
      name: input.market.name,
      nextDayEtaEnabled: input.market.next_day_eta_enabled,
      only911: input.market.only_911,
      primaryInsuranceSearchEnabled:
        input.market.primary_insurance_search_enabled,
      selfPayRate: input.market.self_pay_rate,
      shortName: input.market.short_name,
      state: input.market.state,
      tzName: input.market.tz_name,
      tzShortName: input.market.tz_short_name,
    },
    requestedServiceLine: input.requested_service_line,
    partnerReferral: input.partner_referral_id && {
      id: input.partner_referral_id,
      firstName: input.partner_referral_name?.split(/ (.*)/, 2)[0],
      lastName: input.partner_referral_name?.split(/ (.*)/, 2)[1],
      phone: input.partner_referral_phone,
      relationship: input.partner_referral_relationship,
    },
    bypassRiskStratificationData: input.bypass_risk_stratification_data && {
      accreditedRiskStratification:
        input.bypass_risk_stratification_data.accredited_risk_stratification,
      chiefComplaint: input.bypass_risk_stratification_data.chief_complaint,
      symptoms: input.bypass_risk_stratification_data.symptoms,
      patientNotes: input.bypass_risk_stratification_data.patient_notes,
    },
  };

  return output;
};

const StationTimeWindowsAvailabilitiesToTimeWindowsAvailabilities = (
  input: StationTimeWindowsAvailability[] = []
): TimeWindowsAvailability[] =>
  input.map((timeWindowsAvailability) => ({
    availableTimeWindows:
      timeWindowsAvailability.available_time_windows?.map((timeWindow) => ({
        displayTimeWindow: timeWindow.display_time_window,
        end: timeWindow.end,
        isRecommended: timeWindow.is_recommended,
        partOfDay: timeWindow.part_of_day,
        start: timeWindow.start,
      })) ?? [],
    serviceDate: timeWindowsAvailability.service_date,
    unavailableTimeWindows:
      timeWindowsAvailability.unavailable_time_windows?.map((timeWindow) => ({
        displayTimeWindow: timeWindow.display_time_window,
        end: timeWindow.end,
        partOfDay: timeWindow.part_of_day,
        start: timeWindow.start,
      })) ?? [],
  }));

const StationChannelItemToChannelItem = (
  input: StationChannelItem
): ChannelItem => ({
  id: input.id,
  address2Old: input.address_2_old,
  addressOld: input.address_old,
  agreement: input.agreement,
  blendedBill: input.blended_bill,
  blendedDescription: input.blended_description,
  casePolicyNumber: input.case_policy_number,
  channelId: input.channel_id,
  cityOld: input.city_old,
  contactPerson: input.contact_person,
  createdAt: input.created_at,
  deactivatedAt: input.deactivated_at,
  email: input.email,
  emrProviderId: input.emr_provider_id,
  erDiversion: input.er_diversion,
  hospitalizationDiversion: input.hospitalization_diversion,
  marketId: input.market_id,
  marketName: input.market_name,
  name: input.name,
  nineOneOneDiversion: input.nine_one_one_diversion,
  observationDiversion: input.observation_diversion,
  phone: input.phone,
  preferredPartner: input.preferred_partner,
  preferredPartnerDescription: input.preferred_partner_description,
  prepopulateBasedOnAddress: input.prepopulate_based_on_address,
  prepopulateBasedOnEligibilityFile:
    input.prepopulate_based_on_eligibility_file,
  selectedWithLastCrId: input.selected_with_last_cr_id,
  bypassScreeningProtocol: input.bypass_screening_protocol,
  selectedWithOriginPhone: input.selected_with_origin_phone,
  sendClinicalNote: input.send_clinical_note,
  sendNoteAutomatically: input.send_note_automatically,
  snfCredentials: input.snf_credentials,
  sourceName: input.source_name,
  stateOld: input.state_old,
  typeName: input.type_name,
  updatedAt: input.updated_at,
  zipcodeOld: input.zipcode_old,
});

export default {
  AcceptCareRequestIfFeasiblePayloadToStationAcceptCareRequestIfFeasiblePayload,
  StationEtaRangeToEtaRange,
  EtaRangeToStationEtaRange,
  CheckMarketFeasibilityBodyToStationCheckMarketFeasibilityBody,
  StationBillingCityPlaceOfServiceToBillingCityPlaceOfService,
  BillingCityPlaceOfServiceToStationBillingCityPlaceOfService,
  StationStateToState,
  OssCareRequestToOssStationCareRequest,
  OssStationCareRequestToOssCareRequest,
  SearchRSPToStationRSP,
  StationRSPToProtocolWithQuestions,
  UpdateCareRequestPayloadToStationUpdateCareRequestPayload,
  CareRequestToStationCareRequest,
  StationCareRequestToCareRequest,
  StationTimeWindowsAvailabilitiesToTimeWindowsAvailabilities,
  StationChannelItemToChannelItem,
};
