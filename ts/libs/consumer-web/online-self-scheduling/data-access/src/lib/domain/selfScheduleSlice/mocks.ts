import {
  BillingCityPlaceOfService,
  CareRequestType,
  InsuranceClassification,
  InsuranceNetwork,
  RequestedServiceLine,
} from '@*company-data-covered*/consumer-web-types';
import {
  GetPlacesOfServiceQuery,
  RelationToPatient,
  SelfScheduleData,
  CreateSelfScheduleNotificationJobResponse,
  CheckMarketFeasibilityPayload,
  CheckMarketFeasibilityData,
  MarketFeasibilityStatus,
  DomainInsurancePayer,
  GetRiskStratificationProtocolQuery,
  DomainRiskStratificationProtocol,
  CreateCareRequestPayload,
  CreateCareRequestResponse,
  DomainCareRequest,
  DomainEtaRange,
  InsurancePayerData,
  UpdateCareRequestPayload,
  DomainChannelItem,
} from '../../types';

export const mockSelfScheduleData: Required<SelfScheduleData> & {
  preferredEta: Required<SelfScheduleData['preferredEta']>;
} = {
  preferredEta: {
    patientPreferredEtaStart: '2023-07-05T12:00:00-04:00',
    patientPreferredEtaEnd: '2023-07-05T17:00:00-04:00',
  },
  symptoms: 'Cough',
  patientId: 1,
  marketId: 159,
  addressId: 1,
  requester: {
    firstName: 'John',
    lastName: 'Doe',
    relationToPatient: RelationToPatient.Patient,
    phone: '1234567890',
  },
  channelItemId: '123',
  powerOfAttorney: { name: 'POADefaultName', patientId: 1 },
  patientInfo: { middleName: 'Joseph', suffix: 'Mr' },
  careRequestId: 1,
};

export const mockPlacesOfServiceQuery: GetPlacesOfServiceQuery = {
  billingCityId: 19,
};

export const mockPlacesOfService: Required<BillingCityPlaceOfService>[] = [
  {
    id: 51,
    placeOfService: 'Home',
    active: true,
    billingCityId: 5,
    athenaDepartmentId: '2',
    instamedTerminalId: '0001',
  },
  {
    id: 53,
    placeOfService: 'Independent Living Facility',
    active: true,
    billingCityId: 5,
    athenaDepartmentId: '2',
    instamedTerminalId: '0001',
  },
];

export const mockCreateNotificationJobResponse: CreateSelfScheduleNotificationJobResponse =
  {
    success: true,
    jobId: '12345',
  };

export const mockCheckMarketFeasibilityPayload: CheckMarketFeasibilityPayload =
  {
    zipcode: '80205',
    marketId: 159,
    date: '07-24-2023',
  };

export const mockCheckMarketFeasibilityData: CheckMarketFeasibilityData = {
  availability: MarketFeasibilityStatus.Available,
};

export const mockInsurancePayer: DomainInsurancePayer = {
  id: 1,
  name: 'A Insurance 1',
  notes: 'note',
  active: true,
  payerGroupId: 2,
  createdAt: '2011-10-05T14:48:00.000Z',
  updatedAt: '2011-10-06T14:48:00.000Z',
  deletedAt: '2011-10-07T14:48:00.000Z',
  stateAbbrs: ['CA'],
};

export const mockedInsuranceNetwork: InsuranceNetwork = {
  id: '1',
  name: 'Awesome Network 1',
  active: true,
  packageId: '123',
  notes: 'very cool network',
  insuranceClassificationId: '1',
  insurancePlanId: '1',
  insurancePayerId: '1',
  insurancePayerName: 'Awesome Payer',
  eligibilityCheck: true,
  providerEnrollment: true,
  claimsAddress: {
    streetAddress1: 'Address1',
    streetAddress2: 'Address2',
    city: 'City',
    state: 'Pennsylvania',
    zip: '80105',
  },
  createdAt: '2023-03-21T14:44:44.432Z',
  updatedAt: '2023-03-21T14:44:44.432Z',
  stateAbbrs: ['AS1'],
  addresses: [],
};

export const mockedInsuranceNetworksList: InsuranceNetwork[] = [
  mockedInsuranceNetwork,
  {
    ...mockedInsuranceNetwork,
    id: '2',
    name: 'Awesome Network 2',
  },
  {
    ...mockedInsuranceNetwork,
    id: '3',
    name: 'Awesome Network 3',
  },
];

export const mockedPayersWithClassifications: InsurancePayerData[] = [
  {
    id: '1',
    name: 'Awesome Payer 1',
    classificationId: '1',
    classificationName: 'Awesome Classification 1',
    stateAbbrs: ['AS1'],
  },
  {
    id: '2',
    name: 'Awesome Payer 2',
    classificationId: '2',
    classificationName: 'Awesome Classification 2',
    stateAbbrs: ['AS1'],
  },
];

export const mockedPayersWithEmptyClassifications: InsurancePayerData[] =
  mockedPayersWithClassifications.map((payer) => ({
    ...payer,
    classificationName: undefined,
  }));

export const mockedPayersFromNetwork = [
  {
    id: '1',
    name: 'Awesome Payer 1',
    classificationId: '1',
    stateAbbrs: ['AS1'],
  },
  {
    id: '2',
    name: 'Awesome Payer 2',
    classificationId: '2',
    stateAbbrs: ['AS1'],
  },
];

