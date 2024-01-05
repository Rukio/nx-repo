import {
  CareRequestType,
  EhrPatient,
  GenderIdentityCategory,
  InsuranceParams,
  Patient,
  PatientSearchParam,
  RequestStatus,
  StationEhrPatient,
  StationPatient,
  StationWebRequestPatient,
  UnverifiedPatient,
  WebRequestPatient,
} from '@*company-data-covered*/consumer-web-types';
import { getDate, getMonth, getYear } from 'date-fns';
import {
  Patient as GrpcPatient,
  PatientSafetyFlag_FlagType,
  RelationToPatient,
} from '@*company-data-covered*/protos/nest/common/patient';
import {
  GenderIdentity_Category,
  PhoneNumber_PhoneNumberType,
  Sex,
} from '@*company-data-covered*/protos/nest/common/demographic';
import {
  CreateInsuranceResponse,
  CreatePatientResponse,
  FindOrCreatePatientForUnverifiedPatientResponse,
  GetPatientResponse,
  ListInsurancesResponse,
  SearchPatientsResponse,
  UpdatePatientResponse,
  UpdateUnverifiedPatientResponse,
} from '@*company-data-covered*/protos/nest/patients/service';
import UpdatePatientDto from '../../dto/update-patient.dto';
import CreateEhrPatientDto from '../../dto/create-ehr-patient.dto';

import grpcMapper from '../../patient.grpc.mapper';
import { UnverifiedPatient as GrpcUnverifiedPatient } from '@*company-data-covered*/protos/nest/patients/patient';
import {
  INSURANCE_RECORD_MOCK,
  INSURANCE_RECORD_WITHOUT_INSURANCE_PLAN_ID_MOCK,
} from './patient.mapper.mock';
import PhoneNumberType = PhoneNumber_PhoneNumberType;

export const PATIENT_ID_MOCK = 961997;

export const PATIENTS_ID_LIST_MOCK = [65, 1, 940, 5];

export const EHR_PARAMS_MOCK: CreateEhrPatientDto = {
  billingCityId: 159,
};

export const CREATE_PATIENT_MOCK: Patient = {
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  ehrPatientId: undefined,
  gender: 'm',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
};

export const PATIENT_RESULT_MOCK: Patient = {
  id: PATIENT_ID_MOCK,
  suffix: '',
  firstName: 'Test',
  lastName: 'Test',
  phone: '+18004601000',
  email: 'test@test.test',
  dateOfBirth: '1993-03-30',
  gender: 'm',
  voicemailConsent: undefined,
  ehrPatientId: undefined,
  age: 29,
  channelItemId: undefined,
  eligibilityFileId: undefined,
  eligiblePatientId: undefined,
  className: undefined,
  patientId: undefined,
  guarantor: undefined,
  powerOfAttorney: undefined,
  address: {
    city: null,
    state: null,
    zip: '80205',
    streetAddress1: null,
    streetAddress2: null,
  },
};

