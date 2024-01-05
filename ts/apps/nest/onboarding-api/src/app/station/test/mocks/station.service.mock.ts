import {
  CareRequestType,
  CheckMarketAvailabilityBody,
  OssCareRequest,
  OssStationCareRequest,
  RequestedServiceLine,
  State,
  StationCheckMarketAvailabilityBody,
  StationState,
  CheckMarketAvailability,
  StationBillingCityPlaceOfService,
  BillingCityPlaceOfService,
  StationEtaRange,
  EtaRange,
  StationProtocolWithQuestions,
  RiskStratificationProtocolSearchParam,
  ProtocolWithQuestions,
} from '@*company-data-covered*/consumer-web-types';
import EtaRangeQueryDTO from '../../../self-schedule/dto/create-eta-range.dto';

export const STATION_CREATE_NOTIFICATION_MOCK = {
  job_id: '123',
};

export const checkMarketAvailabilityResponse: CheckMarketAvailability = {
  availability: 'available',
};

export const STATION_CARE_REQUEST_RESPONSE: OssStationCareRequest = {
  care_request: {
    id: 82,
    chief_complaint: 'cough',
    patient_id: null,
    channel_item_id: 1,
    requested_service_line: RequestedServiceLine.acuteCare,
    place_of_service: null,
    market_id: null,
    request_type: CareRequestType.oss,
    channel_item_selected_with_origin_phone: 'string',
    bypass_screening_protocol: false,
    request_status: null,
    caller_id: 8,
    service_line_id: null,
    assignment_status: null,
    billing_city_id: null,
    assignment_date: null,
    street_address_1: '6211 E 42nd Ave',
    street_address_2: '',
    city: 'Denver',
    state: 'CO',
    zipcode: '80216-4656',
    caller: {
      relationship_to_patient: 'patient',
      first_name: 'first name',
      last_name: 'last name',
      origin_phone: '3035001518',
      dh_phone: '3035001518',
      contact_id: '123',
    },
    caller_attributes: {
      relationship_to_patient: 'patient',
      first_name: 'first name',
      last_name: 'last name',
      origin_phone: '3035001518',
      dh_phone: '3035001518',
      contact_id: '123',
    },
  },
  risk_assessment: {
    id: 16,
    protocol_name: 'General Complaint',
    score: 0,
    responses: {
      questions: [
        {
          weight_yes: 5.5,
          weight_no: 0,
          required: false,
          protocol_id: 111,
          order: 0,
          name: 'Due to the recent Coronavirus world-wide concerns we are screening patients for potential exposure. Have you tested positive for COVID-19?',
          id: 123232,
          allow_na: false,
          answer: 'No',
          has_notes: false,
        },
      ],
    },
    user_id: null,
    override_reason: 'General Complaint',
    overridden_at: null,
    created_at: '2023-07-07T11:54:03.401Z',
    updated_at: '2023-07-07T11:54:03.401Z',
    protocol_id: 0,
    protocol_score: null,
    dob: '1901-01-10',
    gender: 'Male',
    worst_case_score: 0,
    protocol_tags: null,
    chief_complaint: 'Vision problem',
    selected_symptoms: 'Vision problem|Headache',
    type: null,
  },
  mpoa_consent: {
    id: 2,
    consented: true,
    time_of_consent_change: new Date('2023-07-07T11:54:03.401Z'),
    user_id: 84949,
    power_of_attorney_id: 90380,
  },
};

export const CREATE_CARE_REQUEST_RESPONSE: OssCareRequest = {
  careRequest: {
    id: 82,
    marketId: null,
    requestType: CareRequestType.oss,
    requesterId: 8,
    requestedServiceLine: RequestedServiceLine.acuteCare,
    patientId: null,
    assignmentStatus: null,
    requestStatus: null,
    serviceLineId: null,
    channelItemId: 1,
    billingCityId: null,
    placeOfService: null,
    address: {
      city: 'Denver',
      state: 'CO',
      zip: '80216-4656',
      streetAddress1: '6211 E 42nd Ave',
      streetAddress2: '',
    },
    complaint: {
      symptoms: 'cough',
    },
    bypassSreeningProtocol: false,
    channelItemSelectedWithOriginPhone: 'string',
    assignmentDate: null,
    requester: {
      relationToPatient: 'patient',
      firstName: 'first name',
      lastName: 'last name',
      phone: '3035001518',
      conversationId: '123',
      dhPhone: '3035001518',
    },
  },
  riskAssessment: {
    createdAt: '2023-07-07T11:54:03.401Z',
    dob: '1901-01-10',
    gender: 'Male',
    id: 16,
    overriddenAt: null,
    overrideReason: 'General Complaint',
    protocolId: 0,
    protocolName: 'General Complaint',
    protocolScore: null,
    protocolTags: null,
    responses: {
      questions: [
        {
          weightYes: 5.5,
          weightNo: 0,
          required: false,
          protocolId: 111,
          order: 0,
          name: 'Due to the recent Coronavirus world-wide concerns we are screening patients for potential exposure. Have you tested positive for COVID-19?',
          id: 123232,
          allowNa: false,
          answer: 'No',
          hasNotes: false,
        },
      ],
    },
    score: 0,
    type: null,
    updatedAt: '2023-07-07T11:54:03.401Z',
    userId: null,
    worstCaseScore: 0,
    complaint: {
      symptom: 'Vision problem',
      selectedSymptoms: 'Vision problem|Headache',
    },
  },
  mpoaConsent: {
    consented: true,
    powerOfAttorneyId: 90380,
    timeOfConsentChange: new Date('2023-07-07T11:54:03.401Z'),
    userId: 84949,
    id: 2,
  },
};

