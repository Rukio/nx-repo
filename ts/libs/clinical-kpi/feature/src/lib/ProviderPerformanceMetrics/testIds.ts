const PROVIDER_PERFORMANCE_METRICS_TEST_ID = 'provider-performance-metrics';

export const PROVIDER_PERFORMANCE_METRICS_TEST_IDS = {
  getMetricSkeleton: (metricType: string) =>
    `${PROVIDER_PERFORMANCE_METRICS_TEST_ID}-${metricType}`,
};