export const PATIENT_RESULT_WITH_LAST_REQUEST_MOCK: Patient = {
  id: 961997,
  suffix: '',
  firstName: 'Test',
  lastName: 'Test',
  phone: '+18004601000',
  email: 'test@test.test',
  dateOfBirth: '1993-03-30',
  gender: 'm',
  age: 29,
  address: {
    city: null,
    state: 'ID',
    zip: '83714',
    streetAddress1: '52858 Jerrell Terrace',
    streetAddress2: null,
  },
  lastCareRequest: {
    id: 1390765,
    patientId: 918115,
    requestStatus: RequestStatus.archived,
    requestType: CareRequestType.express,
    createdAt: '2022-09-15T18:03:46.000Z',
    updatedAt: '2022-09-15T18:31:42.000Z',
    state: 'ID',
    zipcode: '83714',
    city: null,
    streetAddress1: '52858 Jerrell Terrace',
    streetAddress2: null,
    billingCityId: 6,
    requestedBy: null,
    activatedBy: null,
    channelItemId: 3769,
    channelItem: {
      id: 3769,
      channelId: 56,
      name: 'Healthcare provider\t',
      sourceName: 'Healthcare Partners',
      typeName: 'Provider Group',
      agreement: null,
      addressOld: null,
      cityOld: null,
      zipcodeOld: null,
      phone: '303-555-1234',
      email: 'sam_runte@wehner-graham.io',
      contactPerson: 'Ahsoka Tano',
      createdAt: '2020-04-07T00:00:00.000Z',
      updatedAt: '2022-10-15T09:53:27.697Z',
      stateOld: null,
      deactivatedAt: null,
      casePolicyNumber: '8594840822',
      blendedBill: false,
      blendedDescription: null,
      emrProviderId: null,
      preferredPartner: null,
      preferredPartnerDescription: null,
      sendClinicalNote: null,
      sendNoteAutomatically: null,
      erDiversion: null,
      nineOneOneDiversion: null,
      observationDiversion: null,
      hospitalizationDiversion: null,
      snfCredentials: false,
      prepopulateBasedOnAddress: false,
      address2Old: null,
    },
    assignmentDate: null,
    assignmentStatus: null,
    assignmentId: null,
    acceptedOrder: null,
    advancedCareEligibility: false,
    advancedCareStatus: null,
    appointmentType: null,
    appointmentTypeCategory: null,
    callerId: 1468481,
    automatedCommunicationConsent: null,
    bypassScreeningProtocol: null,
    centuraConnectAco: null,
    channelItemSelectedWithOriginPhone: null,
    checkoutCompletedAt: null,
    chiefComplaint: 'Charged my Asparagus',
    chronoVisitId: null,
    completeStatusStartedAt: null,
    confirmedAt: null,
    consentSignature: {
      url: null,
      thumb: {
        url: null,
      },
      tiny: {
        url: null,
      },
    },
    consenterName: null,
    consenterOnScene: null,
    consenterPhoneNumber: null,
    consenterRelationship: null,
    consenterRelationshipDetails: null,
    contactId: null,
    creditCardConsent: null,
    dataUseConsent: null,
    deletedAt: null,
    dispatchQueueId: 4,
    ehrId: null,
    ehrName: null,
    facility: null,
    marketId: 160,
    marketingMetaData: null,
    mpoaOnScene: null,
    noCreditCardReason: null,
    noCreditCardReasonOther: null,
    noReferralsConfirmed: null,
    oldShiftTeamId: null,
    onAcceptedEta: null,
    onRouteEta: null,
    onSceneEtc: null,
    orderId: null,
    origCity: null,
    origLatitude: null,
    origLongitude: null,
    latitude: 43.7235259,
    longitude: -116.2692976,
    origState: null,
    origStreetAddress1: null,
    origStreetAddress2: null,
    origZipcode: null,
    originPhone: '3035001518',
    originalCompleteStatusStartedAt: null,
    partnerId: null,
    patientAbleToSign: null,
    patientRisk: null,
    phoneNumberConfirmationId: null,
    placeOfService: 'Home',
    prioritizedAt: null,
    prioritizedBy: null,
    priorityNote: null,
    privacyPolicyConsent: null,
    promptedSurveyAt: null,
    pulledAt: null,
    pushedAt: null,
    reasonForVerbalConsent: null,
    requiredSkillIds: [52],
    serviceLineId: 1,
    signed: false,
    treatmentConsent: null,
    triageNoteSalesforceId: null,
    unassignmentReason: null,
    unsynchedChanges: {},
    useAsBillingAddress: null,
    verbalConsentAt: null,
    verbalConsentWitness1Name: null,
    verbalConsentWitness2Name: null,
  },
};

export const PATIENT_MOCK: Patient = {
  firstName: 'Test',
  lastName: 'Test',
  suffix: '',
  dateOfBirth: '1993-03-30',
  phone: '+18004601000',
  gender: 'm',
  email: 'test@test.test',
  age: 29,
  voicemailConsent: null,
  channelItemId: 6235,
  address: {
    city: null,
    state: null,
    zip: '80205',
    streetAddress1: null,
    streetAddress2: null,
  },
  patientSafetyFlag: null,
};

export const STATION_PATIENT_MOCK: StationPatient = {
  id: PATIENT_ID_MOCK,
  first_name: PATIENT_MOCK.firstName,
  last_name: PATIENT_MOCK.lastName,
  suffix: PATIENT_MOCK.suffix,
  mobile_number: PATIENT_MOCK.phone,
  email: PATIENT_MOCK.email,
  dob: PATIENT_MOCK.dateOfBirth,
  gender: PATIENT_MOCK.gender,
  city: PATIENT_MOCK.address.city,
  state: PATIENT_MOCK.address.state,
  zipcode: PATIENT_MOCK.address.zip,
  street_address_1: PATIENT_MOCK.address.streetAddress1,
  street_address_2: PATIENT_MOCK.address.streetAddress2,
  age: PATIENT_RESULT_MOCK.age,
  patient_safety_flag_attributes: {
    id: 1,
    flag_reason: 'Provider Safety',
    flag_type: 'permanent',
  },
};

