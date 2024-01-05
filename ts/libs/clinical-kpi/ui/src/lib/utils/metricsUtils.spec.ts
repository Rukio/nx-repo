import {
  Metrics,
  SortDirection,
  TrendDirection,
  TREND_DIRECTION_STYLES,
  UnitsOfMeasure,
} from '../constants';
import {
  formatMetricValue,
  formatMetricValueChange,
  formatMinutes,
  getValueChangeLineMinutes,
  getValueChangeLinePercentage,
} from './metricsUtils';

describe('metricsUtils', () => {
  describe('formatMinutes', () => {
    it('should return min when minutes equal 1', () => {
      expect(formatMinutes(1)).toEqual(`1 min`);
    });

    it('should return mins when minutes equal 2', () => {
      expect(formatMinutes(2)).toEqual(`2 mins`);
    });

    it('should return mins when minutes equal 0.5', () => {
      expect(formatMinutes(0.5)).toEqual(`0.5 mins`);
    });
  });

  describe('getValueChangeLineMinutes', () => {
    it('should add + and mins when valueChange > 0', () => {
      expect(getValueChangeLineMinutes(1)).toEqual(`+${formatMinutes(1)}`);
    });

    it('should not add + when valueChange < 0', () => {
      expect(getValueChangeLineMinutes(-1)).toEqual(`${formatMinutes(-1)}`);
    });

    it('should render no change when valueChange = 0', () => {
      expect(getValueChangeLineMinutes(0)).toEqual('no change');
    });
  });

  describe('getValueChangeLinePercentage', () => {
    it('should add + when valueChange > 0', () => {
      expect(getValueChangeLinePercentage(1)).toEqual(`+${1}%`);
    });

    it('should not add + when valueChange < 0', () => {
      expect(getValueChangeLinePercentage(-1)).toEqual(`${-1}%`);
    });

    it('should render no change when valueChange = 0', () => {
      expect(getValueChangeLinePercentage(0)).toEqual('no change');
    });
  });

  describe('formatMetricValue', () => {
    it.each<{
      type: Metrics;
      value: number;
      expected: ReturnType<typeof formatMetricValue>;
    }>([
      {
        type: Metrics.OnSceneTime,
        value: 2.5,
        expected: {
          unit: UnitsOfMeasure.Minutes,
          numericValue: 2.5,
          displayValue: '2.5 mins',
          sortDirection: SortDirection.Ascending,
        },
      },
      {
        type: Metrics.ChartClosure,
        value: 99,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: 99,
          displayValue: '99%',
          sortDirection: SortDirection.Descending,
        },
      },
      {
        type: Metrics.SurveyCapture,
        value: 99,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: 99,
          displayValue: '99%',
          sortDirection: SortDirection.Descending,
        },
      },
      {
        type: Metrics.NPS,
        value: 50,
        expected: {
          unit: UnitsOfMeasure.None,
          numericValue: 50,
          displayValue: '50',
          sortDirection: SortDirection.Descending,
        },
      },
    ])(
      'should return display info for $type metrics correctly',
      ({ type, value, expected }) => {
        expect(formatMetricValue({ type, value })).toStrictEqual(expected);
      }
    );
  });

  describe('formatMetricValueChange', () => {
    it.each<{
      type: Metrics;
      value: number;
      expected: ReturnType<typeof formatMetricValueChange>;
    }>([
      {
        type: Metrics.OnSceneTime,
        value: 2.5,
        expected: {
          unit: UnitsOfMeasure.Minutes,
          numericValue: 2.5,
          displayValue: '+2.5 mins',
          sortDirection: SortDirection.Ascending,
          trendDirection: TrendDirection.NEGATIVE,
          styles: TREND_DIRECTION_STYLES.NEGATIVE,
        },
      },
      {
        type: Metrics.OnSceneTime,
        value: -2.5,
        expected: {
          unit: UnitsOfMeasure.Minutes,
          numericValue: -2.5,
          displayValue: '-2.5 mins',
          sortDirection: SortDirection.Ascending,
          trendDirection: TrendDirection.POSITIVE,
          styles: TREND_DIRECTION_STYLES.POSITIVE,
        },
      },
      {
        type: Metrics.OnSceneTime,
        value: 0,
        expected: {
          unit: UnitsOfMeasure.Minutes,
          numericValue: 0,
          displayValue: 'no change',
          sortDirection: SortDirection.Ascending,
          trendDirection: TrendDirection.NEUTRAL,
          styles: TREND_DIRECTION_STYLES.NEUTRAL,
        },
      },
      {
        type: Metrics.ChartClosure,
        value: 99,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: 99,
          displayValue: '+99%',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.POSITIVE,
          styles: TREND_DIRECTION_STYLES.POSITIVE,
        },
      },
      {
        type: Metrics.ChartClosure,
        value: -99,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: -99,
          displayValue: '-99%',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.NEGATIVE,
          styles: TREND_DIRECTION_STYLES.NEGATIVE,
        },
      },
      {
        type: Metrics.ChartClosure,
        value: 0,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: 0,
          displayValue: 'no change',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.NEUTRAL,
          styles: TREND_DIRECTION_STYLES.NEUTRAL,
        },
      },
      {
        type: Metrics.SurveyCapture,
        value: 99,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: 99,
          displayValue: '+99%',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.POSITIVE,
          styles: TREND_DIRECTION_STYLES.POSITIVE,
        },
      },
      {
        type: Metrics.SurveyCapture,
        value: -99,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: -99,
          displayValue: '-99%',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.NEGATIVE,
          styles: TREND_DIRECTION_STYLES.NEGATIVE,
        },
      },
      {
        type: Metrics.SurveyCapture,
        value: 0,
        expected: {
          unit: UnitsOfMeasure.Percent,
          numericValue: 0,
          displayValue: 'no change',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.NEUTRAL,
          styles: TREND_DIRECTION_STYLES.NEUTRAL,
        },
      },
      {
        type: Metrics.NPS,
        value: 99,
        expected: {
          unit: UnitsOfMeasure.None,
          numericValue: 99,
          displayValue: '+99',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.POSITIVE,
          styles: TREND_DIRECTION_STYLES.POSITIVE,
        },
      },
      {
        type: Metrics.NPS,
        value: -99,
        expected: {
          unit: UnitsOfMeasure.None,
          numericValue: -99,
          displayValue: '-99',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.NEGATIVE,
          styles: TREND_DIRECTION_STYLES.NEGATIVE,
        },
      },
      {
        type: Metrics.NPS,
        value: 0,
        expected: {
          unit: UnitsOfMeasure.None,
          numericValue: 0,
          displayValue: 'no change',
          sortDirection: SortDirection.Descending,
          trendDirection: TrendDirection.NEUTRAL,
          styles: TREND_DIRECTION_STYLES.NEUTRAL,
        },
      },
    ])(
      'should return display info for $type metrics correctly with a value of $value',
      ({ type, value, expected }) => {
        expect(formatMetricValueChange({ type, value })).toStrictEqual(
          expected
        );
      }
    );
  });
});
