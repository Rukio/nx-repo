import { render, screen } from '../../testUtils';
import { mocked } from 'jest-mock';
import { within } from '@testing-library/react';
import { selectAddress } from '@*company-data-covered*/consumer-web/web-request/data-access';
import { UserFlow, useUserFlow } from '../hooks';
import RequestTimeWindows from './RequestTimeWindows';
import { REQUEST_TIME_WINDOWS_TEST_IDS } from './testIds';
import {
  PREFERRED_TIME_WINDOWS_TEST_IDS,
  SCHEDULE_TIME_WINDOWS_TEST_IDS,
} from '../components';
import { TIME_RANGE_SELECTOR_TEST_IDS } from '@*company-data-covered*/consumer-web/web-request/ui';
import { DaysEnum } from '../utils';

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useUserFlow: jest.fn().mockImplementation(() => ({
    renderHowItWorksPage: false,
    renderScheduleTimeWindow: false,
  })),
}));

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

const mockSelectAddress = mocked(selectAddress).mockReturnValue({
  postalCode: '',
  streetAddress1: '',
  streetAddress2: '',
  city: '',
  state: '',
});

export const mockScheduleTimeWindowUserFlow: UserFlow = {
  renderHowItWorksPage: false,
  renderScheduleTimeWindow: true,
};

jest.mock('@*company-data-covered*/consumer-web/web-request/data-access', () => ({
  ...jest.requireActual('@*company-data-covered*/consumer-web/web-request/data-access'),
  selectAddress: jest.fn(),
}));

const setup = () => {
  return render(<RequestTimeWindows />);
};