export const STATION_PATIENT_WITH_LAST_REQUEST_MOCK: StationPatient = {
  id: PATIENT_ID_MOCK,
  first_name: PATIENT_MOCK.firstName,
  last_name: PATIENT_MOCK.lastName,
  suffix: PATIENT_MOCK.suffix,
  mobile_number: PATIENT_MOCK.phone,
  email: PATIENT_MOCK.email,
  dob: PATIENT_MOCK.dateOfBirth,
  gender: PATIENT_MOCK.gender,
  city: PATIENT_MOCK.address.city,
  state: PATIENT_MOCK.address.state,
  zipcode: PATIENT_MOCK.address.zip,
  street_address_1: PATIENT_MOCK.address.streetAddress1,
  street_address_2: PATIENT_MOCK.address.streetAddress2,
  age: PATIENT_RESULT_MOCK.age,
  patient_safety_flag_attributes: {
    id: 1,
    flag_reason: 'Provider Safety',
    flag_type: 'permanent',
  },
  last_care_request: {
    accepted_order: null,
    activated_by: null,
    advanced_care_eligibility: false,
    advanced_care_status: null,
    appointment_type: null,
    appointment_type_category: null,
    assignment_date: null,
    assignment_id: null,
    assignment_status: null,
    automated_communication_consent: null,
    billing_city_id: 6,
    bypass_screening_protocol: null,
    caller_id: 1468481,
    centura_connect_aco: null,
    channel_item_id: 3769,
    channel_item_selected_with_origin_phone: null,
    checkout_completed_at: null,
    chief_complaint: 'Charged my Asparagus',
    chrono_visit_id: null,
    complete_status_started_at: null,
    confirmed_at: null,
    consenter_name: null,
    consenter_phone_number: null,
    consenter_relationship: null,
    consenter_relationship_details: null,
    consenter_on_scene: null,
    contact_id: null,
    created_at: '2022-09-15T18:03:46.000Z',
    credit_card_consent: null,
    data_use_consent: null,
    deleted_at: null,
    dispatch_queue_id: 4,
    ehr_id: null,
    ehr_name: null,
    facility: null,
    id: 1390765,
    market_id: 160,
    marketing_meta_data: null,
    mpoa_on_scene: null,
    no_credit_card_reason: null,
    no_credit_card_reason_other: null,
    no_referrals_confirmed: null,
    old_shift_team_id: null,
    on_accepted_eta: null,
    on_route_eta: null,
    on_scene_etc: null,
    order_id: null,
    orig_city: null,
    orig_latitude: null,
    orig_longitude: null,
    orig_state: null,
    orig_street_address_1: null,
    orig_street_address_2: null,
    orig_zipcode: null,
    origin_phone: '3035001518',
    original_complete_status_started_at: null,
    partner_id: null,
    patient_able_to_sign: null,
    patient_id: 918115,
    patient_risk: null,
    phone_number_confirmation_id: null,
    place_of_service: 'Home',
    prioritized_at: null,
    prioritized_by: null,
    priority_note: null,
    privacy_policy_consent: null,
    prompted_survey_at: null,
    pulled_at: null,
    pushed_at: null,
    reason_for_verbal_consent: null,
    request_status: RequestStatus.archived,
    request_type: CareRequestType.express,
    requested_by: null,
    required_skill_ids: [52],
    service_line_id: 1,
    signed: false,
    treatment_consent: null,
    triage_note_salesforce_id: null,
    unassignment_reason: null,
    updated_at: '2022-09-15T18:31:42.000Z',
    use_as_billing_address: null,
    verbal_consent_at: null,
    verbal_consent_witness_1_name: null,
    verbal_consent_witness_2_name: null,
    city: null,
    latitude: 43.7235259,
    longitude: -116.2692976,
    state: 'ID',
    street_address_1: '52858 Jerrell Terrace',
    street_address_2: null,
    unsynched_changes: {},
    zipcode: '83714',
    channel_item: {
      id: 3769,
      channel_id: 56,
      name: 'Healthcare provider\t',
      source_name: 'Healthcare Partners',
      type_name: 'Provider Group',
      agreement: null,
      address_old: null,
      city_old: null,
      zipcode_old: null,
      phone: '303-555-1234',
      email: 'sam_runte@wehner-graham.io',
      contact_person: 'Ahsoka Tano',
      created_at: '2020-04-07T00:00:00.000Z',
      updated_at: '2022-10-15T09:53:27.697Z',
      state_old: null,
      deactivated_at: null,
      case_policy_number: '8594840822',
      blended_bill: false,
      blended_description: null,
      emr_provider_id: null,
      preferred_partner: null,
      preferred_partner_description: null,
      send_clinical_note: null,
      send_note_automatically: null,
      er_diversion: null,
      nine_one_one_diversion: null,
      observation_diversion: null,
      hospitalization_diversion: null,
      snf_credentials: false,
      prepopulate_based_on_address: false,
      address_2_old: null,
    },
    consent_signature: {
      url: null,
      thumb: {
        url: null,
      },
      tiny: {
        url: null,
      },
    },
  },
};

export const PATIENT_SEARCH_PARAM_MOCK: PatientSearchParam = {
  firstName: 'John',
  lastName: 'Doe',
  limit: 50,
  offset: 0,
};

export const PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK: PatientSearchParam = {
  firstName: 'John',
  lastName: 'Doe',
  zipCode: '1231',
  dateOfBirth: '1993-03-30',
  limit: 2,
  offset: 0,
};

export const PATIENT_SEARCH_PARAM_WITH_OFFSET_MOCK: PatientSearchParam = {
  firstName: 'John',
  lastName: 'Doe',
  limit: 2,
  offset: 1,
};

export const PATIENT_SEARCH_SORTED_PARAM_MOCK: PatientSearchParam = {
  firstName: 'test',
  lastName: 'test',
  limit: 4,
  offset: 0,
};

