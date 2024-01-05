import {
  InsurancePayer,
  OssCareRequest,
  OSSUserCache,
  ProtocolWithQuestions,
  EtaRange,
  OssCareRequestStatusPayload,
  CareRequest,
  RequestStatus,
  BillingCityPlaceOfService,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';

export type SelfScheduleData = OSSUserCache;

export type GetPlacesOfServiceQuery = {
  billingCityId: number;
};

export type DomainBillingCityPlaceOfService = BillingCityPlaceOfService;

export type CacheSelfScheduleDataPayload = SelfScheduleData;

export type CreateSelfScheduleNotificationJobResponse = {
  success: boolean;
  jobId: string;
};

export type CancelSelfScheduleNotificationJobResponse = {
  success: boolean;
};

export type CheckMarketFeasibilityPayload = {
  zipcode?: string;
  marketId?: number;
  date?: string;
  startTimeSec?: number;
  endTimeSec?: number;
  careRequestId?: number;
};

export enum MarketFeasibilityStatus {
  Available = 'available',
  Limited = 'limited_availability',
  LimitedLocation = 'limited_availability_location_limited',
  LimitedNearingCapacity = 'limited_availability_nearing_capacity',
  LimitedServiceDuration = 'limited_availability_service_duration_limited',
  Unavailable = 'unavailable',
}

export type CheckMarketFeasibilityData = {
  availability: MarketFeasibilityStatus;
};

export type DomainInsurancePayer = InsurancePayer;

export type ListNetworksPayload = {
  payerIds?: string[];
  insuranceClassifications?: string[];
};

export type GetRiskStratificationProtocolQuery = {
  id: string;
  gender: string;
  dob: string;
};

export type DomainRiskStratificationProtocol = ProtocolWithQuestions;

export type CreateCareRequestPayload = OssCareRequest;

export type CreateCareRequestResponse = OssCareRequest;
export type DomainEtaRange = EtaRange;

export type UpdateEtaRangesResponse = {
  success: boolean;
  data: DomainEtaRange;
};

export type UpdateEtaRangesPayload = {
  careRequestId: number;
  careRequestStatusId: number;
  startsAt: string;
  endsAt: string;
};

export type PatchCareRequestStatusPayload = OssCareRequestStatusPayload;

export type PatchCareRequestStatusResponse = {
  success: boolean;
};

export type DomainCareRequest = CareRequest;

export { RequestStatus };

export type InsurancePayerFromNetwork = {
  id: string;
  name: string;
  classificationId?: string;
  stateAbbrs?: string[];
};

export type InsurancePayerData = {
  id: string;
  name: string;
  classificationId?: string;
  classificationName?: string;
  stateAbbrs?: string[];
};

export type UpdateCareRequestPayload = Omit<Partial<DomainCareRequest>, 'id'>;

export type DomainChannelItem = Pick<ChannelItem, 'id' | 'name'>;
