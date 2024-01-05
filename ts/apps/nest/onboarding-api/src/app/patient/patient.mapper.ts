import {
  EhrPatient,
  Patient,
  PatientSearchParam,
  StationEhrPatient,
  StationPatient,
  StationPatientSearchParam,
  StationWebRequestPatient,
  WebRequestPatient,
  LastCareRequest,
  StationLastCareRequest,
} from '@*company-data-covered*/consumer-web-types';
import stationMapper from '../station/station.mapper';

const SearchPatientToStationSearchPatient = (
  input: PatientSearchParam
): StationPatientSearchParam => {
  const output: StationPatientSearchParam = {
    first_name: input.firstName,
    last_name: input.lastName,
  };

  return output;
};

const StationLastRequestToLastRequest = (
  input: StationLastCareRequest
): LastCareRequest => {
  const output: LastCareRequest = {
    id: input.id,
    patientId: input.patient_id,
    requestStatus: input.request_status,
    requestType: input.request_type,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    state: input.state,
    zipcode: input.zipcode,
    city: input.city,
    streetAddress1: input.street_address_1,
    streetAddress2: input.street_address_2,
    billingCityId: input.billing_city_id,
    requestedBy: input.requested_by,
    activatedBy: input.activated_by,
    channelItemId: input.channel_item_id,
    channelItem:
      input.channel_item &&
      stationMapper.StationChannelItemToChannelItem(input.channel_item),
    assignmentDate: input.assignment_date,
    assignmentStatus: input.assignment_status,
    assignmentId: input.assignment_id,
    acceptedOrder: input.accepted_order,
    advancedCareEligibility: input.advanced_care_eligibility,
    advancedCareStatus: input.advanced_care_status,
    appointmentType: input.appointment_type,
    appointmentTypeCategory: input.appointment_type_category,
    callerId: input.caller_id,
    automatedCommunicationConsent: input.automated_communication_consent,
    bypassScreeningProtocol: input.bypass_screening_protocol,
    centuraConnectAco: input.centura_connect_aco,
    channelItemSelectedWithOriginPhone:
      input.channel_item_selected_with_origin_phone,
    checkoutCompletedAt: input.checkout_completed_at,
    chiefComplaint: input.chief_complaint,
    chronoVisitId: input.chrono_visit_id,
    completeStatusStartedAt: input.complete_status_started_at,
    confirmedAt: input.confirmed_at,
    consentSignature: input.consent_signature,
    consenterName: input.consenter_name,
    consenterOnScene: input.consenter_name,
    consenterPhoneNumber: input.consenter_phone_number,
    consenterRelationship: input.consenter_relationship,
    consenterRelationshipDetails: input.consenter_relationship_details,
    contactId: input.contact_id,
    creditCardConsent: input.credit_card_consent,
    dataUseConsent: input.data_use_consent,
    deletedAt: input.deleted_at,
    dispatchQueueId: input.dispatch_queue_id,
    ehrId: input.ehr_id,
    ehrName: input.ehr_name,
    facility: input.facility,
    marketId: input.market_id,
    marketingMetaData: input.marketing_meta_data,
    mpoaOnScene: input.mpoa_on_scene,
    noCreditCardReason: input.no_credit_card_reason,
    noCreditCardReasonOther: input.no_credit_card_reason_other,
    noReferralsConfirmed: input.no_referrals_confirmed,
    oldShiftTeamId: input.old_shift_team_id,
    onAcceptedEta: input.on_accepted_eta,
    onRouteEta: input.on_route_eta,
    onSceneEtc: input.on_scene_etc,
    orderId: input.order_id,
    origCity: input.orig_city,
    origLatitude: input.orig_latitude,
    origLongitude: input.orig_longitude,
    latitude: input.latitude,
    longitude: input.longitude,
    origState: input.orig_state,
    origStreetAddress1: input.orig_street_address_1,
    origStreetAddress2: input.orig_street_address_2,
    origZipcode: input.orig_zipcode,
    originPhone: input.origin_phone,
    originalCompleteStatusStartedAt: input.original_complete_status_started_at,
    partnerId: input.partner_id,
    patientAbleToSign: input.patient_able_to_sign,
    patientRisk: input.patient_risk,
    phoneNumberConfirmationId: input.phone_number_confirmation_id,
    placeOfService: input.place_of_service,
    prioritizedAt: input.prioritized_at,
    prioritizedBy: input.prioritized_by,
    priorityNote: input.priority_note,
    privacyPolicyConsent: input.privacy_policy_consent,
    promptedSurveyAt: input.prompted_survey_at,
    pulledAt: input.pulled_at,
    pushedAt: input.pushed_at,
    reasonForVerbalConsent: input.reason_for_verbal_consent,
    requiredSkillIds: input.required_skill_ids,
    serviceLineId: input.service_line_id,
    signed: input.signed,
    treatmentConsent: input.treatment_consent,
    triageNoteSalesforceId: input.triage_note_salesforce_id,
    unassignmentReason: input.unassignment_reason,
    unsynchedChanges: input.unsynched_changes,
    useAsBillingAddress: input.use_as_billing_address,
    verbalConsentAt: input.verbal_consent_at,
    verbalConsentWitness1Name: input.verbal_consent_witness_1_name,
    verbalConsentWitness2Name: input.verbal_consent_witness_2_name,
  };

  return output;
};

