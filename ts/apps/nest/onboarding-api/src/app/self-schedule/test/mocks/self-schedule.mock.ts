import {
  CareRequestType,
  OSSUserCache,
  OssCareRequest,
  OssCareRequestAcceptIfFeasible,
  OssCareRequestStatusPayload,
  RequestedServiceLine,
  StationAcceptCareRequestIfFeasiblePayload,
  StationCareRequestStatusPayload,
} from '@*company-data-covered*/consumer-web-types';

export const OSS_CARE_REQUEST_MOCK: OssCareRequest = {
  careRequest: {
    marketId: 159,
    id: 159,
    requestType: CareRequestType.phone,
    placeOfService: 'Home',
    requester: {
      relationToPatient: 'patient',
      firstName: 'first name',
      lastName: 'last name',
      phone: '3035001518',
      conversationId: '123',
      dhPhone: '3035001518',
    },
    address: {
      city: 'Denver',
      state: 'CO',
      zip: '80216-4656',
      streetAddress1: '6211 E 42nd Ave',
      streetAddress2: '',
      latitude: '39.7750588',
      longitude: '-104.9156156',
    },
    channelItem: {
      id: 1,
      name: 'Health System Organization',
    },
    complaint: {
      symptoms: 'cough',
    },
    requestedServiceLine: RequestedServiceLine.acuteCare,
    patientPreferredEta: {
      patientPreferredEtaStart: '2023-09-21T10:37:39.000Z',
      patientPreferredEtaEnd: '2023-09-22T10:37:39.000Z',
    },
  },
  riskAssessment: {
    id: 17020,
    protocolId: 2903,
    protocolName: 'Advanced Care',
    score: 0,
    responses: {
      questions: [
        {
          weightYes: 0,
          weightNo: 0,
          required: false,
          protocolId: 2903,
          order: null,
          name: 'Does this patient meet initial Advanced Care criteria?',
          id: 23016,
          hasNotes: false,
          allowNa: false,
          answer: 'No',
        },
      ],
    },
    userId: 84891,
    overrideReason: null,
    overriddenAt: null,
    createdAt: '2021-10-11T16:28:13.808Z',
    updatedAt: '2021-10-11T16:28:13.808Z',
    protocolScore: null,
    dob: '1956-07-08',
    gender: 'female',
    worstCaseScore: 0,
    protocolTags: null,
    type: null,
    complaint: {
      symptom: 'Vision Problem',
      selectedSymptoms: 'Vision problem|Headache',
    },
  },
  mpoaConsent: {
    consented: true,
    powerOfAttorneyId: 90380,
    timeOfConsentChange: new Date('2021-10-11T16:28:13.808Z'),
    userId: 84949,
    id: 2,
  },
};

export const MOCK_OSS_USER_ID = 'userid';

export const MOCK_OSS_USER_CACHE: OSSUserCache = {
  requester: {
    relationToPatient: 'self',
    firstName: 'Alice',
    lastName: 'Liddell',
    phone: 'wonderphone',
    dhPhone: 'direct wonderphone',
    conversationId: 'none',
    organizationName: 'wonder org',
  },
  symptoms: 'headache',
  addressId: 1234,
  patientId: 12345,
  preferredEta: {
    patientPreferredEtaStart: 'today',
    patientPreferredEtaEnd: 'tomorrow',
  },
  careRequestId: 123,
  marketId: 159,
};

export const { careRequestId: _, ...MOCK_OSS_USER_CACHE_WITHOUT_CR_ID } =
  MOCK_OSS_USER_CACHE;

export const MOCK_STRINGIFIED_USER_CACHE: string =
  JSON.stringify(MOCK_OSS_USER_CACHE);

export const UPDATE_CARE_REQUEST_MOCK: OssCareRequestStatusPayload = {
  careRequestId: '1234',
  status: 'archived',
  comment: 'Test',
  shiftTeamId: 0,
  reassignmentReasonText: '',
  reassignmentReasonOtherText: '',
};

export const STATION_UPDATE_CARE_REQUEST_MOCK: StationCareRequestStatusPayload =
  {
    request_status: 'archived',
    comment: 'Test',
    meta_data: undefined,
    reassignment_reason: '',
    reassignment_reason_other: '',
  };

export const MOCK_INSURANCE_CLASSIFICATION = [
  {
    id: 1,
    name: 'Test 1',
  },
  {
    id: 1,
    name: 'Test 2',
  },
];

export const MOCK_INSURANCE_CLASSIFICATION_RESPONSE = {
  data: MOCK_INSURANCE_CLASSIFICATION,
  success: true,
};

export const ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK: OssCareRequestAcceptIfFeasible =
  {
    careRequestId: '1234',
    comment: 'Test',
    shiftTeamId: 0,
    reassignmentReasonText: '',
    reassignmentReasonOtherText: '',
  };

export const STATION_ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK: StationAcceptCareRequestIfFeasiblePayload =
  {
    comment: 'Test',
    meta_data: undefined,
    reassignment_reason: '',
    reassignment_reason_other: '',
    skip_feasibility_check: false,
  };
