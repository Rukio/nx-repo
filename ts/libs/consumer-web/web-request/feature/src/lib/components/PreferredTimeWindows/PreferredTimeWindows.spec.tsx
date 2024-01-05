import { render, screen } from '../../../testUtils';
import { within } from '@testing-library/react';
import dayjs from 'dayjs';
import PreferredTimeWindows, {
  PreferredTimeWindowsProps,
} from './PreferredTimeWindows';
import { PREFERRED_TIME_WINDOWS_TEST_IDS } from './testIds';
import { TimePeriod, DaysEnum } from '../../utils';

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

const TIME_OPTIONS = [
  {
    timePeriod: TimePeriod.Morning,
    title: `${TimePeriod.Morning} (7am-12pm)`,
  },
  {
    timePeriod: TimePeriod.Afternoon,
    title: `${TimePeriod.Afternoon} (12-5pm)`,
  },
  {
    timePeriod: TimePeriod.Evening,
    title: `${TimePeriod.Evening} (5-10pm)`,
  },
];

const defaultProps: PreferredTimeWindowsProps = {
  isFutureEta: true,
  requestPreferredEta: undefined,
  onChangeRequestPreferredEta: jest.fn(),
};

const setup = (props: Partial<PreferredTimeWindowsProps> = {}) => {
  return render(<PreferredTimeWindows {...defaultProps} {...props} />);
};

describe('<RequestPreferredTime />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2020-04-30T07:00:00.000Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('RequestPreferredTime snapshot', () => {
    const { asFragment } = setup();
    expect(asFragment()).toMatchSnapshot();
  });

  it('should display correct dates in the titles', () => {
    setup();

    const preferredTimeAlert = screen.getByTestId(
      PREFERRED_TIME_WINDOWS_TEST_IDS.ALERT
    );
    expect(preferredTimeAlert).toHaveTextContent(
      'Appointments are booking fast! Select your preferred time window for a visit.'
    );

    const todayOptionsHeader = screen.getByTestId(
      PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsHeaderTestId(DaysEnum.today)
    );
    const tomorrowOptionsHeader = screen.getByTestId(
      PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsHeaderTestId(
        DaysEnum.tomorrow
      )
    );

    const today = `${dayjs().format('M')}/${dayjs().format('DD')}`;
    const tomorrow = `${dayjs().add(1, 'day').format('M')}/${dayjs()
      .add(1, 'day')
      .format('DD')}`;

    expect(todayOptionsHeader).toHaveTextContent(today);
    expect(tomorrowOptionsHeader).toHaveTextContent(tomorrow);
  });

  describe('validate time options', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // eslint-disable-next-line no-extend-native
      Date.prototype.getTimezoneOffset = jest.fn(() => 0);
    });

    it.each([
      [
        'all time options when 00:00:00',
        { mockLocalTime: '2020-04-30T00:00:00.000Z' },
      ],
    ])(
      `today's group time options - should enable %s local time`,
      (_, { mockLocalTime }) => {
        jest.useFakeTimers().setSystemTime(new Date(mockLocalTime));
        setup();

        const todayOptionsGroup = screen.getByTestId(
          PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsGroupTestId(
            DaysEnum.today
          )
        );

        TIME_OPTIONS.forEach((option) => {
          const timeOption = within(todayOptionsGroup).getByText(option.title);
          expect(timeOption).toBeEnabled();
        });
      }
    );

    it.each([
      [
        'Morning time option when 12:00:00',
        {
          mockLocalTime: '2020-04-30T12:00:00.000Z',
          disabledTimeOptionsCount: 1,
        },
      ],
      [
        'Morning time option when 16:59:00',
        {
          mockLocalTime: '2020-04-30T16:59:00.000Z',
          disabledTimeOptionsCount: 1,
        },
      ],
      [
        'Morning and Afternoon time options when 17:00:00',
        {
          mockLocalTime: '2020-04-30T17:00:00.000Z',
          disabledTimeOptionsCount: 2,
        },
      ],
    ])(
      `today's group time options - should disable %s local time`,
      (_, { mockLocalTime, disabledTimeOptionsCount }) => {
        jest.useFakeTimers().setSystemTime(new Date(mockLocalTime));
        setup();

        const todayOptionsGroup = screen.getByTestId(
          PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsGroupTestId(
            DaysEnum.today
          )
        );

        for (let i = 0; i < disabledTimeOptionsCount; i += 1) {
          const timeOption = within(todayOptionsGroup).getByText(
            TIME_OPTIONS[i].title
          );
          expect(timeOption).toBeDisabled();
        }
      }
    );

    it("tomorrow's group time options - should enable all time options", () => {
      setup();

      const tomorrowGroup = screen.getByTestId(
        PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsGroupTestId(
          DaysEnum.tomorrow
        )
      );

      TIME_OPTIONS.forEach((option) =>
        expect(within(tomorrowGroup).getByText(option.title)).toBeEnabled()
      );
    });
  });
});