export const checkFeasibilityRequestBody: CheckMarketAvailabilityBody = {
  zipcode: '80218',
  marketId: 159,
  date: '2022-08-15',
  latitude: 34.5342242,
  longitude: 23.435532432,
  startTimeSec: 123147841,
  endTimeSec: 13235343,
};

export const checkFeasibilityStationRequestBody: StationCheckMarketAvailabilityBody =
  {
    zipcode: '80218',
    market_id: 159,
    date: '2022-08-15',
    latitude: 34.5342242,
    longitude: 23.435532432,
    start_timestamp_sec: 123147841,
    end_timestamp_sec: 13235343,
  };

export const mockStationBillingCityPlaceOfService: StationBillingCityPlaceOfService[] =
  [
    {
      id: 37,
      billing_city_id: 19,
      place_of_service: 'Home',
      instamed_terminal_id: '0002',
      athena_department_id: '68',
      active: true,
    },
    {
      id: 38,
      billing_city_id: 19,
      place_of_service: 'Work',
      instamed_terminal_id: null,
      athena_department_id: null,
      active: false,
    },
    {
      id: 39,
      billing_city_id: 19,
      place_of_service: 'Independent Living Facility',
      instamed_terminal_id: null,
      athena_department_id: null,
      active: false,
    },
    {
      id: 40,
      billing_city_id: 19,
      place_of_service: 'Assisted Living Facility',
      instamed_terminal_id: '0001',
      athena_department_id: '67',
      active: true,
    },
    {
      id: 41,
      billing_city_id: 19,
      place_of_service: 'Skilled Nursing Facility',
      instamed_terminal_id: null,
      athena_department_id: null,
      active: false,
    },
  ];

export const mockBillingCityPlaceOfService: BillingCityPlaceOfService[] = [
  {
    id: 37,
    billingCityId: 19,
    placeOfService: 'Home',
    instamedTerminalId: '0002',
    athenaDepartmentId: '68',
    active: true,
  },
  {
    id: 38,
    billingCityId: 19,
    placeOfService: 'Work',
    instamedTerminalId: null,
    athenaDepartmentId: null,
    active: false,
  },
  {
    id: 39,
    billingCityId: 19,
    placeOfService: 'Independent Living Facility',
    instamedTerminalId: null,
    athenaDepartmentId: null,
    active: false,
  },
  {
    id: 40,
    billingCityId: 19,
    placeOfService: 'Assisted Living Facility',
    instamedTerminalId: '0001',
    athenaDepartmentId: '67',
    active: true,
  },
  {
    id: 41,
    billingCityId: 19,
    placeOfService: 'Skilled Nursing Facility',
    instamedTerminalId: null,
    athenaDepartmentId: null,
    active: false,
  },
];

export const STATION_STATE_FETCH_MOCK: StationState = {
  id: 1,
  name: 'Colorado',
  abbreviation: 'CO',
  created_at: '2000-01-01T07:00:00.000Z',
  updated_at: '2000-01-01T07:00:00.000Z',
};

export const STATE_FETCH_RESPONSE_MOCK: State = {
  id: 1,
  name: 'Colorado',
  abbreviation: 'CO',
  createdAt: '2000-01-01T07:00:00.000Z',
  updatedAt: '2000-01-01T07:00:00.000Z',
};

export const STATION_ASSIGN_TEAM_CREATE_ETA_RESPONSE: StationEtaRange = {
  care_request_id: 644228,
  care_request_status_id: 4004526,
  created_at: '2022-02-03T22:40:06.598Z',
  updated_at: '2022-02-03T22:40:06.598Z',
  id: 5011,
  starts_at: '2022-02-04T07:00:00.585Z',
  ends_at: '2022-04-02T14:00:00.585Z',
  user_id: 9999,
};

export const ETA_RANGE_QUERY_MOCK: EtaRangeQueryDTO = {
  careRequestId: 614009,
  careRequestStatusId: 4004526,
  endsAt: '2022-04-04T14:00:00.585Z',
  startsAt: '2022-04-04T07:00:00.585Z',
};

