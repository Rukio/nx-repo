import { SkipToken } from '@reduxjs/toolkit/query';
import {
  onlineSelfSchedulingApiSlice,
  OnlineSelfSchedulingApiSliceTag,
} from '../apiSlice';
import {
  InsuranceNetwork,
  InsuranceClassification,
} from '@*company-data-covered*/consumer-web-types';
import {
  CacheSelfScheduleDataPayload,
  GetPlacesOfServiceQuery,
  SelfScheduleData,
  CheckMarketFeasibilityPayload,
  CheckMarketFeasibilityData,
  ListNetworksPayload,
  CreateSelfScheduleNotificationJobResponse,
  CancelSelfScheduleNotificationJobResponse,
  DomainInsurancePayer,
  GetRiskStratificationProtocolQuery,
  DomainRiskStratificationProtocol,
  CreateCareRequestPayload,
  CreateCareRequestResponse,
  UpdateEtaRangesResponse,
  UpdateEtaRangesPayload,
  PatchCareRequestStatusPayload,
  PatchCareRequestStatusResponse,
  DomainCareRequest,
  UpdateCareRequestPayload,
  DomainBillingCityPlaceOfService,
  DomainChannelItem,
} from '../../types';

export const SELF_SCHEDULE_API_PATH = 'self-schedule';

export const CACHE_SEGMENT = 'cache';
export const CHECK_MARKET_FEASIBILITY_SEGMENT = 'check-market-feasibility';

export const PLACES_OF_SEGMENT = 'places-of-service';

export const NOTIFICATION_SEGMENT = 'notification';

export const INSURANCE_PAYERS_SEGMENT = 'insurance-payers';

export const INSURANCE_NETWORKS_SEGMENT = 'insurance-networks';

export const RISK_STRATIFICATION_PROTOCOL_SEGMENT =
  'risk-stratification-protocols';

export const ETA_RANGES_SEGMENT = 'eta-ranges';

export const CARE_REQUEST_SEGMENT = 'care-request';

export const CARE_REQUEST_STATUS_SEGMENT = 'care-request-status';

export const INSURANCE_CLASSIFICATIONS_SEGMENT = 'insurance-classifications';

export const CHANNEL_ITEMS_SEGMENT = 'channel-items';

export const buildCachePath = () =>
  `${SELF_SCHEDULE_API_PATH}/${CACHE_SEGMENT}`;
export const buildCheckMarketFeasibilityPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${CHECK_MARKET_FEASIBILITY_SEGMENT}`;

export const buildPlacesOfServicePath = (billingCityId: string | number) =>
  `${SELF_SCHEDULE_API_PATH}/${PLACES_OF_SEGMENT}/${billingCityId}`;

export const buildNotificationsPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${NOTIFICATION_SEGMENT}`;

export const buildNotificationJobPath = (jobId: string) =>
  `${buildNotificationsPath()}/${jobId}`;

export const buildInsurancePayersPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${INSURANCE_PAYERS_SEGMENT}`;

export const buildInsuranceNetworksPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${INSURANCE_NETWORKS_SEGMENT}`;

export const buildGetRiskStratificationProtocolPath = (
  riskStratificationProtocolId: string | number
) =>
  `${SELF_SCHEDULE_API_PATH}/${RISK_STRATIFICATION_PROTOCOL_SEGMENT}/${riskStratificationProtocolId}`;

export const buildEtaRangesPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${ETA_RANGES_SEGMENT}`;

export const buildCareRequestPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${CARE_REQUEST_SEGMENT}`;

