import { SxStylesValue } from '@*company-data-covered*/design-system';
import {
  Metrics,
  METRICS_DEFAULT_SORT_DIRECTION,
  METRICS_UNIT_OF_MEASURE,
  SortDirection,
  TrendDirection,
  TREND_DIRECTION_STYLES,
  UnitsOfMeasure,
} from '../constants';

export const formatMinutes = (value: number) => {
  if (Math.abs(value) === 1) {
    return `${value} min`;
  }

  return `${value} mins`;
};

export const getValueChangeLineMinutes = (valueChange: number) => {
  const symbol = valueChange > 0 ? '+' : '';

  if (valueChange === 0) {
    return 'no change';
  }

  return `${symbol}${formatMinutes(valueChange)}`;
};

export const getValueChangeLinePercentage = (valueChange: number) => {
  const symbol = valueChange > 0 ? '+' : '';

  if (valueChange === 0) {
    return 'no change';
  }

  return `${symbol}${valueChange}%`;
};

type FormatMetricParameters = {
  type: Metrics;
  value: number;
};

type MetricValueDisplayInfo = {
  unit: UnitsOfMeasure;
  sortDirection: SortDirection;
  numericValue: number;
  displayValue: string;
};

export const formatMetricValue = ({
  type,
  value,
}: FormatMetricParameters): MetricValueDisplayInfo => {
  let displayValue: string;
  const unit = METRICS_UNIT_OF_MEASURE[type];
  const sortDirection = METRICS_DEFAULT_SORT_DIRECTION[type];

  switch (unit) {
    case UnitsOfMeasure.Minutes:
      displayValue = formatMinutes(value);
      break;
    case UnitsOfMeasure.Percent:
      displayValue = `${value}%`;
      break;
    case UnitsOfMeasure.None:
    default:
      displayValue = value.toString();
      break;
  }

  return {
    unit,
    numericValue: value,
    displayValue,
    sortDirection,
  };
};

type MetricValueChangeDisplayInfo = MetricValueDisplayInfo & {
  trendDirection: TrendDirection;
  styles: SxStylesValue;
};

export const formatMetricValueChange = ({
  type,
  value,
}: FormatMetricParameters): MetricValueChangeDisplayInfo => {
  let displayValue: string;
  const unit = METRICS_UNIT_OF_MEASURE[type];
  const sortDirection = METRICS_DEFAULT_SORT_DIRECTION[type];

  switch (unit) {
    case UnitsOfMeasure.Minutes:
      displayValue = getValueChangeLineMinutes(value);
      break;
    case UnitsOfMeasure.Percent:
      displayValue = getValueChangeLinePercentage(value);
      break;
    case UnitsOfMeasure.None:
    default:
      if (value === 0) {
        displayValue = 'no change';
      } else {
        displayValue = value > 0 ? `+${value}` : value.toString();
      }

      break;
  }

  let trendDirection: TrendDirection;
  if (value === 0) {
    trendDirection = TrendDirection.NEUTRAL;
  } else {
    const isValuePositive = value > 0;
    if (sortDirection === SortDirection.Descending) {
      trendDirection = isValuePositive
        ? TrendDirection.POSITIVE
        : TrendDirection.NEGATIVE;
    } else {
      trendDirection = isValuePositive
        ? TrendDirection.NEGATIVE
        : TrendDirection.POSITIVE;
    }
  }

  return {
    unit,
    numericValue: value,
    displayValue,
    sortDirection,
    trendDirection,
    styles: TREND_DIRECTION_STYLES[trendDirection],
  };
};
