import { SxStylesValue } from '@*company-data-covered*/design-system';

export enum Metrics {
  OnSceneTime = 'OnSceneTime',
  ChartClosure = 'ChartClosure',
  SurveyCapture = 'SurveyCapture',
  NPS = 'NPS',
  OnTaskPercent = 'OnTaskPercent',
  Escalation = 'Escalation',
  ABX = 'ABX',
}

export enum UnitsOfMeasure {
  None = 'None',
  Percent = 'Percent',
  Minutes = 'Minutes',
}

export enum TrendDirection {
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
  POSITIVE = 'POSITIVE',
}

export const METRICS_UNIT_OF_MEASURE: Record<Metrics, UnitsOfMeasure> = {
  ChartClosure: UnitsOfMeasure.Percent,
  SurveyCapture: UnitsOfMeasure.Percent,
  OnSceneTime: UnitsOfMeasure.Minutes,
  NPS: UnitsOfMeasure.None,
  OnTaskPercent: UnitsOfMeasure.Percent,
  Escalation: UnitsOfMeasure.Percent,
  ABX: UnitsOfMeasure.Percent,
};

export const TREND_DIRECTION_STYLES: Record<TrendDirection, SxStylesValue> = {
  POSITIVE: {
    color: 'success.main',
  },
  NEUTRAL: {
    color: 'text.disabled',
  },
  NEGATIVE: {
    color: 'error.main',
  },
};

export enum SortDirection {
  Ascending = 'Ascending',
  Descending = 'Descending',
}

export enum ValueFontColor {
  ValueChangeGreenCell = 'valueChangeGreenCell',
  ValueChangeRedCell = 'valueChangeRedCell',
  ValueChangeGrayCell = 'valueChangeGrayCell',
}

export const METRICS_DISPLAY_NAME: Record<Metrics, string> = {
  OnSceneTime: 'On Scene Time',
  ChartClosure: 'Chart Closure',
  SurveyCapture: 'Survey Capture',
  NPS: 'NPS',
  OnTaskPercent: 'On Task %',
  Escalation: 'Escalation Rate',
  ABX: 'ABX Prescribing Rate',
};

export const METRICS_DEFAULT_SORT_DIRECTION: Record<Metrics, SortDirection> = {
  OnSceneTime: SortDirection.Ascending,
  ChartClosure: SortDirection.Descending,
  SurveyCapture: SortDirection.Descending,
  NPS: SortDirection.Descending,
  OnTaskPercent: SortDirection.Descending,
  Escalation: SortDirection.Descending,
  ABX: SortDirection.Descending,
};

export const LEADS_VIEW_INDIVIDUAL_VISIBILITY =
  'leads_view_individual_visibility';

export const DEFAULT_ERROR_ALERT_TEXT =
  'Content failed to load. Please refresh the page.';
