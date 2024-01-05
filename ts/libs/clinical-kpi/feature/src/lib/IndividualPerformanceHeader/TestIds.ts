const headerPrefix = 'individual-performance-header';

export const INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS = {
  TITLE: `${headerPrefix}-title`,
  DEFAULT_ERROR_ALERT: `${headerPrefix}-default-error-alert`,
  getHeaderTestId: (property: string): string => `${headerPrefix}-${property}`,
  getMetricSkeleton: (metricType: string): string =>
    `${headerPrefix}-skeleton-${metricType}`,
};
