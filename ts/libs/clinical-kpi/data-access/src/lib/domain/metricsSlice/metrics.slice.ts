import { clinicalKpiApiSlice } from '../apiSlice';
import { ProviderMetrics, MarketMetrics } from '../../types';

export const METRICS_PROVIDERS_API_PATH = 'metrics/providers';
export const METRICS_MARKETS_API_PATH = 'metrics/markets';

export const metricsSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLatestMetricsForProvider: builder.query<
      ProviderMetrics | null,
      string | number
    >({
      query: (id) => `${METRICS_PROVIDERS_API_PATH}/${id}`,
      transformResponse: ({ metrics }: { metrics: ProviderMetrics | null }) =>
        metrics,
    }),
    getLatestMetricsByMarket: builder.query<MarketMetrics, string | number>({
      query: (id) => `${METRICS_MARKETS_API_PATH}/${id}`,
    }),
  }),
});

export const {
  useGetLatestMetricsForProviderQuery,
  useGetLatestMetricsByMarketQuery,
} = metricsSlice;

export const selectLatestMetricsForProvider = (providerId: string | number) =>
  metricsSlice.endpoints.getLatestMetricsForProvider.select(providerId);

export const selectLatestMetricsByMarket = (marketId: string | number) =>
  metricsSlice.endpoints.getLatestMetricsByMarket.select(marketId);
