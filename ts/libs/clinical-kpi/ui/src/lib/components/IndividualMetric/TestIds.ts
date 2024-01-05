export const INDIVIDUAL_METRIC_TEST_IDS = {
  TYPE: (testIdPrefix: string) => `${testIdPrefix}-individual-metric-type`,
  VALUE: (testIdPrefix: string) => `${testIdPrefix}-individual-metric-value`,
  VALUE_CHANGE: (testIdPrefix: string) =>
    `${testIdPrefix}-individual-metric-change`,
  PERFORMANCE: (testIdPrefix: string) =>
    `${testIdPrefix}-individual-metric-performance`,
  GOAL: (testIdPrefix: string) => `${testIdPrefix}-individual-metric-goal`,
};