const PatientToStationPatient = (input: Patient): StationPatient => {
  const output: StationPatient = {
    id: input.id,
    first_name: input.firstName,
    last_name: input.lastName,
    middle_name: input.middleName,
    suffix: input.suffix,
    mobile_number: input.phone,
    patient_email: input.email,
    ssn: input.ssn,
    dob: input.dateOfBirth,
    gender: input.gender,
    city: input.address?.city,
    state: input.address?.state,
    zipcode: input.address?.zip,
    voicemail_consent: input.voicemailConsent,
    street_address_1: input.address?.streetAddress1,
    street_address_2: input.address?.streetAddress2,
    ehr_id: input.ehrPatientId,
    channel_item_id: input.channelItemId,
    eligible_patient_id: input.eligiblePatientId,
    eligibility_file_id: input.eligibilityFileId,
    class_name: input.className,
    patient_id: input.patientId,
    guarantor_attributes: input.guarantor && {
      id: input.guarantor.id,
      patient_id: input.guarantor.patientId,
      email: input.guarantor.email,
      first_name: input.guarantor.firstName,
      last_name: input.guarantor.lastName,
      relation_to_patient: input.guarantor.relationToPatient,
      relationship_to_patient: input.guarantor.relationshipToPatient,
      same_as_care_address: input.guarantor.sameAsCareAddress,
      phone: input.guarantor.phone,
      dob: input.guarantor.dob,
      ssn: input.guarantor.ssn,
      billing_address_city: input.guarantor.billingAddressCity,
      billing_address_state: input.guarantor.billingAddressState,
      billing_address_street_address_1:
        input.guarantor.billingAddressStreetAddress1,
      billing_address_street_address_2:
        input.guarantor.billingAddressStreetAddress2,
      billing_address_zipcode: input.guarantor.billingAddressZipcode,
      created_at: input.guarantor.createdAt,
      updated_at: input.guarantor.updatedAt,
    },
    power_of_attorney: input.powerOfAttorney && {
      id: input.powerOfAttorney.id,
      patient_id: input.powerOfAttorney.patientId,
      name: input.powerOfAttorney.name,
      phone: input.powerOfAttorney.phone,
      phone_number: input.powerOfAttorney.phoneNumber && {
        mobile: input.powerOfAttorney.phoneNumber.mobile,
      },
      relationship: input.powerOfAttorney.relationship,
      created_at: input.powerOfAttorney.createdAt,
      updated_at: input.powerOfAttorney.updatedAt,
    },
    power_of_attorney_attributes: input.powerOfAttorney && {
      id: input.powerOfAttorney.id,
      patient_id: input.powerOfAttorney.patientId,
      name: input.powerOfAttorney.name,
      phone: input.powerOfAttorney.phone,
      phone_number: input.powerOfAttorney.phoneNumber && {
        mobile: input.powerOfAttorney.phoneNumber.mobile,
      },
      relationship: input.powerOfAttorney.relationship,
      created_at: input.powerOfAttorney.createdAt,
      updated_at: input.powerOfAttorney.updatedAt,
    },
    patient_safety_flag_attributes: input.patientSafetyFlag && {
      id: input.patientSafetyFlag.id,
      flag_type: input.patientSafetyFlag.flagType,
      flag_reason: input.patientSafetyFlag.flagReason,
      _destroy: input.patientSafetyFlag.destroy,
    },
  };

  return output;
};

