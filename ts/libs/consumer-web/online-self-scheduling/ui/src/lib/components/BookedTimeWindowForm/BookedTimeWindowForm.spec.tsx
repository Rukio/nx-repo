import { render, renderHook, screen } from '../../../testUtils';
import { useForm } from 'react-hook-form';
import {
  BookedTimeWindowForm,
  BookedTimeWindowFormProps,
  BookedTimeWindowFormFieldValues,
} from './BookedTimeWindowForm';
import { TIME_RANGE_SELECTOR_TEST_IDS } from '../TimeRangeSelector';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';
import { TIME_WINDOWS_SECTION_TEST_IDS } from '../TimeWindowsSection';
import { BOOKED_TIME_WINDOW_TEST_IDS } from './testIds';

const defaultProps: Omit<Required<BookedTimeWindowFormProps>, 'formControl'> = {
  isTimeRangeErrorShown: true,
  isSubmitButtonDisabled: false,
  timeWindowSectionTitle: 'Test title',
  openTimeAlertMessage: 'Open tomorrow from 8 am - 10 pm',
  startTimeOptions: [
    {
      label: '11 am',
      value: '11:00:00',
    },
    {
      label: '12 am',
      value: '12:00:00',
    },
    {
      label: '13 am',
      value: '13:00:00',
    },
  ],
  endTimeOptions: [
    {
      label: '14 am',
      value: '14:00:00',
    },
    {
      label: '15 am',
      value: '15:00:00',
    },
    {
      label: '16 am',
      value: '16:00:00',
    },
  ],
  onSubmit: jest.fn(),
  disableRanges: false,
  marketAvailabilityAlertText:
    'Sorry, appointments have booked up fast and we’re not able to see you today. Please select your availability tomorrow.',
  isSelectedTimeAvailabilityAlert: false,
};

const getContainer = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.CONTAINER);
const getTodayToggle = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TODAY_TOGGLE);
const getTomorrowToggle = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TOMORROW_TOGGLE);
const getAlert = () => screen.getByTestId(BOOKED_TIME_WINDOW_TEST_IDS.ALERT);
const getOpenTime = () =>
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
const queryStartTimeSelect = () =>
  screen.queryByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.START_TIME_RANGE_SELECTOR_PREFIX
    )
  );
const queryEndTimeSelect = () =>
  screen.queryByTestId(
    TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(
      TIME_WINDOWS_SECTION_TEST_IDS.END_TIME_RANGE_SELECTOR_PREFIX
    )
  );
const getFooterSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
const getTimeRangeError = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TIME_RANGE_ERROR);
const getUserSelectedTimeAvailabilityAlert = () =>
  screen.getByTestId(
    BOOKED_TIME_WINDOW_TEST_IDS.SELECTED_TIME_AVAILABILITY_ALERT
  );

const setup = (props: Partial<BookedTimeWindowFormProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<BookedTimeWindowFormFieldValues>()
  );

  return render(
    <BookedTimeWindowForm
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />
  );
};

describe('<BookedTimeWindowForm />', () => {
  it('should render BookedTimeWindowForm', () => {
    setup();

    expect(getContainer()).toBeVisible();

    expect(getTodayToggle()).toBeVisible();
    expect(getTomorrowToggle()).toBeVisible();

    const alert = getAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(defaultProps.marketAvailabilityAlertText);

    const openTimeAlertMessage = getOpenTime();
    expect(openTimeAlertMessage).toBeVisible();
    expect(openTimeAlertMessage).toHaveTextContent(
      defaultProps.openTimeAlertMessage
    );

    const fromTimeSelect = getStartTimeSelect();
    expect(fromTimeSelect).toBeVisible();

    const toTimeSelect = getEndTimeSelect();
    expect(toTimeSelect).toBeVisible();

    const timeRangeError = getTimeRangeError();
    expect(timeRangeError).toBeVisible();
    expect(timeRangeError).toHaveTextContent(
      'Please select a minimum 4 hour time window.'
    );
  });

  it('should call onSubmit once Continue button clicked', async () => {
    const { user } = setup();

    const submitButton = getFooterSubmitButton();
    expect(submitButton).toBeVisible();

    await user.click(submitButton);

    expect(defaultProps.onSubmit).toBeCalledTimes(1);
  });

  it('should render disabled submit button if isSubmitButtonDisabled is falsy', async () => {
    setup({ isSubmitButtonDisabled: true });

    const submitButton = getFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toHaveTextContent('Confirm and Schedule Appointment');
    expect(submitButton).toBeDisabled();
  });

  it('should hide time selection', () => {
    setup({ disableRanges: true });

    expect(getContainer()).toBeVisible();

    expect(getTodayToggle()).toBeVisible();
    expect(getTomorrowToggle()).toBeVisible();

    const alert = getAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(defaultProps.marketAvailabilityAlertText);

    const openTimeAlertMessage = getOpenTime();
    expect(openTimeAlertMessage).toBeVisible();
    expect(openTimeAlertMessage).toHaveTextContent(
      defaultProps.openTimeAlertMessage
    );

    const fromTimeSelect = queryStartTimeSelect();
    expect(fromTimeSelect).not.toBeInTheDocument();

    const toTimeSelect = queryEndTimeSelect();
    expect(toTimeSelect).not.toBeInTheDocument();
  });

  it('should show user selected time availability error', () => {
    setup({ isSelectedTimeAvailabilityAlert: true });

    expect(getContainer()).toBeVisible();

    expect(getTodayToggle()).toBeVisible();
    expect(getTomorrowToggle()).toBeVisible();

    const alert = getAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(defaultProps.marketAvailabilityAlertText);

    const openTimeAlertMessage = getOpenTime();
    expect(openTimeAlertMessage).toBeVisible();
    expect(openTimeAlertMessage).toHaveTextContent(
      defaultProps.openTimeAlertMessage
    );

    const fromTimeSelect = getStartTimeSelect();
    expect(fromTimeSelect).toBeVisible();

    const toTimeSelect = getEndTimeSelect();
    expect(toTimeSelect).toBeVisible();

    const availabilityAlert = getUserSelectedTimeAvailabilityAlert();
    expect(availabilityAlert).toBeVisible();
  });
});