export const mockedNetworksListWithDifferentPayers: InsuranceNetwork[] = [
  {
    id: '1',
    name: 'Awesome Network 1',
    active: true,
    packageId: '123',
    notes: 'very cool network',
    insuranceClassificationId: '1',
    insurancePlanId: '1',
    insurancePayerId: '1',
    insurancePayerName: 'Awesome Payer 1',
    eligibilityCheck: true,
    providerEnrollment: true,
    claimsAddress: {
      streetAddress1: 'Address1',
      streetAddress2: 'Address2',
      city: 'City',
      state: 'Pennsylvania',
      zip: '80105',
    },
    createdAt: '2023-03-21T14:44:44.432Z',
    updatedAt: '2023-03-21T14:44:44.432Z',
    stateAbbrs: ['AS1'],
    addresses: [],
  },
  {
    id: '2',
    name: 'Awesome Network 2',
    active: true,
    packageId: '123',
    notes: 'very cool network',
    insuranceClassificationId: '2',
    insurancePlanId: '1',
    insurancePayerId: '2',
    insurancePayerName: 'Awesome Payer 2',
    eligibilityCheck: true,
    providerEnrollment: true,
    claimsAddress: {
      streetAddress1: 'Address1',
      streetAddress2: 'Address2',
      city: 'City',
      state: 'Pennsylvania',
      zip: '80105',
    },
    createdAt: '2023-03-21T14:44:44.432Z',
    updatedAt: '2023-03-21T14:44:44.432Z',
    stateAbbrs: ['AS1'],
    addresses: [],
  },
];

export const mockGetRiskStratificationProtocolQuery: GetRiskStratificationProtocolQuery =
  {
    id: '461',
    gender: 'm',
    dob: '2000-01-01',
  };

export const mockRiskStratificationProtocol: DomainRiskStratificationProtocol =
  {
    id: '461',
    weight: 5,
    name: 'General Complaint',
    general: true,
    questions: [
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
    ],
  };

export const mockCreateCareRequestPayload: CreateCareRequestPayload = {
  careRequest: {
    requestedServiceLine: RequestedServiceLine.acuteCare,
    patientId: 1,
    marketId: 1,
    placeOfService: 'Home',
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
  },
  riskAssessment: {
    dob: '1901-01-10',
    gender: 'Male',
    overrideReason: 'General Complaint',
    protocolId: 0,
    protocolName: 'General Complaint',
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
    score: 5,
    worstCaseScore: 0,
    complaint: {
      symptom: 'Vision problem',
      selectedSymptoms: 'Headache',
    },
  },
  mpoaConsent: {
    consented: true,
    powerOfAttorneyId: 90380,
    timeOfConsentChange: '2023-07-07T11:54:03.401Z',
    userId: 84949,
    id: 2,
  },
};

export const mockCreateCareRequestResponse: CreateCareRequestResponse = {
  careRequest: {
    id: 82,
    marketId: 1,
    requestType: CareRequestType.oss,
    requesterId: 8,
    requestedServiceLine: RequestedServiceLine.acuteCare,
    patientId: 1,
    channelItemId: 1,
    billingCityId: 1,
    placeOfService: 'Home',
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
    assignmentDate: '2023-07-07',
  },
  riskAssessment: {
    createdAt: '2023-07-07T11:54:03.401Z',
    dob: '1901-01-10',
    gender: 'Male',
    id: 16,
    overrideReason: 'General Complaint',
    protocolId: 0,
    protocolName: 'General Complaint',
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

    updatedAt: '2023-07-07T11:54:03.401Z',
    worstCaseScore: 0,
    complaint: {
      symptom: 'Vision problem',
      selectedSymptoms: 'Vision problem',
    },
  },
  mpoaConsent: {
    consented: true,
    powerOfAttorneyId: 90380,
    timeOfConsentChange: '2023-07-07T11:54:03.401Z',
    userId: 84949,
    id: 2,
  },
};

export const mockCareRequest: Required<
  Pick<
    DomainCareRequest,
    | 'id'
    | 'marketId'
    | 'requestType'
    | 'placeOfService'
    | 'patient'
    | 'address'
    | 'channelItem'
    | 'complaint'
  >
> = {
  id: 1,
  marketId: 2,
  requestType: CareRequestType.oss,
  placeOfService: 'Home',
  patient: {
    id: 2,
    firstName: 'Davy',
    lastName: 'Jones',
  },
  address: {
    id: 1,
    city: 'Denver',
    state: 'Colorado',
    zip: 'zipCode',
    streetAddress1: 'Awesome street',
    streetAddress2: '',
  },
  channelItem: {
    channelId: 3,
  },
  complaint: {
    symptoms: 'Back Pain',
  },
};

export const mockEtaRange: Required<Pick<DomainEtaRange, 'careRequestId'>> &
  Omit<DomainEtaRange, 'careRequestId'> = {
  careRequestId: mockCareRequest.id,
  careRequestStatusId: 1,
  startsAt: '2023-03-21T14:44:44.432Z',
  endsAt: '2023-03-21T20:44:44.432Z',
};

export const mockedInsuranceNetworksUniquePayersList: InsuranceNetwork[] =
  Array(3)
    .fill(mockedInsuranceNetwork)
    .map((network, index) => {
      const mockId = `${index + 1}`;

      return {
        ...network,
        id: mockId,
        name: `Awesome Network ${mockId}`,
        insurancePayerId: mockId,
        insurancePayerName: `Awesome Payer ${mockId}`,
        insuranceClassificationId: mockId,
      };
    });

export const mockedInsuranceClassifications: InsuranceClassification[] = [
  { id: 1, name: 'Awesome Classification 1' },
  { id: 2, name: 'Awesome Classification 2' },
];

export const mockUpdateCareRequestPayload: UpdateCareRequestPayload =
  mockCareRequest;

export const mockChannelItem: DomainChannelItem = {
  id: 123,
  name: 'google',
};
