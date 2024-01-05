import { useForm } from 'react-hook-form';
import { render, renderHook, screen, within } from '../../../testUtils';
import SymptomsForm, {
  SymptomsFormFieldValues,
  SymptomsFormProps,
} from './SymptomsForm';
import { SYMPTOMS_FORM_TEST_IDS } from './testIds';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';
import { ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS } from '../AdditionalSymptomsConfirmation';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';

const mockSymptomsFormFieldValues: SymptomsFormFieldValues = {
  symptoms: '',
  isSymptomsConfirmChecked: false,
};

const defaultProps: Omit<SymptomsFormProps, 'formControl'> = {
  isRelationshipMyself: true,
  symptomsOptions: ['Abdominal Pain', 'Allergic Reaction', 'Animal Bite'],
  unsupportedSymptomsList: [
    'Severe headaches',
    'Difficulty breathing',
    'Chest pain',
  ],
  onResetSymptoms: jest.fn(),
  onSubmit: jest.fn(),
};

const setup = (props: Partial<SymptomsFormProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<SymptomsFormFieldValues>({
      values: mockSymptomsFormFieldValues,
    })
  );

  return render(
    <SymptomsForm
      formControl={result.current.control}
      {...defaultProps}
      {...props}
    />,
    { withRouter: true }
  );
};

