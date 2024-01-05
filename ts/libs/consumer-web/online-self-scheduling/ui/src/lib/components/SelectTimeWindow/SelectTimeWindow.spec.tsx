import { render, renderHook, screen } from '../../../testUtils';
import { useForm } from 'react-hook-form';
import SelectTimeWindow, {
  SelectTimeWindowProps,
  SelectTimeWindowFieldValues,
} from './SelectTimeWindow';
import { TIME_RANGE_SELECTOR_TEST_IDS } from '../TimeRangeSelector';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';
import { TIME_WINDOWS_SECTION_TEST_IDS } from '../TimeWindowsSection';

const defaultProps: Omit<Required<SelectTimeWindowProps>, 'formControl'> = {
  isTimeRangeErrorShown: true,
  isSubmitButtonDisabled: false,
  title: 'When are you available for an appointment?',
  timeWindowSectionTitle: 'Test title',
  subtitle:
    'The more availability you have, the more likely we can see you today.',
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
};

const getContainer = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.CONTAINER);
const getTodayToggle = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TODAY_TOGGLE);
const getTomorrowToggle = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TOMORROW_TOGGLE);
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
const getHeaderTitle = () => screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
const getHeaderSubtitle = () =>
  screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
const getTimeRangeError = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TIME_RANGE_ERROR);

const setup = (props: Partial<SelectTimeWindowProps> = {}) => {
  const { result } = renderHook(() => useForm<SelectTimeWindowFieldValues>());

  return render(
    <SelectTimeWindow
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />
  );
};

describe('<SelectTimeWindow />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render SelectTimeWindow', () => {
    setup();

    expect(getContainer()).toBeVisible();

    const title = getHeaderTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(defaultProps.title);

    const subtitle = getHeaderSubtitle();
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent(defaultProps.subtitle);

    expect(getTodayToggle()).toBeVisible();
    expect(getTomorrowToggle()).toBeVisible();

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

  it('Continue button should be disabled', async () => {
    setup({ isSubmitButtonDisabled: true });

    const submitButton = getFooterSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });
});