export const CREATE_ETA_RANGE_RESPONSE: EtaRange = {
  careRequestId: 644228,
  careRequestStatusId: 4004526,
  createdAt: '2022-02-03T22:40:06.598Z',
  updatedAt: '2022-02-03T22:40:06.598Z',
  id: 5011,
  startsAt: '2022-02-04T07:00:00.585Z',
  endsAt: '2022-04-02T14:00:00.585Z',
  userId: 9999,
};

export const STATION_RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK: StationProtocolWithQuestions =
  {
    id: 3057,
    name: 'General Complaint',
    weight: 4,
    high_risk: false,
    general: true,
    questions: [
      {
        id: 24046,
        name: "*** Care ambassador - This Risk Stratification should ONLY BE USED WHEN YOU ARE UNABLE TO FIND ANY OTHER CATEGORY FOR THE PATIENT'S COMPLAINT.  If the patient has any specific complaint (ex WEAKNESS or CONFUSION) please use the associated Risk Stratification. If the patient seems too confused to provide a specific complaint, obtain a secondary screen from an RN, APP or Physician.",
        order: 0,
        weight_yes: 0,
        weight_no: 0,
        protocol_id: 3057,
        allow_na: false,
        has_notes: false,
      },
      {
        id: 24047,
        name: 'Do you feel that you have a life threatening emergency or that you need to go to the hospital immediately for help?',
        order: 1,
        weight_yes: 10,
        weight_no: 0,
        protocol_id: 3057,
        allow_na: false,
        has_notes: false,
      },
      {
        id: 24048,
        name: 'Are you having NEW numbness or weakness of the face, arm or leg today? ***Care ambassador - If YES, answer YES and skip to the next question box. If NO, ask: "Are you having NEW trouble speaking today?" If YES, answer YES. If NO, answer NO.',
        order: 2,
        weight_yes: 10,
        weight_no: 0,
        protocol_id: 3057,
        allow_na: false,
        has_notes: false,
      },
      {
        id: 24049,
        name: 'Are you having NEW chest pain or discomfort today? *** Care ambassador -- If YES, answer YES and skip to the next question box. If NO, ask: "Are you having NEW trouble breathing today?" If YES answer YES. If NO, answer NO.',
        order: 3,
        weight_yes: 1.5,
        weight_no: 0,
        protocol_id: 3057,
        allow_na: false,
        has_notes: false,
      },
      {
        id: 24050,
        name: 'In the past 2 weeks, have you or anyone in your household tested positive for COVID-19?',
        order: 4,
        weight_yes: 0,
        weight_no: 0,
        protocol_id: 3057,
        allow_na: false,
        has_notes: false,
      },
    ],
  };

export const RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK: RiskStratificationProtocolSearchParam =
  {
    dob: '2000-01-01',
    gender: 'male',
    serviceLineId: 1,
  };

export const PROTOCOL_ID = '3057';

export const RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK: ProtocolWithQuestions =
  {
    id: 3057,
    name: 'General Complaint',
    weight: 4,
    highRisk: false,
    general: true,
    questions: [
      {
        id: 24046,
        name: "*** Care ambassador - This Risk Stratification should ONLY BE USED WHEN YOU ARE UNABLE TO FIND ANY OTHER CATEGORY FOR THE PATIENT'S COMPLAINT.  If the patient has any specific complaint (ex WEAKNESS or CONFUSION) please use the associated Risk Stratification. If the patient seems too confused to provide a specific complaint, obtain a secondary screen from an RN, APP or Physician.",
        order: 0,
        weightYes: 0,
        weightNo: 0,
        protocolId: 3057,
        allowNa: false,
        hasNotes: false,
      },
      {
        id: 24047,
        name: 'Do you feel that you have a life threatening emergency or that you need to go to the hospital immediately for help?',
        order: 1,
        weightYes: 10,
        weightNo: 0,
        protocolId: 3057,
        allowNa: false,
        hasNotes: false,
      },
      {
        id: 24048,
        name: 'Are you having NEW numbness or weakness of the face, arm or leg today? ***Care ambassador - If YES, answer YES and skip to the next question box. If NO, ask: "Are you having NEW trouble speaking today?" If YES, answer YES. If NO, answer NO.',
        order: 2,
        weightYes: 10,
        weightNo: 0,
        protocolId: 3057,
        allowNa: false,
        hasNotes: false,
      },
      {
        id: 24049,
        name: 'Are you having NEW chest pain or discomfort today? *** Care ambassador -- If YES, answer YES and skip to the next question box. If NO, ask: "Are you having NEW trouble breathing today?" If YES answer YES. If NO, answer NO.',
        order: 3,
        weightYes: 1.5,
        weightNo: 0,
        protocolId: 3057,
        allowNa: false,
        hasNotes: false,
      },
      {
        id: 24050,
        name: 'In the past 2 weeks, have you or anyone in your household tested positive for COVID-19?',
        order: 4,
        weightYes: 0,
        weightNo: 0,
        protocolId: 3057,
        allowNa: false,
        hasNotes: false,
      },
    ],
  };
