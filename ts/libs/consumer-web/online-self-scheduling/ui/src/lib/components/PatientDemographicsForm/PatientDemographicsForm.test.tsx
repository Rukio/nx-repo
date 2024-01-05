import { useForm } from 'react-hook-form';
import {
  render,
  renderHook,
  screen,
  exactRegexMatch,
  within,
} from '../../../testUtils';
import PatientDemographicsForm, {
  PatientDemographicsFormProps,
  PatientDemographicsFormFieldValues,
  DEFAULT_FORM_FIELD_VALUES,
  FormOption,
} from './PatientDemographicsForm';
import { PATIENT_DEMOGRAPHICS_FORM_TEST_IDS } from './testIds';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';

window.HTMLElement.prototype.scrollIntoView = jest.fn();

const getPatientSection = () =>
  screen.getByTestId(PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_SECTION);

const getPatientLegalSexField = () =>
  screen.getByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_FIELD
  );

const getPatientAssignedSexAtBirthField = () =>
  screen.getByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_FIELD
  );

const getPatientGenderIdentityField = () =>
  screen.getByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_FIELD
  );

const getPatientGenderIdentityDetailsField = () =>
  screen.getByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_DETAILS_FIELD
  );

const findAllPatientAssignedSexAtBirthSelectItems = () =>
  screen.findAllByTestId(
    new RegExp(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_SELECT_ITEM_PREFIX
    )
  );

const findAllPatientLegalSexSelectItems = () =>
  screen.findAllByTestId(
    new RegExp(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_SELECT_ITEM_PREFIX
    )
  );

const findAllPatientGenderIdentitySelectItems = () =>
  screen.findAllByTestId(
    new RegExp(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_SELECT_ITEM_PREFIX
    )
  );

const getSelectFieldButton = (selectField: HTMLElement) =>
  within(selectField).getByRole('button');

const getPatientFullLegalNameAlert = () =>
  screen.getByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FULL_LEGAL_NAME_ALERT
  );

const defaultProps: Omit<PatientDemographicsFormProps, 'formControl'> = {
  formHeaderTitle: 'Tell us more about yourself',
  isReturningPatientSectionVisible: false,
  isRequesterSectionVisible: false,
  isPatientSectionVisible: true,
  relationshipToPatientOptions: [],
  legalSexOptions: [],
  assignedSexAtBirthOptions: [],
  genderIdentityOptions: [],
  isSexAndGenderDetailsExpanded: false,
  onClickAddSexAndGenderDetails: jest.fn(),
  onSubmit: jest.fn(),
};

const setup = (
  props: Partial<PatientDemographicsFormProps> = {},
  formFieldValues: Partial<PatientDemographicsFormFieldValues> = {}
) => {
  const { result } = renderHook(() =>
    useForm<PatientDemographicsFormFieldValues>({
      values: {
        ...DEFAULT_FORM_FIELD_VALUES,
        ...formFieldValues,
      },
    })
  );

  return render(
    <PatientDemographicsForm
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />,
    {
      withRouter: true,
    }
  );
};

