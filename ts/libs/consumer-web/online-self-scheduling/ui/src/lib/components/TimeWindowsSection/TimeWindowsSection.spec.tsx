import { render, screen, renderHook } from '../../../testUtils';
import TimeWindowsSection, {
  TimeWindowsSectionProps,
} from './TimeWindowsSection';
import { TIME_WINDOWS_SECTION_TEST_IDS } from './testIds';
import { TIME_RANGE_SELECTOR_TEST_IDS } from '../TimeRangeSelector';
import { useForm } from 'react-hook-form';
import { SelectTimeWindowFieldValues } from '../SelectTimeWindow/SelectTimeWindow';

const defaultProps: Omit<TimeWindowsSectionProps, 'formControl'> = {
  title: `I'm available`,
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
  isTimeRangeErrorShown: true,
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
const getTimeRangeError = () =>
  screen.getByTestId(TIME_WINDOWS_SECTION_TEST_IDS.TIME_RANGE_ERROR);

const setup = (props: Partial<TimeWindowsSectionProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<SelectTimeWindowFieldValues>({
      defaultValues: {
        startTime: defaultProps.startTimeOptions[0].value,
      },
    })
  );

  return render(
    <TimeWindowsSection
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />
  );
};

describe('<TimeWindowsSection />', () => {
  it('should render TimeWindowsSection', () => {
    setup();

    const container = getContainer();
    expect(container).toBeVisible();

    const todayToggle = getTodayToggle();
    expect(todayToggle).toBeVisible();

    const tomorrowToggle = getTomorrowToggle();
    expect(tomorrowToggle).toBeVisible();

    const timeRangeError = getTimeRangeError();
    expect(timeRangeError).toBeVisible();
    expect(timeRangeError).toHaveTextContent(
      'Please select a minimum 4 hour time window.'
    );

    const startTimeSelect = getStartTimeSelect();
    expect(startTimeSelect).toBeVisible();

    const endTimeSelect = getEndTimeSelect();
    expect(endTimeSelect).toBeVisible();
  });

  it('should render without time selection', () => {
    setup({ disableRanges: true });

    const container = getContainer();
    expect(container).toBeVisible();

    const todayToggle = getTodayToggle();
    expect(todayToggle).toBeVisible();

    const tomorrowToggle = getTomorrowToggle();
    expect(tomorrowToggle).toBeVisible();

    const startTimeSelect = queryStartTimeSelect();
    expect(startTimeSelect).not.toBeInTheDocument();

    const endTimeSelect = queryEndTimeSelect();
    expect(endTimeSelect).not.toBeInTheDocument();
  });
});
