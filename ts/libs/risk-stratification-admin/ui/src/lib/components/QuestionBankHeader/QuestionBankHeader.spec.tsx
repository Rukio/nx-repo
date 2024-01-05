import { render, screen } from '../../../testUtils';
import QuestionBankHeader, {
  QuestionBankHeaderProps,
} from './QuestionBankHeader';
import {
  QUESTION_BANK_HEADER_ADD_QUESTION_TEST_IDS as ADD_QUESTION_TEST_IDS,
  QUESTION_BANK_HEADER_TEST_IDS as TEST_IDS,
  QUESTION_BANK_HEADER_SEARCH_TEST_IDS as SEARCH_TEST_IDS,
} from './testIds';

const mockOnAddQuestion = jest.fn();
const mockOnSearch = jest.fn();

const setup = (props?: Partial<QuestionBankHeaderProps>) =>
  render(
    <QuestionBankHeader
      onSearch={mockOnSearch}
      onAddQuestion={mockOnAddQuestion}
      {...props}
    />
  );

describe('<QuestionBankHeader />', () => {
  it('should render correctly', () => {
    setup();

    expect(screen.getByTestId(TEST_IDS.QUESTION_BANK_HEADER)).toBeVisible();
    expect(screen.getByTestId(SEARCH_TEST_IDS.SEARCH_INPUT)).toBeVisible();
    expect(
      screen.getByTestId(ADD_QUESTION_TEST_IDS.OPEN_MODAL_BUTTON)
    ).toBeVisible();
  });

  it('should call onSearch when the search input is used', async () => {
    const onSearch = jest.fn();
    const { user } = setup({ onSearch });
    const searchInput = screen.getByTestId(SEARCH_TEST_IDS.SEARCH_INPUT);

    const searchValue = 'stomach ache';
    await user.type(searchInput, searchValue);

    expect(searchInput).toHaveValue(searchValue);
    expect(onSearch).toHaveBeenCalledWith(searchValue);
  });

  it('should call onAddQuestion when the add question button is clicked', async () => {
    const onAddQuestion = jest.fn();
    const { user } = setup({ onAddQuestion });

    await user.click(
      screen.getByTestId(ADD_QUESTION_TEST_IDS.OPEN_MODAL_BUTTON)
    );
    await user.type(
      screen.getByLabelText('Patient Question'),
      'some patient question?'
    );
    await user.click(screen.getByText('Publish Question'));

    expect(onAddQuestion).toHaveBeenCalledTimes(1);
    expect(onAddQuestion).toHaveBeenCalledWith('some patient question?', '');
  });
});
