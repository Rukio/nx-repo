import { render, renderHook, screen, within } from '../../../testUtils';
import InsuranceClassification, {
  InsuranceClassificationProps,
  QuestionYesNoAnswer,
  InsuranceType,
} from './InsuranceClassification';
import { INSURANCE_CLASSIFICATION_TEST_IDS } from './testIds';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';
import { InsuranceClassificationFormValues } from './contants';
import { useForm } from 'react-hook-form';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';

const defaultProps: Required<
  Omit<InsuranceClassificationProps, 'formControl' | 'providerFormControl'>
> = {
  isRequesterRelationshipSelf: true,
  showSearchInsurance: true,
  showSecondQuestion: true,
  showSelectState: true,
  isSubmitButtonDisabled: false,
  insuranceValue: InsuranceType.Medicare,
  selectedAdministered: QuestionYesNoAnswer.No,
  stateOptions: [
    {
      id: 1,
      name: 'Arizona',
      abbreviation: 'AZ',
    },
    {
      id: 2,
      name: 'Colorado',
      abbreviation: 'CO',
    },
  ],
  onSubmit: jest.fn(),
  onSearchInsuranceProvidersClick: jest.fn(),
  formTitle: 'Let’s capture your health insurance',
  isLoading: false,
};

const getInsuranceClassificationTitle = () =>
  screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);

const getInsuranceTypeRadioOption = (optionValue: InsuranceType) =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.getInsuranceTypeRadioOption(optionValue)
  );

const getIsPublicInsuranceThroughCompanyRadioOption = (
  optionValue: QuestionYesNoAnswer
) =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.getIsPublicInsuranceThroughCompanyRadioOption(
      optionValue
    )
  );

const getInsuranceProvidersSearchField = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_PROVIDERS_SEARCH_FIELD
  );

const getStatesSelect = () =>
  screen.getByTestId(INSURANCE_CLASSIFICATION_TEST_IDS.STATES_SELECT);

const getFormFooterSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const getInsuranceTypeQuestion = () =>
  screen.getByTestId(INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_TYPE_QUESTION);

const getInsuranceThroughCompanyQuestion = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_THROUGH_COMPANY_QUESTION
  );

const getInsuranceCompanyDetailsQuestion = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_COMPANY_DETAILS_QUESTION
  );

const getInsuranceStateQuestion = () =>
  screen.getByTestId(
    INSURANCE_CLASSIFICATION_TEST_IDS.INSURANCE_STATE_QUESTION
  );

const findAllStatesMenuItems = () =>
  screen.findAllByTestId(
    new RegExp(INSURANCE_CLASSIFICATION_TEST_IDS.STATES_SELECT_ITEM_PREFIX)
  );

const mockInsuranceClassificationFormValues: InsuranceClassificationFormValues =
  {
    insuranceType: InsuranceType.Medicaid,
    isPublicInsuranceThroughCompany: QuestionYesNoAnswer.Yes,
    stateAbbr: '',
    insurancePayerId: '',
  };

const setup = (props: Partial<InsuranceClassificationProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<InsuranceClassificationFormValues>({
      values: mockInsuranceClassificationFormValues,
    })
  );

  return render(
    <InsuranceClassification
      formControl={result.current.control}
      {...defaultProps}
      {...props}
    />,
    { withRouter: true }
  );
};

