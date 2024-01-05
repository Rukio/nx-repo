import { render, screen } from '../../../../testUtils';
import { Search, SearchProps } from './index';
import { QUESTION_BANK_HEADER_SEARCH_TEST_IDS as TEST_IDS } from '../testIds';

const mockOnSearch = jest.fn();
const setup = (props?: Partial<SearchProps>) =>
  render(<Search onSearch={mockOnSearch} {...props} />);

describe('<Search />', () => {
  it('should render correctly', () => {
    setup();

    expect(screen.getByTestId(TEST_IDS.SEARCH_INPUT)).toBeVisible();
  });

  it('should have the correct placeholder', () => {
    setup();

    expect(screen.getByPlaceholderText('Search for question')).toBeVisible();
  });

  it('should call onSearch when the input changes', async () => {
    const onSearch = jest.fn();
    const { user } = setup({ onSearch });

    const input = screen.getByTestId(TEST_IDS.SEARCH_INPUT);
    const searchText = 'headache';

    await user.type(input, searchText);

    expect(input).toHaveValue(searchText);
    // It's called once for each character
    expect(onSearch).toHaveBeenCalledTimes(searchText.length);
    expect(onSearch).toHaveBeenCalledWith(searchText);
  });
});