export const UPDATE_PATIENT_MOCK: UpdatePatientDto = {
  id: PATIENT_ID_MOCK,
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  ssn: '754345',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  gender: 'm',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  patientSafetyFlag: {
    id: 1,
    flagReason: 'Provider Safety',
    flagType: 'permanent',
  },
  guarantor: {
    lastName: 'Kerthwood',
    firstName: 'Kevin',
    dob: '25-12-1999',
    email: 'guarantor@test.test',
    billingAddressCity: 'Springfield',
    billingAddressZipcode: '45368',
    billingAddressState: 'MN',
    billingAddressStreetAddress1: '414 Howard street',
    billingAddressStreetAddress2: '39-25',
    relationshipToPatient: 'friend',
    patientId: 123,
    ssn: '6345345',
    phone: '8004601000',
    id: 14,
  },
  powerOfAttorney: {
    id: 18,
    patientId: 123,
    phone: '1000460800',
    name: 'Test aD',
    phoneNumber: {
      mobile: true,
    },
    relationship: 'patient',
  },
  voicemailConsent: false,
  consistencyToken: new Uint8Array(8),
};

export const UPDATE_PATIENT_WITHOUT_CONSISTENCY_TOKEN_MOCK: UpdatePatientDto = {
  id: PATIENT_ID_MOCK,
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  ssn: '754345',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  gender: 'm',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  patientSafetyFlag: {
    id: 1,
    flagReason: 'Provider Safety',
    flagType: 'permanent',
  },
  guarantor: {
    lastName: 'Kerthwood',
    firstName: 'Kevin',
    dob: '1999-12-25',
    email: 'guarantor@test.test',
    billingAddressCity: 'Springfield',
    billingAddressZipcode: '45368',
    billingAddressState: 'MN',
    billingAddressStreetAddress1: '414 Howard street',
    billingAddressStreetAddress2: '39-25',
    relationshipToPatient: 'friend',
    patientId: 123,
    ssn: '6345345',
    phone: '8004601000',
    id: 14,
  },
  powerOfAttorney: {
    id: 18,
    patientId: 123,
    phone: '1000460800',
    name: 'Test aD',
    phoneNumber: {
      mobile: true,
    },
    relationship: 'patient',
  },
  voicemailConsent: false,
};

export const PATIENTS_SEARCH_RESULT_MOCK: Array<Patient> = [
  {
    id: 12,
    firstName: 'John',
    lastName: 'Doe',
    suffix: 'Mr',
    email: 'test@email1.com',
    phone: '0923319057',
    dateOfBirth: '1981-05-01',
    ehrPatientId: undefined,
    guarantor: undefined,
    powerOfAttorney: undefined,
    channelItemId: undefined,
    voicemailConsent: undefined,
    gender: 'm',
    address: {
      zip: '1231',
      streetAddress1: '123',
      streetAddress2: 'example',
      city: 'test-city',
      state: 'test-state',
    },
    lastCareRequest: {
      zipcode: '1231',
      streetAddress1: '123',
      streetAddress2: 'example',
      city: 'test-city',
      state: 'test-state',
    },
    age: 22,
  },
  {
    id: 13,
    firstName: 'Jane',
    lastName: 'Doe',
    suffix: 'Ms',
    email: 'test@email2.com',
    phone: '0923319057',
    dateOfBirth: '1989-05-11',
    ehrPatientId: undefined,
    guarantor: undefined,
    powerOfAttorney: undefined,
    channelItemId: undefined,
    voicemailConsent: undefined,
    gender: 'f',
    address: {
      zip: '1231',
      streetAddress1: '123',
      streetAddress2: 'example',
      city: 'test-city',
      state: 'test-state',
    },
    lastCareRequest: {
      zipcode: '1231',
      streetAddress1: '123',
      streetAddress2: 'example',
      city: 'test-city',
      state: 'test-state',
    },
    age: 22,
  },
];

export const EHR_PATIENTS_SEARCH_RESULT_MOCK: Array<EhrPatient> = [
  {
    address: {
      zip: '1231',
      streetAddress1: '123',
      streetAddress2: undefined,
      city: 'test-city',
      state: 'test-state',
    },
    dateOfBirth: '1944-08-30',
    ehrPatientId: '345353',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'm',
    patientId: 123412,
  },
  {
    address: {
      zip: '32122',
      streetAddress1: '321',
      streetAddress2: undefined,
      city: 'test-city',
      state: 'test-state',
    },
    dateOfBirth: '1978-12-14',
    ehrPatientId: '345312',
    firstName: 'John',
    lastName: 'Doe',
    gender: 'm',
    patientId: 123412,
  },
];

export const STATION_EHR_PATIENT_SEARCH_RESULT_MOCK: Array<StationEhrPatient> =
  [
    {
      address1: '123',
      first_name: 'John',
      last_name: 'Doe',
      dh_id: 123412,
      patientid: '345353',
      dob: '1944-08-30',
      gender: 'm',
      city: 'test-city',
      state: 'test-state',
      zip: '1231',
    },
    {
      address1: '321',
      first_name: 'John',
      last_name: 'Doe',
      dh_id: 123412,
      patientid: '345312',
      dob: '1978-12-14',
      gender: 'm',
      city: 'test-city',
      state: 'test-state',
      zip: '32122',
    },
  ];

