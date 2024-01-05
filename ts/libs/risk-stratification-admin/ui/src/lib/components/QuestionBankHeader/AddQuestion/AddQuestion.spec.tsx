import { render, screen } from '../../../../testUtils';
import { QUESTION_BANK_QUESTION_MODAL_TEST_IDS as MODAL_TEST_IDS } from '../../QuestionBankQuestionModal';
import AddQuestion from './AddQuestion';
import { QUESTION_BANK_HEADER_ADD_QUESTION_TEST_IDS as TEST_IDS } from '../testIds';

describe('<QuestionBankAddQuestion />', () => {
  const onPublish = jest.fn();

  beforeEach(() => {
    onPublish.mockClear();
  });

  it('should render button and closed modal as default', () => {
    render(<AddQuestion onPublish={onPublish} />);

    const addQuestionBtn = screen.getByTestId(TEST_IDS.OPEN_MODAL_BUTTON);
    const addQuestionModal = screen.queryByTestId(MODAL_TEST_IDS.CONTENT);

    expect(addQuestionBtn).toBeVisible();
    expect(addQuestionModal).toBeNull();
  });

  it('should open modal when button is clicked', async () => {
    const { user } = render(<AddQuestion onPublish={onPublish} />);

    await user.click(screen.getByTestId(TEST_IDS.OPEN_MODAL_BUTTON));

    const addQuestionModal = screen.getByTestId(MODAL_TEST_IDS.CONTENT);

    expect(addQuestionModal).toBeVisible();
  });

  it('should call onPublish', async () => {
    const { user } = render(<AddQuestion onPublish={onPublish} />);

    await user.click(screen.getByTestId(TEST_IDS.OPEN_MODAL_BUTTON));

    await user.type(
      screen.getByLabelText('Patient Question'),
      'some patient question?'
    );

    await user.type(
      screen.getByLabelText('Someone else'),
      'someone else question?'
    );

    await user.click(screen.getByText('Publish Question'));

    expect(onPublish).toHaveBeenCalledWith(
      'some patient question?',
      'someone else question?'
    );
  });
});
