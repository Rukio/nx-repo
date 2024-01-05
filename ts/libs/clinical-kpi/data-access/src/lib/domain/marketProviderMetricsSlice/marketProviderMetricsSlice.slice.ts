import { clinicalKpiApiSlice } from '../apiSlice';
import {
  LeaderHubMarketProviderMetrics,
  LeaderHubProviderMetricsParams,
  LeaderHubProviderMetricsResponse,
  MarketProviderMetrics,
  MarketProviderMetricsParams,
} from '../../types';

export const MARKET_PROVIDER_METRICS_API_PATCH = 'market-provider-metrics';

export const marketProviderMetricsSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMarketProviderMetrics: builder.query<
      MarketProviderMetrics,
      MarketProviderMetricsParams
    >({
      query: (params: MarketProviderMetricsParams) => ({
        url: MARKET_PROVIDER_METRICS_API_PATCH,
        params: params,
      }),
      transformResponse: ({ marketProviderMetrics, pagination }) => ({
        marketProviderMetrics,
        pagination: {
          ...pagination,
          totalPages: Number(pagination.totalPages),
        },
      }),
    }),
    getProviderLeaderHubMetrics: builder.query<
      LeaderHubMarketProviderMetrics,
      LeaderHubProviderMetricsParams
    >({
      query: ({ marketId, providerId }) =>
        `${MARKET_PROVIDER_METRICS_API_PATCH}/${providerId}?market_id=${marketId}`,
      transformResponse: (response: LeaderHubProviderMetricsResponse) =>
        response.marketProviderMetrics,
    }),
  }),
});

export const {
  useGetMarketProviderMetricsQuery,
  useGetProviderLeaderHubMetricsQuery,
} = marketProviderMetricsSlice;

export const selectDomainMarketProviderMetrics = (
  params: MarketProviderMetricsParams
) =>
  marketProviderMetricsSlice.endpoints.getMarketProviderMetrics.select(params);
