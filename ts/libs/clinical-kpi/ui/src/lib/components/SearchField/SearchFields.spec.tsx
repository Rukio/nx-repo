import { render, screen } from '../../../testUtils';
import { SEARCH_FIELD_TEST_IDS } from './testIds';
import SearchField, { SearchFieldProps } from './SearchField';

const onChangeMock = jest.fn();
const defaultProps: SearchFieldProps = {
  onChange: onChangeMock,
  debounceDelayMs: 0,
  value: '',
};

const setup = (props: Partial<SearchFieldProps> = {}) => {
  return render(<SearchField {...defaultProps} {...props} />);
};

describe('SearchField', () => {
  it('should render correctly', async () => {
    const { user } = setup();
    const searchField = screen.getByTestId(SEARCH_FIELD_TEST_IDS.ROOT);
    expect(searchField).toBeVisible();

    const searchFieldInput = screen.getByTestId(SEARCH_FIELD_TEST_IDS.INPUT);
    expect(searchFieldInput).toBeVisible();
    await user.type(searchFieldInput, 'A');
    expect(onChangeMock).toBeCalledWith('A');
  });

  it('should render correctly with provided value', async () => {
    const searchValue = 'John';
    setup({ value: searchValue });
    const searchFieldInput = screen.getByTestId(SEARCH_FIELD_TEST_IDS.INPUT);
    expect(searchFieldInput).toBeVisible();
    expect(searchFieldInput).toHaveValue(searchValue);
  });
});