const StationPatientToPatient = (input: StationPatient): Patient => {
  const output: Patient = {
    id: input.id,
    suffix: input.suffix,
    firstName: input.first_name,
    lastName: input.last_name,
    phone: input.mobile_number,
    email: input.email,
    dateOfBirth: input.dob,
    gender: input.gender,
    voicemailConsent: input.voicemail_consent,
    ehrPatientId: input.ehr_id,
    age: input.age,
    channelItemId: input.channel_item_id,
    eligibilityFileId: input.eligibility_file_id,
    eligiblePatientId: input.eligible_patient_id,
    className: input.class_name,
    patientId: input.patient_id,
    guarantor: input.guarantor && {
      id: input.guarantor.id,
      patientId: input.guarantor.patient_id,
      email: input.guarantor.email,
      firstName: input.guarantor.first_name,
      lastName: input.guarantor.last_name,
      relationToPatient: input.guarantor.relation_to_patient,
      relationshipToPatient: input.guarantor.relationship_to_patient,
      sameAsCareAddress: input.guarantor.same_as_care_address,
      phone: input.guarantor.phone,
      dob: input.guarantor.dob,
      ssn: input.guarantor.ssn,
      billingAddressCity: input.guarantor.billing_address_city,
      billingAddressState: input.guarantor.billing_address_state,
      billingAddressStreetAddress1:
        input.guarantor.billing_address_street_address_1,
      billingAddressStreetAddress2:
        input.guarantor.billing_address_street_address_2,
      billingAddressZipcode: input.guarantor.billing_address_zipcode,
      createdAt: input.guarantor.created_at,
      updatedAt: input.guarantor.updated_at,
    },
    powerOfAttorney: input.power_of_attorney && {
      id: input.power_of_attorney.id,
      patientId: input.power_of_attorney.patient_id,
      name: input.power_of_attorney.name,
      phone: input.power_of_attorney.phone,
      phoneNumber: input.power_of_attorney.phone_number && {
        mobile: input.power_of_attorney.phone_number.mobile,
      },
      relationship: input.power_of_attorney.relationship,
      createdAt: input.power_of_attorney.created_at,
      updatedAt: input.power_of_attorney.updated_at,
    },
    address: {
      city: input.city,
      state: input.state,
      zip: input.zipcode,
      streetAddress1: input.street_address_1,
      streetAddress2: input.street_address_2,
    },
    patientSafetyFlag: input.patient_safety_flag && {
      id: input.patient_safety_flag.id,
      flagType: input.patient_safety_flag.flag_type,
      flagReason: input.patient_safety_flag.flag_reason,
    },
  };

  if (input.last_care_request) {
    output.address = {
      city: input.last_care_request?.city,
      state: input.last_care_request?.state,
      zip: input.last_care_request?.zipcode?.toString() || input.zipcode,
      streetAddress1:
        input.last_care_request?.street_address_1 || input.street_address_1,
      streetAddress2:
        input.last_care_request?.street_address_2 || input.street_address_2,
    };
    output.lastCareRequest = StationLastRequestToLastRequest(
      input.last_care_request
    );
  }

  return output;
};

const StationEhrPatientToEhrPatient = (
  input: StationEhrPatient
): EhrPatient => {
  return {
    address: {
      streetAddress1: input.address1,
      streetAddress2: undefined,
      city: input.city,
      state: input.state,
      zip: input.zip,
    },
    patientId: input.dh_id,
    dateOfBirth: input.dob,
    gender: input.gender,
    firstName: input.first_name,
    lastName: input.last_name,
    ehrPatientId: input.patientid,
  };
};

const StationWebRequestPatientToWebRequestPatient = (
  input: StationWebRequestPatient
): WebRequestPatient => {
  return {
    id: input.id,
    firstName: input.first_name,
    lastName: input.last_name,
    phone: input.phone,
    dateOfBirth: input.dob,
    email: input.email,
    gender: input.gender,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    careRequestId: input.care_request_id,
  };
};

export default {
  SearchPatientToStationSearchPatient,
  PatientToStationPatient,
  StationPatientToPatient,
  StationEhrPatientToEhrPatient,
  StationWebRequestPatientToWebRequestPatient,
};
