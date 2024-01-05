import { clinicalKpiApiSlice } from '../apiSlice';
import {
  LeaderHubIndividualProviderMetrics,
  LeaderHubIndividualProviderMetricsResponse,
  LeaderHubProviderShiftsQuery,
  LeaderHubProviderShiftsResponse,
} from '../../types';
import { fullAvatarURL } from '../../utils';

export const METRICS_LEADER_HUB_PROVIDERS_API_PATH = 'provider-overall-metrics';

export const LEADER_HUB_PROVIDERS_API_PATH = 'providers';

export const buildGetLeaderHubProviderShifts = (id: string | number) =>
  `${LEADER_HUB_PROVIDERS_API_PATH}/${id}/shifts`;

export const providerOverallMetricsSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderHubProviderMetrics: builder.query<
      LeaderHubIndividualProviderMetrics,
      string | number
    >({
      query: (id) => `${METRICS_LEADER_HUB_PROVIDERS_API_PATH}/${id}`,
      transformResponse: (
        response: LeaderHubIndividualProviderMetricsResponse
      ) => ({
        ...response.providerMetrics,
        provider: {
          ...response.providerMetrics.provider,
          avatarUrl: fullAvatarURL(response.providerMetrics.provider.avatarUrl),
        },
      }),
    }),
    getLeaderHubProviderShifts: builder.query<
      LeaderHubProviderShiftsResponse,
      LeaderHubProviderShiftsQuery
    >({
      query: ({ id, ...params }) => ({
        url: buildGetLeaderHubProviderShifts(id),
        params,
      }),
    }),
  }),
});

export const {
  useGetLeaderHubProviderMetricsQuery,
  useGetLeaderHubProviderShiftsQuery,
} = providerOverallMetricsSlice;

export const selectLeaderHubProviderMetrics = (providerId: string | number) =>
  providerOverallMetricsSlice.endpoints.getLeaderHubProviderMetrics.select(
    providerId
  );

export const selectLeaderHubProviderShiftsQuery =
  providerOverallMetricsSlice.endpoints.getLeaderHubProviderShifts.select;