export const buildCareRequestStatusPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${CARE_REQUEST_STATUS_SEGMENT}`;

export const buildInsuranceClassificationsPath = () =>
  `${SELF_SCHEDULE_API_PATH}/${INSURANCE_CLASSIFICATIONS_SEGMENT}`;

export const buildChannelItemPath = (channelItemId: string | number) =>
  `${SELF_SCHEDULE_API_PATH}/${CHANNEL_ITEMS_SEGMENT}/${channelItemId}`;

export type SelectCachedSelfScheduledDataQuery = void | SkipToken;

export type SelectCheckMarketFeasibilityPayload =
  | CheckMarketFeasibilityPayload
  | SkipToken;

export const selfScheduleSlice = onlineSelfSchedulingApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    cacheSelfScheduleData: builder.mutation<
      SelfScheduleData,
      CacheSelfScheduleDataPayload
    >({
      query: (cacheCareRequestPayload) => ({
        url: buildCachePath(),
        method: 'POST',
        body: cacheCareRequestPayload,
      }),
      invalidatesTags: [OnlineSelfSchedulingApiSliceTag.CachedSelfScheduleData],
    }),
    getCachedSelfScheduleData: builder.query<SelfScheduleData, void>({
      query: () => buildCachePath(),
      transformResponse: ({ data }: { data: SelfScheduleData }) => data,
      providesTags: [OnlineSelfSchedulingApiSliceTag.CachedSelfScheduleData],
    }),
    getPlacesOfService: builder.query<
      DomainBillingCityPlaceOfService[],
      GetPlacesOfServiceQuery
    >({
      query: ({ billingCityId }) => ({
        url: buildPlacesOfServicePath(billingCityId),
      }),
      transformResponse: ({
        data,
      }: {
        data: DomainBillingCityPlaceOfService[];
      }) => data,
    }),
    createNotificationJob: builder.mutation<
      CreateSelfScheduleNotificationJobResponse,
      number
    >({
      query: (careRequestId) => ({
        url: buildNotificationsPath(),
        method: 'POST',
        body: { careRequestId },
      }),
    }),
    cancelNotificationJob: builder.mutation<
      CancelSelfScheduleNotificationJobResponse,
      string
    >({
      query: (jobId) => ({
        url: buildNotificationJobPath(jobId),
        method: 'DELETE',
      }),
    }),
    checkMarketFeasibility: builder.query<
      CheckMarketFeasibilityData,
      CheckMarketFeasibilityPayload
    >({
      query: (payload) => ({
        url: buildCheckMarketFeasibilityPath(),
        method: 'POST',
        body: payload,
      }),
      transformResponse: ({ data }: { data: CheckMarketFeasibilityData }) =>
        data,
    }),
    getInsurancePayers: builder.query<DomainInsurancePayer[], void>({
      query: buildInsurancePayersPath,
      transformResponse: ({ data }: { data: DomainInsurancePayer[] }) => data,
    }),
    listNetworks: builder.query<InsuranceNetwork[], ListNetworksPayload>({
      query: (payload) => ({
        url: buildInsuranceNetworksPath(),
        method: 'POST',
        body: payload,
      }),
      transformResponse: ({ data }: { data: InsuranceNetwork[] }) => data,
    }),
    getRiskStratificationProtocol: builder.query<
      DomainRiskStratificationProtocol,
      GetRiskStratificationProtocolQuery
    >({
      query: ({ id, ...params }) => ({
        url: buildGetRiskStratificationProtocolPath(id),
        method: 'GET',
        params,
      }),
      transformResponse: ({
        data,
      }: {
        data: DomainRiskStratificationProtocol;
      }) => data,
    }),
    createCareRequest: builder.mutation<
      CreateCareRequestResponse,
      CreateCareRequestPayload
    >({
      query: (body) => ({
        url: buildCareRequestPath(),
        method: 'POST',
        body,
      }),
      transformResponse: ({ data }: { data: CreateCareRequestResponse }) =>
        data,
    }),
    getCareRequest: builder.query<DomainCareRequest, void>({
      query: () => ({
        url: buildCareRequestPath(),
        method: 'GET',
      }),
      transformResponse: ({ data }: { data: DomainCareRequest }) => data,
      providesTags: [OnlineSelfSchedulingApiSliceTag.CareRequest],
    }),
    updateEtaRanges: builder.mutation<
      UpdateEtaRangesResponse,
      UpdateEtaRangesPayload
    >({
      query: (body) => ({
        url: buildEtaRangesPath(),
        method: 'POST',
        body,
      }),
      invalidatesTags: [OnlineSelfSchedulingApiSliceTag.CareRequest],
    }),
    updateCareRequestStatus: builder.mutation<
      PatchCareRequestStatusResponse,
      PatchCareRequestStatusPayload
    >({
      query: (body) => ({
        url: buildCareRequestStatusPath(),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [OnlineSelfSchedulingApiSliceTag.CareRequest],
    }),
    getInsuranceClassifications: builder.query<InsuranceClassification[], void>(
      {
        query: buildInsuranceClassificationsPath,
        transformResponse: ({ data }: { data: InsuranceClassification[] }) =>
          data,
      }
    ),
    updateCareRequest: builder.mutation<
      DomainCareRequest,
      UpdateCareRequestPayload
    >({
      query: (body) => ({
        url: buildCareRequestPath(),
        method: 'PUT',
        body,
      }),
      transformResponse: ({ data }: { data: DomainCareRequest }) => data,
      invalidatesTags: [OnlineSelfSchedulingApiSliceTag.CareRequest],
    }),
    getChannelItem: builder.query<DomainChannelItem, string | number>({
      query: (channelItemId) => buildChannelItemPath(channelItemId),
      transformResponse: ({ data }: { data: DomainChannelItem }) => data,
    }),
  }),
});

export const selectCachedSelfScheduleData = (
  query: SelectCachedSelfScheduledDataQuery
) => selfScheduleSlice.endpoints.getCachedSelfScheduleData.select(query);

export const selectPlacesOfService =
  selfScheduleSlice.endpoints.getPlacesOfService.select;

export const selectCheckMarketFeasibilityData =
  selfScheduleSlice.endpoints.checkMarketFeasibility.select;

export const selectInsurancePayersDomain =
  selfScheduleSlice.endpoints.getInsurancePayers.select();

export const selectInsuranceNetworks =
  selfScheduleSlice.endpoints.listNetworks.select;

export const selectRiskStratificationProtocol =
  selfScheduleSlice.endpoints.getRiskStratificationProtocol.select;

export const selectCareRequest =
  selfScheduleSlice.endpoints.getCareRequest.select();

export const selectInsuranceClassifications =
  selfScheduleSlice.endpoints.getInsuranceClassifications.select;

export const selectDomainChannelItem =
  selfScheduleSlice.endpoints.getChannelItem.select;

export const {
  useGetCachedSelfScheduleDataQuery,
  useCacheSelfScheduleDataMutation,
  useGetPlacesOfServiceQuery,
  useCreateNotificationJobMutation,
  useCancelNotificationJobMutation,
  useCheckMarketFeasibilityQuery,
  useGetInsurancePayersQuery,
  useListNetworksQuery,
  useGetRiskStratificationProtocolQuery,
  useCreateCareRequestMutation,
  useGetCareRequestQuery,
  useUpdateCareRequestStatusMutation,
  useUpdateEtaRangesMutation,
  useGetInsuranceClassificationsQuery,
  useUpdateCareRequestMutation,
  useGetChannelItemQuery,
} = selfScheduleSlice;