export const STATION_PATIENT_SEARCH_RESULT_MOCK: Array<StationPatient> = [
  {
    id: 12,
    first_name: 'John',
    last_name: 'Doe',
    suffix: 'Mr',
    mobile_number: '0923319057',
    email: 'test@email1.com',
    dob: '1981-05-01',
    gender: 'm',
    age: 22,
    last_care_request: {
      city: 'test-city',
      state: 'test-state',
      zipcode: '1231',
      street_address_1: '123',
      street_address_2: 'example',
    },
  },
  {
    id: 13,
    first_name: 'Jane',
    last_name: 'Doe',
    suffix: 'Ms',
    mobile_number: '0923319057',
    email: 'test@email2.com',
    dob: '1989-05-11',
    gender: 'f',
    age: 22,
    last_care_request: {
      city: 'test-city',
      state: 'test-state',
      zipcode: '1231',
      street_address_1: '123',
      street_address_2: 'example',
    },
  },
];

export const STATION_PATIENT_UPDATE_MOCK: StationPatient = {
  id: PATIENT_ID_MOCK,
  first_name: 'John',
  last_name: 'Doe',
  suffix: 'Mr',
  mobile_number: '0923319057',
  email: 'test@test.test',
  dob: '1981-05-01',
  gender: 'm',
  last_care_request: {
    city: 'test-city',
    state: 'test-state',
    zipcode: '1231',
    street_address_1: '123',
    street_address_2: 'example',
  },
  age: 22,
};

export const STATION_WEB_REQUEST_PATIENT_MOCK: StationWebRequestPatient = {
  id: 1,
  first_name: 'test',
  last_name: 'test',
  phone: '4242424242',
  dob: '1997-12-05',
  email: 'test@gmail.com',
  gender: 'male',
  created_at: '2022-12-19T16:25:19.000Z',
  updated_at: '2022-12-19T16:25:21.000Z',
  care_request_id: 613979,
};

export const WEB_REQUEST_PATIENT_MOCK: WebRequestPatient = {
  id: 1,
  firstName: 'test',
  lastName: 'test',
  phone: '4242424242',
  dateOfBirth: '1997-12-05',
  email: 'test@gmail.com',
  gender: 'male',
  createdAt: '2022-12-19T16:25:19.000Z',
  updatedAt: '2022-12-19T16:25:21.000Z',
  careRequestId: 613979,
};

export const UPDATE_PATIENT_RESULT_MOCK: Patient = {
  id: PATIENT_ID_MOCK,
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  gender: 'm',
  ehrPatientId: undefined,
  guarantor: undefined,
  powerOfAttorney: undefined,
  channelItemId: undefined,
  voicemailConsent: undefined,
  age: 22,
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  lastCareRequest: {
    zipcode: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
};

export const CREATE_GRPC_PATIENT_MOCK: GrpcPatient = {
  id: PATIENT_ID_MOCK.toString(),
  social_security_number: '234234234',
  name: {
    given_name: CREATE_PATIENT_MOCK.firstName,
    family_name: CREATE_PATIENT_MOCK.lastName,
    suffix: CREATE_PATIENT_MOCK.suffix,
  },
  contact_info: {
    address: {
      city: CREATE_PATIENT_MOCK.address.city,
      state: CREATE_PATIENT_MOCK.address.state,
      zip_code: CREATE_PATIENT_MOCK.address.zip,
      address_line_one: CREATE_PATIENT_MOCK.address.streetAddress1,
      address_line_two: CREATE_PATIENT_MOCK.address.streetAddress2,
    },
    email: CREATE_PATIENT_MOCK.email,
    mobile_number: {
      phone_number: CREATE_PATIENT_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
  },
  sex: CREATE_PATIENT_MOCK.gender === 'f' ? Sex.SEX_FEMALE : Sex.SEX_MALE,
  date_of_birth: {
    day: getDate(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)),
    month:
      getMonth(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)) + 1,
    year: getYear(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)),
  },
  additional_identifiers: [],
  billing_city: {
    id: '59',
  },
};

