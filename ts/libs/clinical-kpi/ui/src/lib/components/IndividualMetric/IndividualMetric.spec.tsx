import { render, screen } from '@testing-library/react';
import IndividualMetric, {
  getPerformanceLineText,
  IndividualMetricProps,
} from './IndividualMetric';
import { Metrics } from '../../constants';

const props: IndividualMetricProps = {
  type: Metrics.OnSceneTime,
  value: 57.7,
  valueChange: 14.27,
  goal: 21,
  testIdPrefix: 'text-prefix',
  possessiveOfMetric: 'your',
};

describe('IndividualMetric', () => {
  it('should render correctly for OnSceneTime type', () => {
    const { asFragment } = render(
      <IndividualMetric {...props} type={Metrics.OnSceneTime} />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly for SurveyCapture type', () => {
    const { asFragment } = render(
      <IndividualMetric {...props} type={Metrics.SurveyCapture} />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly for ChartClosure type', () => {
    const { asFragment } = render(
      <IndividualMetric {...props} type={Metrics.ChartClosure} />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly for NPS type', () => {
    const { asFragment } = render(
      <IndividualMetric {...props} type={Metrics.NPS} />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly for different possessiveOfMetric', () => {
    const { asFragment } = render(
      <IndividualMetric
        {...props}
        possessiveOfMetric="Market's"
        type={Metrics.NPS}
      />
    );
    const metricText = screen.getByTestId(
      'text-prefix-individual-metric-performance'
    );
    expect(metricText).toHaveTextContent(
      "Since last week, Market's NPS went up 14.27"
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe('unit tests', () => {
  describe('getPerformanceLineText()', () => {
    test.each([
      {
        type: Metrics.OnSceneTime,
        numericValueChange: 10.12,
        displayValueChange: '10.12 mins',
        expectedValue: 'Since last week, your On Scene Time went up 10.12 mins',
      },
      {
        type: Metrics.ChartClosure,
        numericValueChange: 20.12,
        displayValueChange: '20.12%',
        expectedValue: 'Since last week, your Chart Closure went up 20.12%',
      },
      {
        type: Metrics.SurveyCapture,
        numericValueChange: -30.12,
        displayValueChange: '-30.12%',
        expectedValue: 'Since last week, your Survey Capture went down 30.12%',
      },
      {
        type: Metrics.NPS,
        numericValueChange: 40.12345,
        displayValueChange: '40.12',
        expectedValue: 'Since last week, your NPS went up 40.12',
      },
      {
        type: Metrics.NPS,
        numericValueChange: 0,
        displayValueChange: '0',
        expectedValue: 'Since last week, your NPS did not change',
      },
    ])(
      `getPerformanceLine(type: keyof typeof Metrics, valueChange: number, differenceLine: string)`,
      ({ type, numericValueChange, displayValueChange, expectedValue }) => {
        expect(
          getPerformanceLineText(
            type,
            numericValueChange,
            displayValueChange,
            'your'
          )
        ).toEqual(expectedValue);
      }
    );
  });
});
