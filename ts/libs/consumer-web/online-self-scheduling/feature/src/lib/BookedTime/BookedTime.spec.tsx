import { rest } from 'msw';
import {
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
  mockSelfScheduleData,
  MarketFeasibilityStatus,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  FORM_FOOTER_TEST_IDS,
  TIME_RANGE_SELECTOR_TEST_IDS,
  TIME_WINDOWS_SECTION_TEST_IDS,
  PAGE_LAYOUT_TEST_IDS,
  BOOKED_TIME_WINDOW_TEST_IDS,
  LOADING_SECTION_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { render, screen, waitFor, testSegmentPageView } from '../../testUtils';
import {
  mswServer,
  buildCheckMarketFeasibilityApiPath,
} from '../../testUtils/server';
import { BookedTime } from './BookedTime';
import { ONLINE_SELF_SCHEDULING_ROUTES, SEGMENT_EVENTS } from '../constants';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const findPageLoader = () => screen.findByTestId(PAGE_LAYOUT_TEST_IDS.LOADER);
const getTodayToggle = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TODAY_TOGGLE);
const getTomorrowToggle = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TOMORROW_TOGGLE);
const getMarketAvailabilityAlert = () =>
  screen.getByTestId(BOOKED_TIME_WINDOW_TEST_IDS.ALERT);
const getMarketOpenTimeTitle = () =>
  screen.getByTestId(BOOKED_TIME_WINDOW_TEST_IDS.OPEN_TIME);
const getStartTimeSelect = () =>
  screen.getByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.START_TIME_RANGE_SELECTOR_PREFIX
    )
  );
const getEndTimeSelect = () =>
  screen.getByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.END_TIME_RANGE_SELECTOR_PREFIX
    )
  );
const getFooterSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
const queryTimeRangeError = () =>
  screen.queryByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TIME_RANGE_ERROR);
const findUserSelectedTimeAvailabilityAlert = () =>
  screen.findByTestId(
    BOOKED_TIME_WINDOW_TEST_IDS.SELECTED_TIME_AVAILABILITY_ALERT
  );
const queryUserSelectedTimeAvailabilityAlert = () =>
  screen.queryByTestId(
    BOOKED_TIME_WINDOW_TEST_IDS.SELECTED_TIME_AVAILABILITY_ALERT
  );

const findSubmitLoadingScreenText = () =>
  screen.findByTestId(LOADING_SECTION_TEST_IDS.SUBTITLE);

const preferredStartTime = '07';
const preferredEndTime = '23';

const getMockDateString = (time: string) => `2023-07-05T${time}:00:00.000Z`;

const setup = () => {
  return render(<BookedTime />, {
    withRouter: true,
    userEventOptions: { delay: null },
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
        data: {
          ...mockSelfScheduleData,
          preferredEta: {
            ...mockSelfScheduleData.preferredEta,
            patientPreferredEtaStart: getMockDateString(preferredStartTime),
            patientPreferredEtaEnd: getMockDateString(preferredEndTime),
          },
        },
      },
    },
  });
};

describe('<BookedTime />', () => {
  beforeAll(() => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date(getMockDateString(preferredStartTime)));
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterEach(() => {
    mswServer.resetHandlers();
  });

  it('should render properly', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_BOOKED_TIME);
    const pageLoader = await findPageLoader();

    await waitFor(() => {
      expect(pageLoader).not.toBeInTheDocument();
    });

    const marketOpenTimeTitle = getMarketOpenTimeTitle();
    expect(marketOpenTimeTitle).toBeVisible();
    expect(marketOpenTimeTitle).toHaveTextContent(
      'Open today from 7 am - 11 pm'
    );

    const todayToggle = getTodayToggle();
    expect(todayToggle).toBeVisible();

    const tomorrowToggle = getTomorrowToggle();
    expect(tomorrowToggle).toBeVisible();

    const marketAvailabilityMessage = getMarketAvailabilityAlert();
    expect(marketAvailabilityMessage).toBeVisible();
    expect(marketAvailabilityMessage).toHaveTextContent(
      'Sorry, appointments have booked up fast and we’re not able to see you tomorrow. Please select a time today.'
    );

    const timeStartSelect = getStartTimeSelect();
    expect(timeStartSelect).toBeVisible();
    expect(timeStartSelect).toHaveTextContent(`${preferredStartTime}:00 am`);

    const timeEndSelect = getEndTimeSelect();
    expect(timeEndSelect).toBeVisible();
    expect(timeEndSelect).toHaveTextContent(
      `${Number(preferredEndTime) - 12}:00 pm`
    );

    await user.click(tomorrowToggle);

    await waitFor(() => {
      expect(getMarketOpenTimeTitle()).toHaveTextContent(
        'Open tomorrow from 7 am - 11 pm'
      );
    });

    expect(queryUserSelectedTimeAvailabilityAlert()).not.toBeInTheDocument();

    expect(queryTimeRangeError()).not.toBeInTheDocument();

    const submitButton = getFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).not.toBeDisabled();
  });

  it('should render user selected time availability error', async () => {
    mswServer.use(
      rest.post(buildCheckMarketFeasibilityApiPath(), async (req, res, ctx) => {
        const body = await req.json();

        // start time and end time are exist only in user selected time check
        const isRequestForMarketAvailability =
          !body.startTimeSec && !body.endTimeSec;

        return res(
          ctx.status(200),
          ctx.json({
            data: {
              availability: isRequestForMarketAvailability
                ? MarketFeasibilityStatus.Available
                : MarketFeasibilityStatus.Unavailable,
            },
          })
        );
      })
    );
    setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_BOOKED_TIME);
    const pageLoader = await findPageLoader();

    await waitFor(() => {
      expect(pageLoader).not.toBeInTheDocument();
    });

    const marketOpenTimeTitle = getMarketOpenTimeTitle();
    expect(marketOpenTimeTitle).toBeVisible();

    const todayToggle = getTodayToggle();
    expect(todayToggle).toBeVisible();

    const tomorrowToggle = getTomorrowToggle();
    expect(tomorrowToggle).toBeVisible();

    const marketAvailabilityMessage = getMarketAvailabilityAlert();
    expect(marketAvailabilityMessage).toBeVisible();

    const timeStartSelect = getStartTimeSelect();
    expect(timeStartSelect).toBeVisible();

    const timeEndSelect = getEndTimeSelect();
    expect(timeEndSelect).toBeVisible();

    const userAvailabilityAlert = await findUserSelectedTimeAvailabilityAlert();
    expect(userAvailabilityAlert).toBeVisible();

    const submitButton = getFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should submit selected user time', async () => {
    const { user } = setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_BOOKED_TIME);
    const pageLoader = await findPageLoader();

    await waitFor(() => {
      expect(pageLoader).not.toBeInTheDocument();
    });

    const marketOpenTimeTitle = getMarketOpenTimeTitle();
    expect(marketOpenTimeTitle).toBeVisible();

    const todayToggle = getTodayToggle();
    expect(todayToggle).toBeVisible();

    const tomorrowToggle = getTomorrowToggle();
    expect(tomorrowToggle).toBeVisible();

    const marketAvailabilityMessage = getMarketAvailabilityAlert();
    expect(marketAvailabilityMessage).toBeVisible();

    const timeStartSelect = getStartTimeSelect();
    expect(timeStartSelect).toBeVisible();

    const timeEndSelect = getEndTimeSelect();
    expect(timeEndSelect).toBeVisible();

    const submitButton = getFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    const loadingText = await findSubmitLoadingScreenText();
    expect(loadingText).toBeVisible();

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.CONFIRMATION
      );
    });
  });
});