export const GET_GRPC_PATIENT_MOCK: GrpcPatient = {
  id: PATIENT_ID_MOCK.toString(),
  social_security_number: '234234234',
  name: {
    given_name: UPDATE_PATIENT_MOCK.firstName,
    family_name: UPDATE_PATIENT_MOCK.lastName,
    suffix: UPDATE_PATIENT_MOCK.suffix,
  },
  contact_info: {
    address: {
      city: UPDATE_PATIENT_MOCK.address.city,
      state: UPDATE_PATIENT_MOCK.address.state,
      zip_code: UPDATE_PATIENT_MOCK.address.zip,
      address_line_one: UPDATE_PATIENT_MOCK.address.streetAddress1,
      address_line_two: UPDATE_PATIENT_MOCK.address.streetAddress2,
    },
    email: UPDATE_PATIENT_MOCK.email,
    mobile_number: {
      phone_number: UPDATE_PATIENT_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
  },
  sex: UPDATE_PATIENT_MOCK.gender === 'f' ? Sex.SEX_FEMALE : Sex.SEX_MALE,
  date_of_birth: {
    day: getDate(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)),
    month:
      getMonth(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)) + 1,
    year: getYear(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)),
  },
  additional_identifiers: [],
  billing_city: {
    id: '59',
  },
  patient_safety_flag: {
    flagger_user_id: '1',
    type: PatientSafetyFlag_FlagType.FLAG_TYPE_PERMANENT,
    reason: 'Provider Safety',
  },
};

export const UPDATE_GRPC_PATIENT_MOCK: GrpcPatient = {
  id: UPDATE_PATIENT_MOCK.id.toString(),
  social_security_number: UPDATE_PATIENT_MOCK.ssn,
  name: {
    given_name: UPDATE_PATIENT_MOCK.firstName,
    family_name: UPDATE_PATIENT_MOCK.lastName,
    suffix: UPDATE_PATIENT_MOCK.suffix,
  },
  contact_info: {
    address: {
      city: UPDATE_PATIENT_MOCK.address.city,
      state: UPDATE_PATIENT_MOCK.address.state,
      zip_code: UPDATE_PATIENT_MOCK.address.zip,
      address_line_one: UPDATE_PATIENT_MOCK.address.streetAddress1,
      address_line_two: UPDATE_PATIENT_MOCK.address.streetAddress2,
    },
    email: UPDATE_PATIENT_MOCK.email,
    mobile_number: {
      phone_number: UPDATE_PATIENT_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
  },
  sex: UPDATE_PATIENT_MOCK.gender === 'f' ? Sex.SEX_FEMALE : Sex.SEX_MALE,
  birth_sex: grpcMapper.protoBirthSex(UPDATE_PATIENT_MOCK.birthSex),
  date_of_birth: {
    day: getDate(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)),
    month:
      getMonth(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)) + 1,
    year: getYear(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)),
  },
  additional_identifiers: [],
  billing_city: {
    id: '59',
  },
  guarantor: {
    name: {
      given_name: UPDATE_PATIENT_MOCK.guarantor.firstName,
      family_name: UPDATE_PATIENT_MOCK.guarantor.lastName,
    },
    date_of_birth: {
      day: getDate(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.guarantor.dob)),
      month:
        getMonth(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.guarantor.dob)) + 1,
      year: getYear(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.guarantor.dob)),
    },
    patient_relation: {
      relation: RelationToPatient.RELATION_TO_PATIENT_FRIEND,
      other_relation_text: 'friend',
    },
    contact_info: {
      address: {
        city: UPDATE_PATIENT_MOCK.guarantor.billingAddressCity,
        state: UPDATE_PATIENT_MOCK.guarantor.billingAddressState,
        zip_code: UPDATE_PATIENT_MOCK.guarantor.billingAddressZipcode,
        address_line_one:
          UPDATE_PATIENT_MOCK.guarantor.billingAddressStreetAddress1,
        address_line_two:
          UPDATE_PATIENT_MOCK.guarantor.billingAddressStreetAddress2,
      },
      email: UPDATE_PATIENT_MOCK.guarantor.email,
      mobile_number: {
        phone_number: UPDATE_PATIENT_MOCK.guarantor.phone,
        phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
        country_code: 1,
      },
    },
    social_security_number: UPDATE_PATIENT_MOCK.guarantor.ssn,
  },
  medical_power_of_attorney: {
    name: {
      preferred_name: UPDATE_PATIENT_MOCK.powerOfAttorney.name,
    },
    patient_relation: {
      relation: RelationToPatient.RELATION_TO_PATIENT_SELF,
      other_relation_text: 'patient',
    },
    contact_info: {
      mobile_number: {
        phone_number: '1000460800',
        phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
        country_code: 1,
      },
    },
  },
};

export const CREATE_PATIENT_TRANSFORMED_MOCK: Patient = {
  id: PATIENT_ID_MOCK,
  ssn: '234234234',
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  ehrPatientId: undefined,
  gender: 'male',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  consistencyToken: new Uint8Array(8),
};

export const GET_PATIENT_TRANSFORMED_MOCK: Patient = {
  id: 961997,
  suffix: 'Mr',
  firstName: 'John',
  lastName: 'Doe',
  ssn: '234234234',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  gender: 'male',
  address: {
    city: 'test-city',
    state: 'test-state',
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
  },
  patientSafetyFlag: {
    flagReason: 'Provider Safety',
    flagType: 'permanent',
  },
  consistencyToken: new Uint8Array(8),
};