describe('<SymptomsForm />', () => {
  it('should correctly display Symptoms from', () => {
    setup();

    const headerTitle = screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
    expect(headerTitle).toBeVisible();
    expect(headerTitle).toHaveTextContent('What can we help with today?');

    const headerSubtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(headerSubtitle).toBeVisible();
    expect(headerSubtitle).toHaveTextContent(
      'Please enter your primary symptom so that we can send out the correct medical team for you.'
    );

    const symptomsForm = screen.getByTestId(SYMPTOMS_FORM_TEST_IDS.ROOT);
    expect(symptomsForm).toBeVisible();

    const autocompleteField = screen.getByTestId(
      SYMPTOMS_FORM_TEST_IDS.AUTOCOMPLETE_FIELD
    );
    expect(autocompleteField).toBeVisible();

    const customSymptomField = screen.queryByTestId(
      SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_FIELD
    );
    expect(customSymptomField).not.toBeInTheDocument();

    const symptomsConfirmSection = screen.queryByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.ROOT
    );
    expect(symptomsConfirmSection).not.toBeInTheDocument();

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toHaveTextContent('Continue');

    const customSymptomInputButton = screen.getByTestId(
      SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_INPUT_BUTTON
    );
    expect(customSymptomInputButton).toBeVisible();
    expect(customSymptomInputButton).toHaveTextContent(
      'My symptom isn’t on this list'
    );
  });

  it('should display additional symptoms confirmation section if symptoms are selected', () => {
    const mockUnsupportedSymptomsList: SymptomsFormProps['unsupportedSymptomsList'] =
      ['Severe headaches', 'Difficulty breathing', 'Chest pain'];

    setup({
      unsupportedSymptomsList: mockUnsupportedSymptomsList,
      isAdditionalSymptomsConfirmDisplayed: true,
    });

    const autocompleteField = screen.getByTestId(
      SYMPTOMS_FORM_TEST_IDS.AUTOCOMPLETE_FIELD
    );
    expect(autocompleteField).toBeVisible();

    const symptomsConfirmationSection = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.ROOT
    );
    expect(symptomsConfirmationSection).toBeInTheDocument();
  });

  it('should display additional symptoms confirmation section with the checked checkbox by default', () => {
    const mockUnsupportedSymptomsList: SymptomsFormProps['unsupportedSymptomsList'] =
      ['Severe headaches', 'Difficulty breathing', 'Chest pain'];

    setup({
      isAdditionalSymptomsConfirmDisplayed: true,
      unsupportedSymptomsList: mockUnsupportedSymptomsList,
    });

    const symptomsConfirmationSection = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.ROOT
    );
    expect(symptomsConfirmationSection).toBeInTheDocument();

    const checkboxField = screen.getByTestId(
      ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FIELD
    );
    expect(checkboxField).toBeVisible();

    const checkboxInput = within(checkboxField).getByRole('checkbox');
    expect(checkboxInput).not.toBeChecked();
  });

  it('should call onSubmit on continue button click', async () => {
    const { user } = setup();

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    expect(defaultProps.onSubmit).toBeCalled();
  });

  it.each([
    {
      name: 'myself relationship and select input',
      isRelationshipMyself: true,
      expectSubtitle:
        'Please enter your primary symptom so that we can send out the correct medical team for you.',
    },
    {
      name: 'someone else relationship and select input',
      isRelationshipMyself: false,
      expectSubtitle:
        'Please enter the patient’s primary symptom so that we can send out the correct medical team for them.',
    },
    {
      name: 'myself relationship and custom input',
      isRelationshipMyself: true,
      isCustomSymptomsSelected: true,
      expectSubtitle:
        'Please enter a short list of the symptoms you’re experiencing.',
    },
    {
      name: 'someone else relationship and custom input',
      isRelationshipMyself: false,
      isCustomSymptomsSelected: true,
      expectSubtitle:
        'Please enter a short list of the symptoms the patient is experiencing.',
    },
  ])(
    `should show different messages for subtitles, that depend on $name`,
    ({ isRelationshipMyself, expectSubtitle, isCustomSymptomsSelected }) => {
      const mockSymptomsOptions: SymptomsFormProps['symptomsOptions'] = [
        'symptoms',
      ];

      setup({
        isRelationshipMyself,
        isCustomSymptomsSelected,
        symptomsOptions: mockSymptomsOptions,
      });

      const headerSubtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
      expect(headerSubtitle).toBeVisible();
      expect(headerSubtitle).toHaveTextContent(expectSubtitle);
    }
  );

  it.each([
    {
      name: 'myself relationship',
      isRelationshipMyself: true,
      expectSymptomsConfirmAlertMessage:
        'If you are experiencing any of the following symptoms, please call 911 or a doctor.',
      expectSymptomsConfirmCheckboxLabel:
        'I am not experiencing any of these additional symptoms.',
      expectCustomSymptomButtonText: 'My symptom isn’t on this list',
    },
    {
      name: 'someone else relationship',
      isRelationshipMyself: false,
      expectSymptomsConfirmAlertMessage:
        'If the patient is experiencing any of the following symptoms, please call 911 or a doctor.',
      expectSymptomsConfirmCheckboxLabel:
        'The patient is not experiencing any of these additional symptoms.',
      expectCustomSymptomButtonText: 'Patient’s symptom isn’t on this list',
    },
  ])(
    `should show different messages for 'Additional symptoms confirmation' section and 'Custom symptom' button, that depend on $name`,
    ({
      isRelationshipMyself,
      expectSymptomsConfirmAlertMessage,
      expectSymptomsConfirmCheckboxLabel,
      expectCustomSymptomButtonText,
    }) => {
      const mockSymptomsOptions: SymptomsFormProps['symptomsOptions'] = [
        'symptoms',
      ];
      setup({
        isRelationshipMyself,
        isAdditionalSymptomsConfirmDisplayed: true,
        symptomsOptions: mockSymptomsOptions,
      });

      const section = screen.getByTestId(
        ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.ROOT
      );
      expect(section).toBeVisible();

      const title = screen.getByTestId(
        ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.TITLE
      );
      expect(title).toBeVisible();
      expect(title).toHaveTextContent(expectSymptomsConfirmAlertMessage);

      const checkboxFormControl = screen.getByTestId(
        ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FORM_CONTROL
      );
      expect(checkboxFormControl).toBeVisible();
      expect(checkboxFormControl).toHaveTextContent(
        expectSymptomsConfirmCheckboxLabel
      );

      const customSymptomButton = screen.getByTestId(
        SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_INPUT_BUTTON
      );
      expect(customSymptomButton).toBeVisible();
      expect(customSymptomButton).toHaveTextContent(
        expectCustomSymptomButtonText
      );
    }
  );
});
