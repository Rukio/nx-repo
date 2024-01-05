import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import {
  convertMetricValue,
  convertSecondsToMinutes,
  roundValue,
  isValidMetricValue,
  convertSecondsToTime,
  formatTimeRange,
  formatProviderPosition,
  getValidMetricValue,
} from './metricUtils';
import { ProviderPosition } from '../../constants';

const CONVERT_METRIC_VALUE = [
  { type: Metrics.OnSceneTime, value: 150, expected: 2.5 },
  { type: Metrics.ChartClosure, value: 150, expected: 150 },
  { type: Metrics.SurveyCapture, value: 150, expected: 150 },
  { type: Metrics.NPS, value: 150, expected: 150 },
  { type: 'invalid' as Metrics, value: 150, expected: 150 },
];

describe('metricsUtils', () => {
  describe('convertMetricValue', () => {
    it.each(CONVERT_METRIC_VALUE)(
      'should convert $type correctly',
      ({ type, value, expected }) => {
        expect(convertMetricValue(type, value)).toStrictEqual(expected);
      }
    );
  });

  describe('convertSecondsToMinutes', () => {
    it('should return correct value', () => {
      expect(convertSecondsToMinutes(60)).toEqual(1);
    });
  });

  describe('convertSecondsToTime', () => {
    it.each([
      { seconds: 6000, expected: '1h 40m' },
      { seconds: 600, expected: '10m' },
      { seconds: 0, expected: '0m' },
    ])(
      'should convert $seconds to readable time format',
      ({ seconds, expected }) => {
        expect(convertSecondsToTime(seconds)).toStrictEqual(expected);
      }
    );
  });

  describe('formatTimeRange', () => {
    it.each([
      {
        startTimeHours: 0,
        endTimeHours: 22,
        expectedValue: '12am - 10pm',
      },
      {
        startTimeHours: 5,
        endTimeHours: 10,
        expectedValue: '5am - 10am',
      },
      {
        startTimeHours: 15,
        endTimeHours: 20,
        expectedValue: '3pm - 8pm',
      },
      {
        startTimeHours: 1,
        endTimeHours: 23,
        expectedValue: '1am - 11pm',
      },
    ])(
      'format hours of start and end time to time range',
      ({ startTimeHours, endTimeHours, expectedValue }) => {
        expect(formatTimeRange(startTimeHours, endTimeHours)).toEqual(
          expectedValue
        );
      }
    );
  });

  describe('roundValue', () => {
    it('should return correct value rounded', () => {
      expect(roundValue(256.3254544654)).toEqual(256.33);
    });

    it('should return correct value rounded with 3 fraction digits', () => {
      expect(roundValue(256.3254544654, 3)).toEqual(256.325);
    });

    it('should return correct value  when not need to round', () => {
      expect(roundValue(256)).toEqual(256);
    });

    it('should return correct value when not need to round with decimal', () => {
      expect(roundValue(256.1)).toEqual(256.1);
    });
  });

  describe('isValidMetricValue', () => {
    it.each([
      {
        name: 'number',
        input: 1,
        expected: true,
      },
      {
        name: 'numeric string',
        input: '1',
        expected: false,
      },
      {
        name: 'undefined',
        input: '1',
        expected: false,
      },
      {
        name: 'null',
        input: '1',
        expected: false,
      },
    ])('input is $name', ({ input, expected }) => {
      expect(isValidMetricValue(input)).toStrictEqual(expected);
    });
  });

  it('should return correct value formatProviderPosition', () => {
    const app = formatProviderPosition(ProviderPosition.APP);
    const dhmt = formatProviderPosition(ProviderPosition.DHMT);

    expect(app).toBe('APP');
    expect(dhmt).toBe('DHMT');
    expect(formatProviderPosition('test')).toBe('');
  });
});

describe('formatProviderPosition', () => {
  const testCases = [
    { input: ProviderPosition.APP, expectedOutput: 'APP' },
    { input: ProviderPosition.DHMT, expectedOutput: 'DHMT' },
    { input: '', expectedOutput: '' },
    { input: 'UNKNOWN', expectedOutput: '' },
  ];

  test.each(testCases)(
    'should return %p for input "%s"',
    ({ input, expectedOutput }) => {
      expect(formatProviderPosition(input)).toEqual(expectedOutput);
    }
  );
});

describe('getValidMetricValue', () => {
  it('should return undefined for null value', () => {
    const result = getValidMetricValue(Metrics.OnSceneTime, null);
    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined value', () => {
    const result = getValidMetricValue(Metrics.ChartClosure);
    expect(result).toBeUndefined();
  });

  it('should return undefined for string value', () => {
    const result = getValidMetricValue(Metrics.SurveyCapture, 'invalid');
    expect(result).toBeUndefined();
  });

  it('should return "0" for value of 0', () => {
    const result = getValidMetricValue(Metrics.NPS, 0);
    expect(result).toBe(0);
  });

  it.each(CONVERT_METRIC_VALUE)(
    'should convert $type correctly',
    ({ type, value, expected }) => {
      expect(getValidMetricValue(type, value)).toStrictEqual(expected);
    }
  );
});