export const UPDATE_PATIENT_TRANSFORMED_MOCK: Patient = {
  id: PATIENT_ID_MOCK,
  ssn: '754345',
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  ehrPatientId: undefined,
  gender: 'male',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  guarantor: {
    lastName: 'Kerthwood',
    firstName: 'Kevin',
    email: 'guarantor@test.test',
    dob: '1999-12-25',
    billingAddressCity: 'Springfield',
    billingAddressZipcode: '45368',
    billingAddressState: 'MN',
    billingAddressStreetAddress1: '414 Howard street',
    billingAddressStreetAddress2: '39-25',
    phone: '8004601000',
    relationToPatient: 'friend',
    ssn: '6345345',
  },
  powerOfAttorney: {
    phone: '1000460800',
    name: 'Test aD',
    phoneNumber: {
      mobile: true,
    },
    relationship: 'patient',
  },
  consistencyToken: new Uint8Array(8),
};

export const PATIENTS_SEARCH_TRANSFORMED_RESULT_MOCK: Array<Patient> = [
  GET_PATIENT_TRANSFORMED_MOCK,
  UPDATE_PATIENT_TRANSFORMED_MOCK,
];

export const PATIENTS_SEARCH_TRANSFORMED_RESULT_WITH_OFFSET_MOCK: Array<Patient> =
  [UPDATE_PATIENT_TRANSFORMED_MOCK];

export const PATIENTS_SEARCH_SORTED_TRANSFORMED_RESULT_WITH_OFFSET_MOCK: Array<Patient> =
  [
    {
      id: PATIENTS_ID_LIST_MOCK[2],
      firstName: 'test',
      lastName: 'test2',
      dateOfBirth: '1993-03-03',
      consistencyToken: new Uint8Array(8),
    },
    {
      id: PATIENTS_ID_LIST_MOCK[0],
      firstName: 'test',
      lastName: 'test0',
      dateOfBirth: '1993-03-01',
      consistencyToken: new Uint8Array(8),
    },
    {
      id: PATIENTS_ID_LIST_MOCK[3],
      firstName: 'test',
      lastName: 'test3',
      dateOfBirth: '1993-03-04',
      consistencyToken: new Uint8Array(8),
    },
    {
      id: PATIENTS_ID_LIST_MOCK[1],
      firstName: 'test',
      lastName: 'test1',
      dateOfBirth: '1993-03-02',
      consistencyToken: new Uint8Array(8),
    },
  ];

export const CREATE_GRPC_PATIENT_RESPONSE_MOCK: CreatePatientResponse = {
  patient: CREATE_GRPC_PATIENT_MOCK,
  consistency_token: new Uint8Array(8),
};

export const GET_GRPC_PATIENT_RESPONSE_MOCK: GetPatientResponse = {
  patient: GET_GRPC_PATIENT_MOCK,
  consistency_token: new Uint8Array(8),
};

export const GET_OR_CREATE_GRPC_PATIENT_RESPONSE_MOCK: FindOrCreatePatientForUnverifiedPatientResponse =
  {
    patient: GET_GRPC_PATIENT_MOCK,
    consistency_token: new Uint8Array(8),
  };

export const UPDATE_GRPC_PATIENT_RESPONSE_MOCK: UpdatePatientResponse = {
  patient: UPDATE_GRPC_PATIENT_MOCK,
  consistency_token: new Uint8Array(8),
};

export const SEARCH_GRPC_PATIENTS_RESPONSE_MOCK: SearchPatientsResponse = {
  results: [
    {
      patient: GET_GRPC_PATIENT_MOCK,
      consistency_token: new Uint8Array(8),
    },
    {
      patient: UPDATE_GRPC_PATIENT_MOCK,
      consistency_token: new Uint8Array(8),
    },
  ],
};

export const SEARCH_GRPC_PATIENTS_EMPTY_RESPONSE_MOCK: SearchPatientsResponse =
  {
    results: [],
  };

export const SEARCH_GRPC_PATIENTS_WITH_ID_RESPONSE_MOCK: SearchPatientsResponse =
  {
    results: [
      {
        patient: {
          id: PATIENTS_ID_LIST_MOCK[0].toString(),
          name: {
            given_name: 'test',
            family_name: 'test0',
          },
          date_of_birth: {
            day: 1,
            month: 3,
            year: 1993,
          },
          additional_identifiers: [],
          billing_city: {
            id: '0',
          },
        },
        consistency_token: new Uint8Array(8),
      },
      {
        patient: {
          id: PATIENTS_ID_LIST_MOCK[1].toString(),
          name: {
            given_name: 'test',
            family_name: 'test1',
          },
          date_of_birth: {
            day: 2,
            month: 3,
            year: 1993,
          },
          additional_identifiers: [],
          billing_city: {
            id: '1',
          },
        },
        consistency_token: new Uint8Array(8),
      },
      {
        patient: {
          id: PATIENTS_ID_LIST_MOCK[2].toString(),
          name: {
            given_name: 'test',
            family_name: 'test2',
          },
          date_of_birth: {
            day: 3,
            month: 3,
            year: 1993,
          },
          additional_identifiers: [],
          billing_city: {
            id: '2',
          },
        },
        consistency_token: new Uint8Array(8),
      },
      {
        patient: {
          id: PATIENTS_ID_LIST_MOCK[3].toString(),
          name: {
            given_name: 'test',
            family_name: 'test3',
          },
          date_of_birth: {
            day: 4,
            month: 3,
            year: 1993,
          },
          additional_identifiers: [],
          billing_city: {
            id: '3',
          },
        },
        consistency_token: new Uint8Array(8),
      },
    ],
  };