describe('PatientDemographicsForm', () => {
  it('should render the form correctly', () => {
    setup();

    const headerTitle = screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
    expect(headerTitle).toBeVisible();
    expect(headerTitle).toHaveTextContent(
      exactRegexMatch(defaultProps.formHeaderTitle)
    );

    const patientDemographicsForm = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.ROOT
    );
    expect(patientDemographicsForm).toBeVisible();

    const returningPatientSection = screen.queryByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.RETURNING_PATIENT_SECTION
    );
    expect(returningPatientSection).not.toBeInTheDocument();

    const requesterSection = screen.queryByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_SECTION
    );
    expect(requesterSection).not.toBeInTheDocument();

    const patientSection = getPatientSection();
    expect(patientSection).toBeVisible();

    const patientFullLegalNameLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FULL_LEGAL_NAME_LABEL
    );
    expect(patientFullLegalNameLabel).toBeVisible();
    expect(patientFullLegalNameLabel).toHaveTextContent(
      exactRegexMatch('Full Legal Name')
    );

    const patientFirstNameField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FIRST_NAME_FIELD
    );
    expect(patientFirstNameField).toBeVisible();

    const patientLastNameField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LAST_NAME_FIELD
    );
    expect(patientLastNameField).toBeVisible();

    const patientPhoneNumberLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_PHONE_NUMBER_LABEL
    );
    expect(patientPhoneNumberLabel).toBeVisible();
    expect(patientPhoneNumberLabel).toHaveTextContent(
      exactRegexMatch('Phone Number')
    );

    const patientPhoneNumberField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_PHONE_NUMBER_FIELD
    );
    expect(patientPhoneNumberField).toBeVisible();

    const patientDateOfBirthLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_DATE_OF_BIRTH_LABEL
    );
    expect(patientDateOfBirthLabel).toBeVisible();
    expect(patientDateOfBirthLabel).toHaveTextContent(
      exactRegexMatch('Date of Birth')
    );

    const patientDateOfBirthField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_DATE_OF_BIRTH_FIELD
    );
    expect(patientDateOfBirthField).toBeVisible();

    const patientLegalSexLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_LABEL
    );
    expect(patientLegalSexLabel).toBeVisible();
    expect(patientLegalSexLabel).toHaveTextContent('Legal Sex');

    const patientLegalSexLabelField = getPatientLegalSexField();
    expect(patientLegalSexLabelField).toBeVisible();

    const patientAddSexAndGenderDetailsButton = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ADD_SEX_AND_GENDER_DETAILS_BUTTON
    );
    expect(patientAddSexAndGenderDetailsButton).toBeVisible();
    expect(patientAddSexAndGenderDetailsButton).toHaveTextContent(
      'Add Sex and Gender Details'
    );

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toHaveTextContent(exactRegexMatch('Continue'));
  });

  it('should render the form with non-self relationship correctly', () => {
    const mockRelationshipToPatientOptions: PatientDemographicsFormProps['relationshipToPatientOptions'] =
      [
        {
          value: 'Myself',
          label: 'myself',
        },
        {
          value: 'Add Someone Else',
          label: 'add-someone-else',
        },
      ];
    setup({
      isReturningPatientSectionVisible: true,
      relationshipToPatientOptions: mockRelationshipToPatientOptions,
    });

    const returningPatientSection = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.RETURNING_PATIENT_SECTION
    );
    expect(returningPatientSection).toBeVisible();

    mockRelationshipToPatientOptions.forEach((option) => {
      const relationshipToPatientOption = screen.getByTestId(
        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.getReturningPatientRadioOption(
          option.label
        )
      );
      expect(relationshipToPatientOption).toBeVisible();
      expect(relationshipToPatientOption).toHaveTextContent(option.label);
    });
  });

  it('should render the form with requester section', () => {
    setup({
      isRequesterSectionVisible: true,
    });

    const patientFullLegalNameAlert = getPatientFullLegalNameAlert();
    expect(patientFullLegalNameAlert).toBeVisible();
    expect(patientFullLegalNameAlert).toHaveTextContent(
      exactRegexMatch(
        'Make sure to enter the patient’s full legal name as it appears on their health insurance card.'
      )
    );

    const requesterSection = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_SECTION
    );
    expect(requesterSection).toBeVisible();
    expect(requesterSection).toHaveTextContent('About You');

    const requesterFullLegalNameLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_FULL_LEGAL_NAME_LABEL
    );
    expect(requesterFullLegalNameLabel).toBeVisible();
    expect(requesterFullLegalNameLabel).toHaveTextContent(
      exactRegexMatch('Full Legal Name')
    );

    const requesterFirstNameField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_FIRST_NAME_FIELD
    );
    expect(requesterFirstNameField).toBeVisible();

    const requesterLastNameField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_LAST_NAME_FIELD
    );
    expect(requesterLastNameField).toBeVisible();

    const requesterPhoneNumberLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_PHONE_NUMBER_LABEL
    );
    expect(requesterPhoneNumberLabel).toBeVisible();
    expect(requesterPhoneNumberLabel).toHaveTextContent(
      exactRegexMatch('Phone Number')
    );

    const requesterPhoneNumberField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_PHONE_NUMBER_FIELD
    );
    expect(requesterPhoneNumberField).toBeVisible();

    const patientSection = getPatientSection();
    expect(patientSection).toBeVisible();
    expect(patientSection).toHaveTextContent('Who Needs Care?');
  });

  it('should call onClickAddSexAndGenderDetails on "Add Sex and Gender Details" button click', async () => {
    const { user } = setup();

    const patientAddSexAndGenderDetailsButton = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ADD_SEX_AND_GENDER_DETAILS_BUTTON
    );
    expect(patientAddSexAndGenderDetailsButton).toBeVisible();
    expect(patientAddSexAndGenderDetailsButton).toHaveTextContent(
      'Add Sex and Gender Details'
    );

    await user.click(patientAddSexAndGenderDetailsButton);

    expect(defaultProps.onClickAddSexAndGenderDetails).toBeCalled();
  });

  it('should render sex and gender details section correctly', async () => {
    setup({
      isSexAndGenderDetailsExpanded: true,
    });

    const patientDemographicsForm = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.ROOT
    );
    expect(patientDemographicsForm).toBeVisible();

    const patientAddSexAndGenderDetailsCollapseSection =
      await screen.findByTestId(
        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_SEX_AND_GENDER_DETAILS_COLLAPSE_SECTION
      );
    expect(patientAddSexAndGenderDetailsCollapseSection).toBeVisible();

    const patientAssignedSexAtBirthLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_LABEL
    );
    expect(patientAssignedSexAtBirthLabel).toBeVisible();
    expect(patientAssignedSexAtBirthLabel).toHaveTextContent(
      'Assigned Sex at Birth'
    );

    const patientAssignedSexAtBirthField = getPatientAssignedSexAtBirthField();
    expect(patientAssignedSexAtBirthField).toBeVisible();

    const patientGenderIdentityLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_LABEL
    );
    expect(patientGenderIdentityLabel).toBeVisible();
    expect(patientGenderIdentityLabel).toHaveTextContent(
      exactRegexMatch('Gender Identity')
    );

    const patientGenderIdentityField = getPatientGenderIdentityField();
    expect(patientGenderIdentityField).toBeVisible();
  });

  it('should render gender identity details field correctly', async () => {
    setup({
      isSexAndGenderDetailsExpanded: true,
      isGenderIdentityDetailsFieldVisible: true,
    });

    const patientDemographicsForm = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.ROOT
    );
    expect(patientDemographicsForm).toBeVisible();

    const returningPatientSection = screen.queryByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.RETURNING_PATIENT_SECTION
    );
    expect(returningPatientSection).not.toBeInTheDocument();

    const patientSection = getPatientSection();
    expect(patientSection).toBeVisible();

    const patientGenderIdentityDetailsLabel = await screen.findByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_DETAILS_LABEL
    );
    expect(patientGenderIdentityDetailsLabel).toBeVisible();
    expect(patientGenderIdentityDetailsLabel).toHaveTextContent(
      exactRegexMatch('Gender Identity Details')
    );

    const patientGenderIdentityDetailsField =
      getPatientGenderIdentityDetailsField();
    expect(patientGenderIdentityDetailsField).toBeVisible();
  });

  it('should render select items correctly', async () => {
    const mockSelectOptions: FormOption[] = [
      { value: 'value 1', label: 'label 1' },
      { value: 'value 2', label: 'label 2' },
      { value: 'value 3', label: 'label 3' },
    ];

    const [mockSelectOption] = mockSelectOptions;

    const { user } = setup(
      {
        isSexAndGenderDetailsExpanded: true,
        legalSexOptions: mockSelectOptions,
        assignedSexAtBirthOptions: mockSelectOptions,
        genderIdentityOptions: mockSelectOptions,
      },
      {
        legalSex: mockSelectOption.value,
        assignedSexAtBirth: mockSelectOption.value,
        genderIdentity: mockSelectOption.value,
      }
    );

    const patientLegalSexField = getPatientLegalSexField();
    expect(patientLegalSexField).toBeVisible();

    const patientLegalSexFieldButton =
      getSelectFieldButton(patientLegalSexField);

    await user.click(patientLegalSexFieldButton);

    const patientLegalSexSelectItems =
      await findAllPatientLegalSexSelectItems();

    patientLegalSexSelectItems.forEach((item, idx) => {
      expect(item).toHaveTextContent(mockSelectOptions[idx].label);
    });

    await user.tab();

    const patientAddSexAndGenderDetailsCollapseSection =
      await screen.findByTestId(
        PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_SEX_AND_GENDER_DETAILS_COLLAPSE_SECTION
      );
    expect(patientAddSexAndGenderDetailsCollapseSection).toBeVisible();

    const patientAssignedSexAtBirthField = getPatientAssignedSexAtBirthField();
    expect(patientAssignedSexAtBirthField).toBeVisible();

    const patientAssignedSexAtBirthFieldButton = getSelectFieldButton(
      patientAssignedSexAtBirthField
    );
    expect(patientAssignedSexAtBirthField).toBeVisible();

    await user.click(patientAssignedSexAtBirthFieldButton);

    const patientAssignedSexAtBirthSelectItems =
      await findAllPatientAssignedSexAtBirthSelectItems();

    patientAssignedSexAtBirthSelectItems.forEach((item, idx) => {
      expect(item).toHaveTextContent(mockSelectOptions[idx].label);
    });

    await user.tab();

    const patientGenderIdentityField = getPatientGenderIdentityField();
    expect(patientGenderIdentityField).toBeVisible();

    const patientGenderIdentityFieldButton = getSelectFieldButton(
      patientGenderIdentityField
    );

    await user.click(patientGenderIdentityFieldButton);

    const patientGenderIdentitySelectItems =
      await findAllPatientGenderIdentitySelectItems();

    patientGenderIdentitySelectItems.forEach((item, idx) => {
      expect(item).toHaveTextContent(mockSelectOptions[idx].label);
    });
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
});
