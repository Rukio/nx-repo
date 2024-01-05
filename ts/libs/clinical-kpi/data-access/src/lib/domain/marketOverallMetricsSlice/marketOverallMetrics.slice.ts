import { clinicalKpiApiSlice } from '../apiSlice';
import {
  LeaderHubMarketMetricsResponse,
  LeaderHubMarketMetrics,
} from '../../types';

export const MARKET_OVERALL_METRICS_API_PATH = `market-overall-metrics`;

export const marketOverallMetricsSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMarketLeaderHubMetrics: builder.query<
      LeaderHubMarketMetrics,
      string | number
    >({
      query: (id) => `${MARKET_OVERALL_METRICS_API_PATH}/${id}`,
      transformResponse: (response: LeaderHubMarketMetricsResponse) =>
        response.marketMetrics,
    }),
  }),
});

export const { useGetMarketLeaderHubMetricsQuery } = marketOverallMetricsSlice;
