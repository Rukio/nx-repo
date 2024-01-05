import { render, screen } from '../../../testUtils';
import QuestionBankTableEmptyBody from './QuestionBankTableEmptyBody';
import { QUESTION_BANK_TABLE_EMPTY_BODY_TEST_IDS } from './testIds';
import { QuizIcon, Table } from '@*company-data-covered*/design-system';

describe('<QuestionBankTableEmptyBody />', () => {
  it('should render properly', () => {
    render(
      <Table>
        <QuestionBankTableEmptyBody text="No questions added yet" />
      </Table>
    );

    const body = screen.getByTestId(
      QUESTION_BANK_TABLE_EMPTY_BODY_TEST_IDS.EMPTY_BODY
    );

    expect(body).toBeVisible();
    expect(body).toHaveTextContent('No questions added yet');
  });

  it('should render text', () => {
    const text = 'Custom Text';

    render(
      <Table>
        <QuestionBankTableEmptyBody text={text}>
          <QuizIcon />
        </QuestionBankTableEmptyBody>
      </Table>
    );

    const body = screen.getByTestId(
      QUESTION_BANK_TABLE_EMPTY_BODY_TEST_IDS.EMPTY_BODY
    );

    expect(body).toBeVisible();
    expect(body).toHaveTextContent(text);
  });

  it('should render children', () => {
    render(
      <Table>
        <QuestionBankTableEmptyBody text="No questions added yet">
          <QuizIcon />
        </QuestionBankTableEmptyBody>
      </Table>
    );

    const body = screen.getByTestId(
      QUESTION_BANK_TABLE_EMPTY_BODY_TEST_IDS.EMPTY_BODY
    );

    expect(body).toBeVisible();
    expect(screen.getByTestId('QuizIcon')).toBeVisible();
  });
});
