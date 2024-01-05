import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { CareRequestRepository } from '../care-request.repository';
import { CareRequestDto } from '../dto/care-request.dto';
import { CareRequestStatusText } from '../enums/care-request-status.enum';
import * as faker from 'faker';
import { ProviderDto } from '../dto/provider.dto';
import { DashboardWebhookCareRequest } from '../../dashboard/types/dashboard-care-request';
import { buildMockCaller } from '../../dashboard/mocks/dashboard-care-request.mock';
import { EtaRangeDto } from '../dto/eta-range.dto';
import { ActiveStatusDto } from '../dto/active-status.dto';
import { buildMockDashboardPatient } from '../../dashboard/mocks/dashboard-patient.mock';
import { DashboardWebhookDtoV2 } from '../../companion/dto/dashboard-webhook-v2.dto';
import { buildMockServiceLine } from './service-line.mock';
import { RequestType } from '../types/request-type';
import { MarketDto } from '../dto/market.dto';
import { addMinutes } from 'date-fns';
import { DashboardEtaRange } from '../../dashboard/types/dashboard-eta-range';

beforeEach(() => {
  mockReset(mockCareRequestRepository);
});

export type MockCareRequestService = MockProxy<CareRequestRepository>;

export const mockCareRequestRepository = mockDeep<CareRequestRepository>();

export const buildMockEtaRange = (
  userDefinedValues?: Partial<EtaRangeDto>
): EtaRangeDto => {
  return {
    id: faker.datatype.number(),
    startsAt: new Date().toISOString(),
    endsAt: addMinutes(new Date(), 30).toISOString(),
    careRequestId: faker.datatype.number(),
    careRequestStatusId: faker.datatype.number(),
    createdAt: faker.datatype.datetime().toISOString(),
    updatedAt: faker.datatype.datetime().toISOString(),
    ...userDefinedValues,
  };
};

export const buildMockDashboardEtaRange = (
  userDefinedValues?: Partial<DashboardEtaRange>
): DashboardEtaRange => {
  return {
    id: faker.datatype.number(),
    starts_at: new Date().toISOString(),
    ends_at: addMinutes(new Date(), 30).toISOString(),
    care_request_id: faker.datatype.number(),
    care_request_status_id: faker.datatype.number(),
    created_at: faker.datatype.datetime().toISOString(),
    updated_at: faker.datatype.datetime().toISOString(),
    ...userDefinedValues,
  };
};

export const buildMockActiveStatus = (
  userDefinedValues?: Partial<ActiveStatusDto>
): ActiveStatusDto => {
  return {
    id: faker.datatype.number(),
    name: faker.name.findName(),
    userId: faker.datatype.number(),
    startedAt: faker.datatype.datetime().toISOString(),
    comment: faker.datatype.string(),
    metadata: {},
    username: faker.datatype.string(),
    commenterName: faker.datatype.string(),
    ...userDefinedValues,
  };
};

export const buildMockCareRequest = (
  userDefinedValues: Partial<CareRequestDto> = {}
): CareRequestDto => ({
  chiefComplaint: 'headache',
  patientId: 123,
  statsigCareRequestId: faker.datatype.uuid(),
  requestType: RequestType.MOBILE,
  streetAddress1: '1234 Nowhere Drive',
  streetAddress2: 'Unit 206',
  city: 'Nowhere',
  state: 'CO',
  zipcode: '80004',
  id: 123,
  activeStatus: buildMockActiveStatus(),
  caller: buildMockCaller(),
  etaRanges: [buildMockEtaRange()],
  patient: buildMockDashboardPatient(true).toPatientDto(),
  latitude: 1,
  longitude: 1,
  phoneNumber: '3035555555',
  providers: [],
  createdAt: new Date(),
  assignmentDate: new Date(2021, 11, 11, 0, 0, 0, 0).toISOString(),
  appointmentSlot: {
    id: faker.datatype.number(),
    careRequestId: faker.datatype.number(),
    startTime: faker.datatype.datetime().toISOString(),
    createdAt: faker.datatype.datetime().toISOString(),
    updatedAt: faker.datatype.datetime().toISOString(),
  },
  currentState: Object.keys(CareRequestStatusText).map((key, i) => {
    return {
      id: faker.datatype.number(),
      name: CareRequestStatusText[key as keyof typeof CareRequestStatusText],
      startedAt: '2021-07-14T15:19:12.797Z',
      createdAt: '2021-07-14T15:19:12.797Z',
      updatedAt: '2021-07-14T15:19:12.797Z',
      statusIndex: i,
      metadata: { eta: '2021-07-14T15:19:12.797Z' },
    };
  }),
  serviceLine: buildMockServiceLine(),
  market: buildMockMarket(),
  ...userDefinedValues,
});

export const buildMockProvider = (
  userDefinedValues: Partial<ProviderDto> = {}
): ProviderDto => ({
  id: faker.datatype.string(12),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  providerImageTinyUrl: faker.internet.url(),
  providerProfilePosition: 'advanced practice provider',
  providerProfileCredentials: 'NP',
  ...userDefinedValues,
});

export const buildMockDashboardWebhookCareRequest = (
  userDefinedValues: Partial<DashboardWebhookCareRequest> = {}
): DashboardWebhookCareRequest => ({
  external_id: 12345,
  assignment_date: new Date(),
  care_request_statuses: [],
  eta: new Date(),
  eta_ranges: [],
  order_id: 12345,
  partner_id: 12345,
  request_status: CareRequestStatusText.Accepted,
  ...userDefinedValues,
});

export const buildMockDashboardWebhookV2CareRequest = (
  userDefinedValues: Partial<DashboardWebhookDtoV2> = {}
): DashboardWebhookDtoV2 => {
  const careRequestId = faker.datatype.number();

  return {
    care_request_id: careRequestId,
    request_status: CareRequestStatusText.Accepted,
    ...userDefinedValues,
  };
};

export const buildMockDashboardWebhookV2EtaUpdate = (
  userDefinedValues: Partial<DashboardWebhookDtoV2> = {}
): DashboardWebhookDtoV2 => {
  const careRequestId = faker.datatype.number();

  return buildMockDashboardWebhookV2CareRequest({
    care_request_id: careRequestId,
    eta_range: buildMockDashboardEtaRange({ care_request_id: careRequestId }),
    ...userDefinedValues,
  });
};

export const buildMockMarket = (
  userDefinedValues: Partial<MarketDto> = {}
): MarketDto => ({
  id: faker.datatype.number(),
  name: 'Denver',
  state: 'CO',
  shortName: 'DEN',
  tzName: 'America/Denver',
  tzShortName: 'MST',
  ...userDefinedValues,
});