describe('<RequestTimeWindows />', () => {
  describe('Preferred Time Windows', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-04-30T07:00:00.000Z'));
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should render preferred time windows', async () => {
      setup();

      const header = await screen.findByTestId(
        REQUEST_TIME_WINDOWS_TEST_IDS.PREFERRED_TIME_HEADER
      );
      expect(header).toHaveTextContent('When would you like a visit?');

      const preferredTimeAlert = await screen.findByTestId(
        PREFERRED_TIME_WINDOWS_TEST_IDS.ALERT
      );
      expect(preferredTimeAlert).toBeVisible();
      expect(preferredTimeAlert).toHaveTextContent(
        'Appointments are booking fast! Select your preferred time window for a visit.'
      );

      const todayTimeGroup = screen.getByTestId(
        PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsGroupTestId(DaysEnum.today)
      );
      expect(todayTimeGroup).toBeVisible();

      const todayOptions = within(todayTimeGroup).getAllByRole('button');
      expect(todayOptions).toHaveLength(3);

      const tomorrowTimeGroup = screen.getByTestId(
        PREFERRED_TIME_WINDOWS_TEST_IDS.getDayOptionsGroupTestId(
          DaysEnum.tomorrow
        )
      );
      expect(tomorrowTimeGroup).toBeVisible();

      const tomorrowOptions = within(tomorrowTimeGroup).getAllByRole('button');
      expect(tomorrowOptions).toHaveLength(3);

      const continueBtn = await screen.findByTestId(
        REQUEST_TIME_WINDOWS_TEST_IDS.CONTINUE_BUTTON
      );
      expect(continueBtn).toBeVisible();
    });
  });

  describe('Schedule Time Windows', () => {
    const startTimePrefixText = 'start-time';
    const endTimePrefixText = 'end-time';

    beforeAll(() => {
      const useUserFlowMock = mocked(useUserFlow);
      useUserFlowMock.mockReturnValue(mockScheduleTimeWindowUserFlow);
    });

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-04-30T07:00:00.000Z'));
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should render schedule time windows without alert and without default time windows', async () => {
      setup();

      const header = await screen.findByTestId(
        REQUEST_TIME_WINDOWS_TEST_IDS.SCHEDULE_TIME_HEADER
      );
      expect(header).toHaveTextContent('When are you available for a visit?');

      const scheduleTimeAlert = screen.queryByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.ALERT
      );
      expect(scheduleTimeAlert).not.toBeInTheDocument();

      const availabilityMessage = await screen.findByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.AVAILABILITY_MESSAGE
      );
      expect(availabilityMessage).toBeVisible();
      expect(availabilityMessage).toHaveTextContent(
        'The more availability you have, the more likely we can see you today. We require a minimum 4 hour service window for all requests.'
      );

      const dayToggleButtonGroup = await screen.findByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.DAY_TOGGLE_BUTTON_GROUP
      );
      expect(dayToggleButtonGroup).toBeVisible();

      const dayToggleButtonToday = await screen.findByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(DaysEnum.today)
      );
      expect(dayToggleButtonToday).toBeVisible();
      expect(dayToggleButtonToday).toHaveTextContent('Today');

      const dayToggleButtonTomorrow = await screen.findByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(
          DaysEnum.tomorrow
        )
      );
      expect(dayToggleButtonTomorrow).toBeVisible();
      expect(dayToggleButtonTomorrow).toHaveTextContent('Tomorrow');

      const startTimeField = await screen.findByTestId(
        TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(startTimePrefixText)
      );
      expect(startTimeField).toBeVisible();

      const endTimeField = await screen.findByTestId(
        TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(endTimePrefixText)
      );
      expect(endTimeField).toBeVisible();

      const continueBtn = await screen.findByTestId(
        REQUEST_TIME_WINDOWS_TEST_IDS.CONTINUE_BUTTON
      );
      expect(continueBtn).toBeVisible();
    });

    it('should render schedule time windows with alert and with current "From" time and close market "To" time', async () => {
      mockSelectAddress.mockReturnValue({
        postalCode: '12345',
        streetAddress1: 'Test',
        streetAddress2: '',
        city: 'Test City',
        state: 'TES',
      });

      setup();

      const header = screen.getByTestId(
        REQUEST_TIME_WINDOWS_TEST_IDS.SCHEDULE_TIME_HEADER
      );
      expect(header).toHaveTextContent('When are you available for a visit?');

      const scheduleTimeAlert = await screen.findByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.ALERT
      );
      expect(scheduleTimeAlert).toBeVisible();

      const availabilityMessage = screen.getByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.AVAILABILITY_MESSAGE
      );
      expect(availabilityMessage).toBeVisible();
      expect(availabilityMessage).toHaveTextContent(
        'The more availability you have, the more likely we can see you today. We require a minimum 4 hour service window for all requests.'
      );

      const dayToggleButtonGroup = screen.getByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.DAY_TOGGLE_BUTTON_GROUP
      );
      expect(dayToggleButtonGroup).toBeVisible();

      const dayToggleButtonToday = screen.getByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(DaysEnum.today)
      );
      expect(dayToggleButtonToday).toBeVisible();
      expect(dayToggleButtonToday).toHaveTextContent('Today');

      const dayToggleButtonTomorrow = screen.getByTestId(
        SCHEDULE_TIME_WINDOWS_TEST_IDS.getDayToggleButtonTestId(
          DaysEnum.tomorrow
        )
      );
      expect(dayToggleButtonTomorrow).toBeVisible();
      expect(dayToggleButtonTomorrow).toHaveTextContent('Tomorrow');

      const startTimeField = screen.getByTestId(
        TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(startTimePrefixText)
      );
      expect(startTimeField).toBeVisible();
      expect(startTimeField).toHaveTextContent('2:00 am');

      const endTimeField = screen.getByTestId(
        TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(endTimePrefixText)
      );
      expect(endTimeField).toBeVisible();

      const continueBtn = screen.getByTestId(
        REQUEST_TIME_WINDOWS_TEST_IDS.CONTINUE_BUTTON
      );
      expect(continueBtn).toBeVisible();
    });
  });
});
