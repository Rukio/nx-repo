import {
  exactRegexMatch,
  render,
  screen,
  within,
  renderHook,
} from '../../../testUtils';
import { FieldValues, useForm } from 'react-hook-form';
import { TIME_RANGE_SELECTOR_TEST_IDS } from './testIds';
import TimeRangeSelector, { TimeRangeSelectorProps } from './TimeRangeSelector';

const defaultProps: Omit<
  Required<TimeRangeSelectorProps<FieldValues>>,
  'formControl'
> = {
  title: 'Time range selector',
  timeSelectList: [
    { value: '2020-04-30T00:00:00Z', label: '12:00 am' },
    { value: '2020-04-30T01:00:00Z', label: '01:00 am' },
    { value: '2020-04-30T02:00:00Z', label: '02:00 am' },
  ],
  dataTestIdPrefix: 'time-range-selector',
  isLoading: false,
  formFieldName: 'timeRangeSelect',
};

const setup = (props: Partial<TimeRangeSelectorProps<FieldValues>> = {}) => {
  const { result } = renderHook(() =>
    useForm<FieldValues>({
      defaultValues: {
        timeRangeSelect: defaultProps.timeSelectList[0].value,
      },
    })
  );

  return render(
    <TimeRangeSelector
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />
  );
};

describe('<TimeRangeSelector />', () => {
  it("should render the component with selected '12:00 am' value", () => {
    setup();

    const title = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getTitleTestId(defaultProps.dataTestIdPrefix)
    );
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(exactRegexMatch(defaultProps.title));

    const field = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(defaultProps.dataTestIdPrefix)
    );
    const fieldValueContainer = within(field).getByRole('button');
    expect(fieldValueContainer).toBeVisible();
    expect(fieldValueContainer).toHaveTextContent(
      exactRegexMatch(defaultProps.timeSelectList[0].label)
    );
  });

  it('should be disabled and render circular progress if loading is truthy', () => {
    setup({ isLoading: true });

    const field = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getInputTestId(defaultProps.dataTestIdPrefix)
    );
    expect(field).toBeDisabled();

    const circularProgress = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getCircularProgressTestId(
        defaultProps.dataTestIdPrefix
      )
    );
    expect(circularProgress).toBeVisible();
  });
});
