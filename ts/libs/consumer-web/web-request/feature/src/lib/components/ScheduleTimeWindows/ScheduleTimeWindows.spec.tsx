import { render, screen } from '../../../testUtils';
import ScheduleTimeWindows, {
  ScheduleTimeWindowsProps,
  getTimeSelectList,
  getPreferredTimeUtc,
  getPreferredEta,
  getSchedulingDay,
} from './ScheduleTimeWindows';
import { SCHEDULE_TIME_WINDOWS_TEST_IDS } from './testIds';
import { TIME_RANGE_SELECTOR_TEST_IDS } from '@*company-data-covered*/consumer-web/web-request/ui';
import { DaysEnum } from '../../utils';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
  getConfig: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
}));

const defaultProps: ScheduleTimeWindowsProps = {
  minTimeRangeValid: true,
  requestPreferredEta: undefined,
  requestPostalCode: '',
  onChangeRequestPreferredEta: jest.fn(),
};

const setup = (props: Partial<ScheduleTimeWindowsProps> = {}) => {
  return render(<ScheduleTimeWindows {...defaultProps} {...props} />);
};

const startTimePrefixText = 'start-time';
const endTimePrefixText = 'end-time';

describe('<ScheduleTimeWindows />', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2020-04-30T07:00:00.000Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should display the toggle to today and selected start and end time if the preferred time exists', async () => {
    setup({
      requestPreferredEta: {
        patientPreferredEtaStart: '2020-04-30T07:00:00.00Z',
        patientPreferredEtaEnd: '2020-04-30T11:00:00.00Z',
      },
    });

    const dayToggleButtonToday = await screen.findByTestId(
      SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(DaysEnum.today)
    );
    expect(dayToggleButtonToday).toHaveAttribute('aria-pressed', 'true');

    const startTimeField = await screen.findByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(startTimePrefixText)
    );
    expect(startTimeField).toHaveTextContent('07:00 am');

    const endTimeField = await screen.findByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(endTimePrefixText)
    );
    expect(endTimeField).toHaveTextContent('11:00 am');
  });

  it('should display the toggle to tomorrow and selected start and end time if the preferred time exists', async () => {
    setup({
      requestPreferredEta: {
        patientPreferredEtaStart: '2020-05-01T07:00:00.00Z',
        patientPreferredEtaEnd: '2020-05-01T11:00:00.00Z',
      },
    });

    const dayToggleButtonTomorrow = await screen.findByTestId(
      SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(DaysEnum.tomorrow)
    );
    expect(dayToggleButtonTomorrow).toHaveAttribute('aria-pressed', 'true');

    const startTimeField = await screen.findByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(startTimePrefixText)
    );
    expect(startTimeField).toHaveTextContent('07:00 am');

    const endTimeField = await screen.findByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(endTimePrefixText)
    );
    expect(endTimeField).toHaveTextContent('11:00 am');
  });

  it('should display min time range error message', async () => {
    setup({
      minTimeRangeValid: false,
      requestPreferredEta: {
        patientPreferredEtaStart: '2020-04-30T07:00:00.00Z',
        patientPreferredEtaEnd: '2020-04-30T08:00:00.00Z',
      },
    });

    const startTimeField = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(startTimePrefixText)
    );
    expect(startTimeField).toHaveTextContent('07:00 am');

    const endTimeField = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(endTimePrefixText)
    );
    expect(endTimeField).toHaveTextContent('08:00 am');

    const errorMessage = screen.queryByTestId(
      SCHEDULE_TIME_WINDOWS_TEST_IDS.MIN_TIME_RANGE_ERROR_MESSAGE
    );
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(
      'Please select a minimum 4 hour time window.'
    );
  });
});