describe('InsuranceClassification', () => {
  it('should render InsuranceClassification correctly', () => {
    setup();

    const employerInsuranceType = getInsuranceTypeRadioOption(
      InsuranceType.EmployerProvidedOrPrivate
    );
    expect(employerInsuranceType).toBeVisible();
    expect(employerInsuranceType).toHaveTextContent(
      'Employer-provided or private insurance'
    );

    const medicareInsuranceType = getInsuranceTypeRadioOption(
      InsuranceType.Medicare
    );
    expect(medicareInsuranceType).toBeVisible();
    expect(medicareInsuranceType).toHaveTextContent('Medicare');

    const medicaidInsuranceType = getInsuranceTypeRadioOption(
      InsuranceType.Medicaid
    );
    expect(medicaidInsuranceType).toBeVisible();
    expect(medicaidInsuranceType).toHaveTextContent('Medicaid');

    const noneInsuranceType = getInsuranceTypeRadioOption(InsuranceType.None);
    expect(noneInsuranceType).toBeVisible();
    expect(noneInsuranceType).toHaveTextContent('I don’t have insurance');

    const administeredRadioYes = getIsPublicInsuranceThroughCompanyRadioOption(
      QuestionYesNoAnswer.Yes
    );
    expect(administeredRadioYes).toBeVisible();
    expect(administeredRadioYes).toHaveTextContent(QuestionYesNoAnswer.Yes);

    const administeredRadioNo = getIsPublicInsuranceThroughCompanyRadioOption(
      QuestionYesNoAnswer.No
    );
    expect(administeredRadioNo).toBeVisible();
    expect(administeredRadioNo).toHaveTextContent(QuestionYesNoAnswer.No);

    const insuranceProvidersSearchField = getInsuranceProvidersSearchField();
    expect(insuranceProvidersSearchField).toBeVisible();

    const statesSelect = getStatesSelect();
    expect(statesSelect).toBeVisible();

    const sumbitButton = getFormFooterSubmitButton();
    expect(sumbitButton).toBeVisible();
    expect(sumbitButton).toBeEnabled();
  });

  it('should call onSubmit once click on submit button', async () => {
    const { user } = setup();

    const sumbitButton = getFormFooterSubmitButton();
    expect(sumbitButton).toBeVisible();
    expect(sumbitButton).toBeEnabled();

    await user.click(sumbitButton);

    expect(defaultProps.onSubmit).toBeCalledTimes(1);
  });

  it('should render states select menu items correctly', async () => {
    const { user } = setup();

    const statesSelect = getStatesSelect();
    expect(statesSelect).toBeVisible();

    const statesSelectButton = within(statesSelect).getByRole('button');
    expect(statesSelectButton).toBeVisible();

    await user.click(statesSelectButton);

    const statesMenuItems = await findAllStatesMenuItems();

    statesMenuItems.forEach((statesMenuItem, idx) => {
      expect(statesMenuItem).toHaveTextContent(
        defaultProps.stateOptions[idx].name
      );
    });
  });

  it.each([
    {
      isRequesterRelationshipSelf: true,
      expected: {
        insuranceClassificationTitleText: 'Let’s capture your health insurance',
        insuranceTypeQuestionText: 'What type of insurance do you have?',
        insuranceThroughCompanyQuestionText: `Is your ${InsuranceType.Medicare} administered through an insurance company? (for example, Blue Cross Blue Shield or Humana)`,
        insuranceCompanyDetailsQuestionText: `Is your ${InsuranceType.Medicare} administered through an insurance company? (for example, Blue Cross Blue Shield or Humana)`,
        insuranceStateQuestion: `What state is your ${InsuranceType.Medicare} offered through?`,
      },
    },
    {
      isRequesterRelationshipSelf: false,
      expected: {
        insuranceClassificationTitleText:
          'Let’s capture the patient’s health insurance',
        insuranceTypeQuestionText:
          'What type of insurance does the patient have?',
        insuranceThroughCompanyQuestionText: `Is their ${InsuranceType.Medicare} administered through an insurance company? (for example, Blue Cross Blue Shield or Humana)`,
        insuranceCompanyDetailsQuestionText: `Is their ${InsuranceType.Medicare} administered through an insurance company? (for example, Blue Cross Blue Shield or Humana)`,
        insuranceStateQuestion: `What state is their ${InsuranceType.Medicare} offered through?`,
      },
    },
  ])(
    'should return correct scripts if isRelationshipSelf is $isRequesterRelationshipSelf',
    ({ isRequesterRelationshipSelf, expected }) => {
      setup({
        isRequesterRelationshipSelf,
        formTitle: expected.insuranceClassificationTitleText,
      });

      const insuranceClassificationTitle = getInsuranceClassificationTitle();

      expect(insuranceClassificationTitle).toHaveTextContent(
        expected.insuranceClassificationTitleText
      );

      const insuranceTypeQuestion = getInsuranceTypeQuestion();
      expect(insuranceTypeQuestion).toHaveTextContent(
        expected.insuranceTypeQuestionText
      );

      const insuranceThroughCompanyQuestion =
        getInsuranceThroughCompanyQuestion();
      expect(insuranceThroughCompanyQuestion).toHaveTextContent(
        expected.insuranceThroughCompanyQuestionText
      );

      const insuranceCompanyDetailsQuestion =
        getInsuranceCompanyDetailsQuestion();
      expect(insuranceCompanyDetailsQuestion).toHaveTextContent(
        expected.insuranceCompanyDetailsQuestionText
      );

      const insuranceStateQuestion = getInsuranceStateQuestion();
      expect(insuranceStateQuestion).toHaveTextContent(
        expected.insuranceStateQuestion
      );
    }
  );
});
