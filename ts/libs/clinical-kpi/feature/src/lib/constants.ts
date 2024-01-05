import { CareTeamRankTableRow, Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import {
  LeaderHubIndividualProviderMetrics,
  LeaderHubMetricsData,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { MarketRole } from '@*company-data-covered*/auth0/util';

export const STATSIG_KEYS = {
  DYNAMIC_CONFIGS: {
    METRICS: 'clinical_kpi_metrics',
  },
};

export enum ProviderPosition {
  APP = 'advanced practice provider',
  DHMT = 'emt',
}

export enum MetricsKeys {
  OnSceneTime = 'medianOnSceneTimeSecs',
  NPS = 'averageNetPromoterScore',
  SurveyCapture = 'surveyCaptureRate',
  ChartClosure = 'chartClosureRate',
}

export enum LeaderHubMetricsKeys {
  OnSceneTime = 'onSceneTimeMedianSeconds',
  SurveyCapture = 'surveyCaptureRate',
  ChartClosure = 'chartClosureRate',
  NPS = 'netPromoterScoreAverage',
  OnTaskPercent = 'onTaskPercent',
}

export enum MetricsChangeKeys {
  OnSceneTime = 'medianOnSceneTimeSecsChange',
  NPS = 'averageNetPromoterScoreChange',
  SurveyCapture = 'surveyCaptureRateChange',
  ChartClosure = 'chartClosureRateChange',
}

export enum LeaderHubMetricsChangeKeys {
  OnSceneTime = 'onSceneTimeWeekChangeSeconds',
  SurveyCapture = 'surveyCaptureRateWeekChange',
  ChartClosure = 'chartClosureRateWeekChange',
  NPS = 'netPromoterScoreWeekChange',
  OnTaskPercent = 'onTaskPercentWeekChange',
}

export enum LeaderHubMetricsRankKeys {
  OnSceneTime = 'onSceneTimeRank',
  SurveyCapture = 'surveyCaptureRateRank',
  ChartClosure = 'chartClosureRateRank',
  NPS = 'netPromoterScoreRank',
  OnTaskPercent = 'onTaskPercentRank',
}

export interface IndividualMetricConfiguration {
  type: Metrics;
  key: MetricsKeys;
  changeKey: MetricsChangeKeys;
}

export interface IndividualPerformanceConfiguration {
  label: string;
  property: keyof Omit<LeaderHubIndividualProviderMetrics, 'provider'>;
  unit: string;
  type: Metrics;
}

export interface LeaderHubRankingProps {
  metrics?: LeaderHubMetricsData[];
  isLoading: boolean;
  onRowClick: (rowId: CareTeamRankTableRow['id']) => void;
  searchText: string;
  handleSearch: (value: string) => void;
  valueKey: LeaderHubMetricsKeys;
  changeKey: LeaderHubMetricsChangeKeys;
  type: Metrics;
  rankKey: LeaderHubMetricsRankKeys;
}

export enum MetricsGoalKeys {
  OnSceneTime = 'on_scene_time_goal',
  NPS = 'nps_score_goal',
  SurveyCapture = 'survey_capture_rate_goal',
  ChartClosure = 'chart_closure_rate_goal',
  OnTaskPercent = '',
  Escalation = '',
  ABX = '',
}

export const onSceneTimeConfiguration: IndividualMetricConfiguration = {
  type: Metrics.OnSceneTime,
  key: MetricsKeys.OnSceneTime,
  changeKey: MetricsChangeKeys.OnSceneTime,
};
export const npsConfiguration: IndividualMetricConfiguration = {
  type: Metrics.NPS,
  key: MetricsKeys.NPS,
  changeKey: MetricsChangeKeys.NPS,
};

export const surveyCaptureConfiguration: IndividualMetricConfiguration = {
  type: Metrics.SurveyCapture,
  key: MetricsKeys.SurveyCapture,
  changeKey: MetricsChangeKeys.SurveyCapture,
};

export const chartClosureConfiguration: IndividualMetricConfiguration = {
  type: Metrics.ChartClosure,
  key: MetricsKeys.ChartClosure,
  changeKey: MetricsChangeKeys.ChartClosure,
};

export interface TabConfiguration {
  value: Metrics;
  label: string;
  dataTestId: string;
}

export const onSceneTabConfiguration: TabConfiguration = {
  value: Metrics.OnSceneTime,
  label: 'On Scene Time',
  dataTestId: 'tab-on-scene-time',
};

export const surveyCaptureTabConfiguration: TabConfiguration = {
  value: Metrics.SurveyCapture,
  label: 'Survey Capture Rate',
  dataTestId: 'tab-chart-closure-rate',
};

export const chartClosureTabConfiguration: TabConfiguration = {
  value: Metrics.ChartClosure,
  label: 'Chart Closure Rate',
  dataTestId: 'tab-chart-closure-rate',
};

export const npsTabConfiguration: TabConfiguration = {
  value: Metrics.NPS,
  label: 'Patient NPS',
  dataTestId: 'tab-patient-nps',
};

export const dhmtTabsConfiguration: TabConfiguration[] = [
  onSceneTabConfiguration,
  surveyCaptureTabConfiguration,
  npsTabConfiguration,
];

export const appTabsConfiguration: TabConfiguration[] = [
  onSceneTabConfiguration,
  chartClosureTabConfiguration,
  npsTabConfiguration,
];

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export const ALLOWED_ROLES = [
  MarketRole.LeadAPP,
  MarketRole.LeadDHMT,
  MarketRole.AreaManager,
  MarketRole.MarketManager,
  MarketRole.RDO,
  MarketRole.RMD,
];
