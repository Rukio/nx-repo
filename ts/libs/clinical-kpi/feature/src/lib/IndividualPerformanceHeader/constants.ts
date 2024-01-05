import { Metrics, METRICS_DISPLAY_NAME } from '@*company-data-covered*/clinical-kpi/ui';
import { IndividualPerformanceConfiguration } from '../constants';

const onSceneMetric: IndividualPerformanceConfiguration = {
  label: 'on scene time avg',
  property: 'onSceneTimeMedianSeconds',
  unit: ' mins',
  type: Metrics.OnSceneTime,
};
const chartClosureMetric: IndividualPerformanceConfiguration = {
  label: 'chart closure rate',
  property: 'chartClosureRate',
  unit: '%',
  type: Metrics.ChartClosure,
};
const surveyCaptureMetric: IndividualPerformanceConfiguration = {
  label: 'survey capture rate',
  property: 'surveyCaptureRate',
  unit: '%',
  type: Metrics.SurveyCapture,
};
const patientNPSMetric: IndividualPerformanceConfiguration = {
  label: 'patient nps',
  property: 'netPromoterScoreAverage',
  type: Metrics.NPS,
  unit: '',
};
const onTaskMetric: IndividualPerformanceConfiguration = {
  label: METRICS_DISPLAY_NAME.OnTaskPercent,
  property: 'onTaskPercent',
  unit: '%',
  type: Metrics.OnTaskPercent,
};
const escalationMetric: IndividualPerformanceConfiguration = {
  label: METRICS_DISPLAY_NAME.Escalation,
  property: 'escalationRate',
  unit: '%',
  type: Metrics.Escalation,
};
const abxMetric: IndividualPerformanceConfiguration = {
  label: METRICS_DISPLAY_NAME.ABX,
  property: 'abxPrescribingRate',
  unit: '%',
  type: Metrics.ABX,
};

export const appConfiguration: IndividualPerformanceConfiguration[] = [
  onSceneMetric,
  chartClosureMetric,
  patientNPSMetric,
  onTaskMetric,
  escalationMetric,
  abxMetric,
];

export const dhmtConfiguration: IndividualPerformanceConfiguration[] = [
  onSceneMetric,
  surveyCaptureMetric,
  patientNPSMetric,
  onTaskMetric,
  escalationMetric,
  abxMetric,
];