export const SEARCH_GRPC_PATIENTS_WITHOUT_LIST_RESPONSE_MOCK: SearchPatientsResponse =
  {
    results: [],
  };

export const UPDATE_UNVERIFIED_PATIENT_MOCK: GrpcUnverifiedPatient = {
  id: 1,
  athena_id: 0,
  given_name: UPDATE_GRPC_PATIENT_MOCK.name?.given_name,
  family_name: UPDATE_GRPC_PATIENT_MOCK.name?.family_name,
  date_of_birth: UPDATE_GRPC_PATIENT_MOCK.date_of_birth,
  birth_sex: UPDATE_GRPC_PATIENT_MOCK.birth_sex,
  legal_sex: UPDATE_GRPC_PATIENT_MOCK.sex,
  phone_number: {
    phone_number:
      UPDATE_GRPC_PATIENT_MOCK.contact_info?.mobile_number?.phone_number,
    phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_UNSPECIFIED,
    country_code: 1,
  },
  gender_identity: {
    category: GenderIdentity_Category.CATEGORY_MALE,
  },
};

export const UPDATE_UNVERIFIED_PATIENT_TRANSFORMED_MOCK: UnverifiedPatient = {
  id: UPDATE_UNVERIFIED_PATIENT_MOCK.id,
  givenName: UPDATE_UNVERIFIED_PATIENT_MOCK.given_name,
  familyName: UPDATE_UNVERIFIED_PATIENT_MOCK.family_name,
  legalSex: 'male',
  dateOfBirth: '1981-05-01',
  genderIdentity: GenderIdentityCategory.CATEGORY_MALE,
  phoneNumber: '0923319057',
  consistencyToken: new Uint8Array(8),
};

export const UPDATE_UNVERIFIED_GRPC_PATIENT_RESPONSE_MOCK: UpdateUnverifiedPatientResponse =
  {
    patient: UPDATE_UNVERIFIED_PATIENT_MOCK,
    consistency_token: new Uint8Array(8),
  };

export const INSURANCE_PARAMS_MOCK: InsuranceParams = {
  priority: '1',
  memberId: '12345',
  companyName: 'Aetna Commercial',
  primaryInsuranceHolderToggle: 'patient',
  insuredSameAsPatient: true,
  packageId: 1,
  insurancePlanId: 1,
  patientRelationToSubscriber: 'other',
  patientRelationshipToInsured: 'other',
  primaryInsuranceHolderAttributes: {
    firstName: 'Doe',
    middleInitial: 'P',
    lastName: 'John',
    gender: 'male',
    patientRelationshipToInsured: 'self',
  },
  gender: 'male',
  firstName: 'Doe',
  lastName: 'John ',
  middleInitial: 'P',
  skipProcessing: true,
  cardFront:
    'https://uat.*company-data-covered*.com/card_front/default/408265/1644241415-card_front.png',
  cardBack:
    'https://uat.*company-data-covered*.com/card_front/default/408265/1654241415-card_front.png',
  eligibilityStatus: 'unspecified',
  eligibilityMessage: 'unspecified',
};

export const INSURANCE_RESPONSE_MOCK: CreateInsuranceResponse = {
  insurance_record: {
    ...INSURANCE_RECORD_MOCK,
    id: '1',
    group_id: '56789',
    updated_at: {
      seconds: Math.floor(
        new Date('2023-07-07T12:34:56.123Z').getTime() / 1000
      ),
      nanos: 123000000,
    },
  },
  consistency_token: new Uint8Array(8),
};

export const LIST_INSURANCE_RESPONSE_MOCK: ListInsurancesResponse = {
  results: [
    {
      insurance_record: {
        ...INSURANCE_RECORD_MOCK,
        id: '1',
        group_id: '56789',
        updated_at: {
          seconds: Math.floor(
            new Date('2023-07-07T12:34:56.123Z').getTime() / 1000
          ),
          nanos: 123000000,
        },
      },
      consistency_token: new Uint8Array(8),
    },
  ],
};

export const LIST_INSURANCE_RESPONSE_WITHOUT_INSURANCE_PLAN_ID_MOCK: ListInsurancesResponse =
  {
    results: [
      {
        insurance_record: {
          ...INSURANCE_RECORD_WITHOUT_INSURANCE_PLAN_ID_MOCK,
          id: '1',
          group_id: '56789',
          updated_at: {
            seconds: Math.floor(
              new Date('2023-07-07T12:34:56.123Z').getTime() / 1000
            ),
            nanos: 123000000,
          },
        },
        consistency_token: new Uint8Array(8),
      },
    ],
  };