describe('Helper methods', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2020-04-30T07:00:00.000Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('getTimeSelectList', () => {
    it("should return today's time select list", () => {
      const expectedTimeSelectList = [
        { value: '2020-04-30T00:00:00Z', label: '12:00 am' },
        { value: '2020-04-30T01:00:00Z', label: '01:00 am' },
        { value: '2020-04-30T02:00:00Z', label: '02:00 am' },
        { value: '2020-04-30T03:00:00Z', label: '03:00 am' },
        { value: '2020-04-30T04:00:00Z', label: '04:00 am' },
        { value: '2020-04-30T05:00:00Z', label: '05:00 am' },
        { value: '2020-04-30T06:00:00Z', label: '06:00 am' },
        { value: '2020-04-30T07:00:00Z', label: '07:00 am' },
        { value: '2020-04-30T08:00:00Z', label: '08:00 am' },
        { value: '2020-04-30T09:00:00Z', label: '09:00 am' },
        { value: '2020-04-30T10:00:00Z', label: '10:00 am' },
        { value: '2020-04-30T11:00:00Z', label: '11:00 am' },
        { value: '2020-04-30T12:00:00Z', label: '12:00 pm' },
        { value: '2020-04-30T13:00:00Z', label: '01:00 pm' },
        { value: '2020-04-30T14:00:00Z', label: '02:00 pm' },
        { value: '2020-04-30T15:00:00Z', label: '03:00 pm' },
        { value: '2020-04-30T16:00:00Z', label: '04:00 pm' },
        { value: '2020-04-30T17:00:00Z', label: '05:00 pm' },
        { value: '2020-04-30T18:00:00Z', label: '06:00 pm' },
        { value: '2020-04-30T19:00:00Z', label: '07:00 pm' },
        { value: '2020-04-30T20:00:00Z', label: '08:00 pm' },
        { value: '2020-04-30T21:00:00Z', label: '09:00 pm' },
        { value: '2020-04-30T22:00:00Z', label: '10:00 pm' },
        { value: '2020-04-30T23:00:00Z', label: '11:00 pm' },
      ];

      const actualResult = getTimeSelectList(DaysEnum.today);
      expect(actualResult).toEqual(expectedTimeSelectList);
    });

    it("should return tomorrow's time select list", () => {
      const expectedTimeSelectList = [
        { value: '2020-05-01T00:00:00Z', label: '12:00 am' },
        { value: '2020-05-01T01:00:00Z', label: '01:00 am' },
        { value: '2020-05-01T02:00:00Z', label: '02:00 am' },
        { value: '2020-05-01T03:00:00Z', label: '03:00 am' },
        { value: '2020-05-01T04:00:00Z', label: '04:00 am' },
        { value: '2020-05-01T05:00:00Z', label: '05:00 am' },
        { value: '2020-05-01T06:00:00Z', label: '06:00 am' },
        { value: '2020-05-01T07:00:00Z', label: '07:00 am' },
        { value: '2020-05-01T08:00:00Z', label: '08:00 am' },
        { value: '2020-05-01T09:00:00Z', label: '09:00 am' },
        { value: '2020-05-01T10:00:00Z', label: '10:00 am' },
        { value: '2020-05-01T11:00:00Z', label: '11:00 am' },
        { value: '2020-05-01T12:00:00Z', label: '12:00 pm' },
        { value: '2020-05-01T13:00:00Z', label: '01:00 pm' },
        { value: '2020-05-01T14:00:00Z', label: '02:00 pm' },
        { value: '2020-05-01T15:00:00Z', label: '03:00 pm' },
        { value: '2020-05-01T16:00:00Z', label: '04:00 pm' },
        { value: '2020-05-01T17:00:00Z', label: '05:00 pm' },
        { value: '2020-05-01T18:00:00Z', label: '06:00 pm' },
        { value: '2020-05-01T19:00:00Z', label: '07:00 pm' },
        { value: '2020-05-01T20:00:00Z', label: '08:00 pm' },
        { value: '2020-05-01T21:00:00Z', label: '09:00 pm' },
        { value: '2020-05-01T22:00:00Z', label: '10:00 pm' },
        { value: '2020-05-01T23:00:00Z', label: '11:00 pm' },
      ];

      const actualResult = getTimeSelectList(DaysEnum.tomorrow);
      expect(actualResult).toEqual(expectedTimeSelectList);
    });
  });

  describe('getPreferredTimeUtc', () => {
    it('should return the date with utc time zone if pass string type value', () => {
      const expectedTimeUtc = '2020-04-30T07:00:00Z';
      const preferredTime = new Date().toString();

      const actualResult = getPreferredTimeUtc(preferredTime)?.format();

      expect(actualResult).toEqual(expectedTimeUtc);
    });

    it('should return the date with utc time zone if pass Date type value', () => {
      const expectedTimeUtc = '2020-04-30T07:00:00Z';
      const preferredTime = new Date();

      const actualResult = getPreferredTimeUtc(preferredTime)?.format();

      expect(actualResult).toEqual(expectedTimeUtc);
    });

    it('should return null if not pass the value', () => {
      const actualResult = getPreferredTimeUtc();

      expect(actualResult).toBeNull();
    });
  });

  describe('getPreferredEta', () => {
    it('should return empty object if startTime and endTime values is not passed', () => {
      const actualResult = getPreferredEta(DaysEnum.today);
      expect(actualResult).toEqual({});
    });

    it('should return object with patientPreferredEtaStart and patientPreferredEtaEnd values', () => {
      const actualResult = getPreferredEta(
        DaysEnum.tomorrow,
        new Date(),
        new Date().toString()
      );
      expect(actualResult).toEqual({
        patientPreferredEtaStart: '2020-05-01T07:00:00Z',
        patientPreferredEtaEnd: '2020-05-01T07:00:00Z',
      });
    });

    it('should return object with only patientPreferredEtaStart value', () => {
      const actualResult = getPreferredEta(DaysEnum.tomorrow, new Date());
      expect(actualResult).toEqual({
        patientPreferredEtaStart: '2020-05-01T07:00:00Z',
      });
    });

    it('should return object with only patientPreferredEtaEnd value', () => {
      const actualResult = getPreferredEta(
        DaysEnum.today,
        '',
        new Date().toString()
      );
      expect(actualResult).toEqual({
        patientPreferredEtaEnd: '2020-04-29T07:00:00Z',
      });
    });
  });

  describe('getSchedulingDay', () => {
    it('should return today by default', () => {
      const actualResult = getSchedulingDay();
      expect(actualResult).toEqual(DaysEnum.today);
    });

    it('should return today if pass Date type value', () => {
      const actualResult = getSchedulingDay(new Date());
      expect(actualResult).toEqual(DaysEnum.today);
    });

    it('should return tomorrow if pass string type value', () => {
      const actualResult = getSchedulingDay('2020-05-01T23:00:00Z');
      expect(actualResult).toEqual(DaysEnum.tomorrow);
    });
  });
});
