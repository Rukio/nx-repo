import { render, screen, within } from '../../../testUtils';
import { TIME_RANGE_SELECTOR_TEST_IDS } from './testIds';
import TimeRangeSelector, { TimeRangeSelectorProps } from './TimeRangeSelector';

const defaultProps: Required<TimeRangeSelectorProps> = {
  title: 'Time range selector',
  name: 'time-range-selector',
  value: '2020-04-30T00:00:00Z',
  timeSelectList: [
    { value: '2020-04-30T00:00:00Z', label: '12:00 am' },
    { value: '2020-04-30T01:00:00Z', label: '01:00 am' },
    { value: '2020-04-30T02:00:00Z', label: '02:00 am' },
  ],
  dataTestIdPrefix: 'time-range-selector',
  onChangeTime: jest.fn(),
  isLoading: false,
};

const setup = (props: Partial<TimeRangeSelectorProps> = {}) => {
  return render(<TimeRangeSelector {...defaultProps} {...props} />);
};

describe('<TimeRangeSelector />', () => {
  it("should render the component with selected '12:00 am' value", () => {
    setup();

    const title = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getTitleTestId(defaultProps.dataTestIdPrefix)
    );
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(defaultProps.title);

    const field = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(defaultProps.dataTestIdPrefix)
    );
    expect(field).toBeVisible();
    expect(field).toHaveTextContent('12:00 am');
  });

  it("should select '01:00 am' item from the dropdown list", async () => {
    const { user } = setup();

    const field = screen.getByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getFieldTestId(defaultProps.dataTestIdPrefix)
    );
    expect(field).toHaveTextContent('12:00 am');

    await user.click(within(field).getByRole('button'));

    const menuItemLabel = '01:00 am';
    const inputMenuItem = await screen.findByTestId(
      TIME_RANGE_SELECTOR_TEST_IDS.getRangeMenuItemTestId(
        defaultProps.dataTestIdPrefix,
        menuItemLabel
      )
    );
    await user.click(inputMenuItem);
    expect(inputMenuItem).toHaveTextContent(menuItemLabel);
    expect(defaultProps.onChangeTime).toBeCalledWith(
      defaultProps.name,
      '2020-04-30T01:00:00Z'
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
