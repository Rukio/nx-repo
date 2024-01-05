import { render, renderHook, screen } from '../../../testUtils';
import {
  ConsentForm,
  ConsentFormProps,
  DefaultConsentQuestionAnswer,
} from './ConsentForm';
import { CONSENT_FORM_TEST_IDS } from './testIds';
import {
  ConsentFormFieldValues,
  ConsentQuestionsOrder,
  mockConsentQuestionFormFieldValues,
} from './constants';
import { CONSENT_QUESTION_TEST_IDS } from './ConsentQuestion/testIds';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';
import { useForm } from 'react-hook-form';

const defaultProps: Required<Omit<ConsentFormProps, 'formControl'>> = {
  isFirstQuestionDisplayed: true,
  isSecondQuestionDisplayed: true,
  isThirdQuestionDisplayed: true,
  isMedicalDecisionMakerSectionDisplayed: true,
  isAlertDisplayed: true,
  alertOptions: {
    title: '',
    message: 'Test Message',
  },
  isSubmitButtonDisabled: false,
  isSubmitButtonDisplayed: true,
  isRelationToPatientSelf: true,
  onSubmit: jest.fn(),
};

const getConsentFirstNameInput = () =>
  screen.getByTestId(CONSENT_FORM_TEST_IDS.FIRST_NAME_INPUT);
const getConsentLastNameInput = () =>
  screen.getByTestId(CONSENT_FORM_TEST_IDS.LAST_NAME_INPUT);
const getConsentPhoneNumberInput = () =>
  screen.getByTestId(CONSENT_FORM_TEST_IDS.PHONE_INPUT);
const getConsentAlert = () => screen.getByTestId(CONSENT_FORM_TEST_IDS.ALERT);

const getFormFooterSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const getConsentQuestionTitle = (order: ConsentQuestionsOrder) =>
  screen.getByTestId(CONSENT_QUESTION_TEST_IDS.getTitle(order));

const getConsentQuestionAnswer = (
  order: ConsentQuestionsOrder,
  answer: DefaultConsentQuestionAnswer
) => screen.getByTestId(CONSENT_QUESTION_TEST_IDS.getAnswer(order, answer));

const setup = (props: Partial<ConsentFormProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<ConsentFormFieldValues>({
      values: mockConsentQuestionFormFieldValues,
    })
  );

  return render(
    <ConsentForm
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />
  );
};

describe('ConsentForm', () => {
  it.each([
    {
      name: 'self relationship',
      isRelationToPatientSelf: true,
      expectedFirstQuestion: 'Do you make your own medical decisions?',
      expectedSecondQuestion:
        'Will the individual who makes your medical decisions be on-scene during our visit?',
    },
    {
      name: 'non-self relationship',
      isRelationToPatientSelf: false,
      expectedFirstQuestion:
        'Does the patient make their own medical decisions?',
      expectedSecondQuestion:
        'Will the individual who makes their medical decisions be on-scene during our visit?',
    },
  ])(
    'should render correctly with $name',
    ({
      isRelationToPatientSelf,
      expectedFirstQuestion,
      expectedSecondQuestion,
    }) => {
      setup({ isRelationToPatientSelf });

      const firstQuestionTitle = getConsentQuestionTitle(
        ConsentQuestionsOrder.First
      );
      expect(firstQuestionTitle).toBeVisible();
      expect(firstQuestionTitle).toHaveTextContent(expectedFirstQuestion);

      const firstQuestionYesAnswer = screen.getByTestId(
        CONSENT_QUESTION_TEST_IDS.getAnswer(
          ConsentQuestionsOrder.First,
          DefaultConsentQuestionAnswer.Yes
        )
      );
      expect(firstQuestionYesAnswer).toBeVisible();
      expect(firstQuestionYesAnswer).toHaveTextContent(
        DefaultConsentQuestionAnswer.Yes
      );

      const firstQuestionNoAnswer = getConsentQuestionAnswer(
        ConsentQuestionsOrder.First,
        DefaultConsentQuestionAnswer.No
      );
      expect(firstQuestionNoAnswer).toBeVisible();
      expect(firstQuestionNoAnswer).toHaveTextContent(
        DefaultConsentQuestionAnswer.No
      );

      const secondQuestionTitle = getConsentQuestionTitle(
        ConsentQuestionsOrder.Second
      );
      expect(secondQuestionTitle).toBeVisible();
      expect(secondQuestionTitle).toHaveTextContent(expectedSecondQuestion);

      const secondQuestionYesAnswer = getConsentQuestionAnswer(
        ConsentQuestionsOrder.Second,
        DefaultConsentQuestionAnswer.Yes
      );
      expect(secondQuestionYesAnswer).toBeVisible();
      expect(secondQuestionYesAnswer).toHaveTextContent(
        DefaultConsentQuestionAnswer.Yes
      );

      const secondQuestionNoAnswer = getConsentQuestionAnswer(
        ConsentQuestionsOrder.Second,
        DefaultConsentQuestionAnswer.No
      );
      expect(secondQuestionNoAnswer).toBeVisible();
      expect(secondQuestionNoAnswer).toHaveTextContent(
        DefaultConsentQuestionAnswer.No
      );

      const firstNameInput = getConsentFirstNameInput();
      expect(firstNameInput).toBeVisible();

      const lastNameInput = getConsentLastNameInput();
      expect(lastNameInput).toBeVisible();

      const phoneNumber = getConsentPhoneNumberInput();
      expect(phoneNumber).toBeVisible();

      const alert = getConsentAlert();
      expect(alert).toBeVisible();
      expect(alert).toHaveTextContent(
        defaultProps.alertOptions.message as string
      );

      const sumbitButton = getFormFooterSubmitButton();
      expect(sumbitButton).toBeVisible();
      expect(sumbitButton).toBeEnabled();
    }
  );

  it('should call onSubmit once submit button clicked', async () => {
    const { user } = setup();

    const sumbitButton = getFormFooterSubmitButton();
    expect(sumbitButton).toBeVisible();
    expect(sumbitButton).toBeEnabled();

    await user.click(sumbitButton);

    expect(defaultProps.onSubmit).toBeCalledTimes(1);
  });
});
