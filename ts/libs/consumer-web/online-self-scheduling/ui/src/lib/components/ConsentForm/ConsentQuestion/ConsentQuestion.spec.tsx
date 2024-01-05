import { render, renderHook, screen } from '../../../../testUtils';
import { ConsentQuestionsOrder, ConsentFormFieldValues } from '../constants';
import ConsentQuestion, { ConsentQuestionProps } from './ConsentQuestion';
import { CONSENT_QUESTION_TEST_IDS } from './testIds';
import { mockConsentQuestionFormFieldValues } from '../constants';
import { useForm } from 'react-hook-form';

const defaultProps: Omit<ConsentQuestionProps, 'formControl'> = {
  consentQuestion: {
    question: 'Lorem Ipsum has been the industrys standard Question?',
    answerOptions: ['Yes', 'No'],
    order: ConsentQuestionsOrder.First,
  },
  fieldName: 'firstConsentQuestion',
};

const getConsentQuestionContainer = () =>
  screen.getByTestId(
    CONSENT_QUESTION_TEST_IDS.getContainer(ConsentQuestionsOrder.First)
  );
const getConsentQuestionTitle = () =>
  screen.getByTestId(
    CONSENT_QUESTION_TEST_IDS.getTitle(ConsentQuestionsOrder.First)
  );
const getConsentQuestionAnswer = (value: string) =>
  screen.getByTestId(
    CONSENT_QUESTION_TEST_IDS.getAnswer(ConsentQuestionsOrder.First, value)
  );

const setup = (props: Partial<ConsentQuestionProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<ConsentFormFieldValues>({
      values: mockConsentQuestionFormFieldValues,
    })
  );

  return render(
    <ConsentQuestion
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />
  );
};

describe('ConsentQuestion', () => {
  it('should render ConsentQuestion correctly', () => {
    setup();

    const container = getConsentQuestionContainer();
    expect(container).toBeVisible();

    const questionTitle = getConsentQuestionTitle();
    expect(questionTitle).toBeVisible();
    expect(questionTitle).toHaveTextContent(
      defaultProps.consentQuestion.question
    );

    const questionFirstAnswer = getConsentQuestionAnswer(
      defaultProps.consentQuestion.answerOptions[0]
    );
    expect(questionFirstAnswer).toBeVisible();
    expect(questionFirstAnswer).toHaveTextContent(
      defaultProps.consentQuestion.answerOptions[0]
    );

    const questionSecondAnswer = getConsentQuestionAnswer(
      defaultProps.consentQuestion.answerOptions[1]
    );
    expect(questionSecondAnswer).toBeVisible();
    expect(questionSecondAnswer).toHaveTextContent(
      defaultProps.consentQuestion.answerOptions[1]
    );
  });
});
