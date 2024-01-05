import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import {
  LeaderHubMetricsKeys,
  LeaderHubMetricsChangeKeys,
  LeaderHubMetricsRankKeys,
} from '../constants';

interface ProviderPerformanceConfiguration {
  type: Metrics;
  valueKey: LeaderHubMetricsKeys;
  valueChangeKey: LeaderHubMetricsChangeKeys;
  metricsValueRankKeys: LeaderHubMetricsRankKeys;
}

const onSceneMetric: ProviderPerformanceConfiguration = {
  type: Metrics.OnSceneTime,
  valueKey: LeaderHubMetricsKeys.OnSceneTime,
  valueChangeKey: LeaderHubMetricsChangeKeys.OnSceneTime,
  metricsValueRankKeys: LeaderHubMetricsRankKeys.OnSceneTime,
};

const chartClosureMetricMetric: ProviderPerformanceConfiguration = {
  type: Metrics.ChartClosure,
  valueKey: LeaderHubMetricsKeys.ChartClosure,
  valueChangeKey: LeaderHubMetricsChangeKeys.ChartClosure,
  metricsValueRankKeys: LeaderHubMetricsRankKeys.ChartClosure,
};

const surveyCaptureMetric: ProviderPerformanceConfiguration = {
  type: Metrics.SurveyCapture,
  valueKey: LeaderHubMetricsKeys.SurveyCapture,
  valueChangeKey: LeaderHubMetricsChangeKeys.SurveyCapture,
  metricsValueRankKeys: LeaderHubMetricsRankKeys.SurveyCapture,
};

const patientNPSMetricMetric: ProviderPerformanceConfiguration = {
  type: Metrics.NPS,
  valueKey: LeaderHubMetricsKeys.NPS,
  valueChangeKey: LeaderHubMetricsChangeKeys.NPS,
  metricsValueRankKeys: LeaderHubMetricsRankKeys.NPS,
};

const onTaskMetricMetric: ProviderPerformanceConfiguration = {
  type: Metrics.OnTaskPercent,
  valueKey: LeaderHubMetricsKeys.OnTaskPercent,
  valueChangeKey: LeaderHubMetricsChangeKeys.OnTaskPercent,
  metricsValueRankKeys: LeaderHubMetricsRankKeys.OnTaskPercent,
};

export const appConfiguration: ProviderPerformanceConfiguration[] = [
  onSceneMetric,
  chartClosureMetricMetric,
  patientNPSMetricMetric,
  onTaskMetricMetric,
];

export const dhmtConfiguration: ProviderPerformanceConfiguration[] = [
  onSceneMetric,
  surveyCaptureMetric,
  patientNPSMetricMetric,
  onTaskMetricMetric,
];
