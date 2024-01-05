import {
  CreatePatientFormFields,
  TEST_IDS,
} from '@*company-data-covered*/patient-portal/ui';
import { render, screen, within } from '../../../testUtils';
import CreatePatientForm, { validationSchema } from './CreatePatientForm';
import { CREATE_PATIENT_FORM_TEST_IDS } from './testIds';

const getPatientFormFirstNameInput = () =>
  screen.getByTestId(TEST_IDS.CREATE_PATIENT_FORM.FIRST_NAME);

const getPatientFormLastNameInput = () =>
  screen.getByTestId(TEST_IDS.CREATE_PATIENT_FORM.LAST_NAME);

const getPatientFormPhoneNumberInput = () =>
  screen.getByTestId(TEST_IDS.CREATE_PATIENT_FORM.PHONE_NUMBER);

const getPatientFormDateOfBirthInput = () =>
  screen.getByTestId(TEST_IDS.CREATE_PATIENT_FORM.DATE_OF_BIRTH);

const getPatientFormAssignedSexInput = () => {
  const assignedSexFormControl = screen.getByTestId(
    TEST_IDS.CREATE_PATIENT_FORM.ASSIGNED_SEX_FORM_CONTROL
  );

  return within(assignedSexFormControl).getByRole('button', {
    ...screen.getByTestId(TEST_IDS.CREATE_PATIENT_FORM.ASSIGNED_SEX),
    expanded: false,
  });
};

const getPatientFormAssignedSexFemaleOptionInput = () =>
  screen.getByTestId(
    TEST_IDS.CREATE_PATIENT_FORM.getCreatePatientFormAssignedSexOptionTestId(
      'female'
    )
  );

const getPatientFormGenderIdentifiesAsFemaleOptionInput = () =>
  screen.getByTestId(
    TEST_IDS.CREATE_PATIENT_FORM.getCreatePatientFormGenderIdentityOptionTestId(
      'female'
    )
  );

const getPatientFormGenderIdentityInput = () => {
  const genderIdentityFormControl = screen.getByTestId(
    TEST_IDS.CREATE_PATIENT_FORM.GENDER_IDENTITY_FORM_CONTROL
  );

  return within(genderIdentityFormControl).getByRole('button', {
    ...screen.getByTestId(TEST_IDS.CREATE_PATIENT_FORM.GENDER_IDENTITY),
    expanded: false,
  });
};

const getPatientFormSubmitButton = () =>
  screen.getByTestId(TEST_IDS.CREATE_PATIENT_FORM.SUBMIT_BUTTON);

const setup = () => render(<CreatePatientForm />, { withRouter: true });

describe('<CreatePatientForm />', () => {
  it('should have default empty values', () => {
    setup();

    const formTitle = screen.getByTestId(
      TEST_IDS.PAGE_SECTION.getPageSectionTitleTestId(
        CREATE_PATIENT_FORM_TEST_IDS.TITLE
      )
    );

    expect(formTitle).toBeVisible();
    expect(formTitle).toHaveTextContent('Create Patient');

    const firstNameInput = getPatientFormFirstNameInput();
    const lastNameInput = getPatientFormLastNameInput();
    const phoneNumberInput = getPatientFormPhoneNumberInput();
    const dateOfBirthInput = getPatientFormDateOfBirthInput();
    const assignedSexInput = getPatientFormAssignedSexInput();
    const genderIdentityInput = getPatientFormGenderIdentityInput();

    expect(firstNameInput).toHaveValue('');
    expect(firstNameInput).toHaveAttribute('placeholder', 'First Name');
    expect(lastNameInput).toHaveValue('');
    expect(lastNameInput).toHaveAttribute('placeholder', 'Last Name');
    expect(phoneNumberInput).toHaveValue('');
    expect(phoneNumberInput).toHaveAttribute('placeholder', 'Phone Number');
    expect(dateOfBirthInput).toHaveValue('');
    expect(dateOfBirthInput).toHaveAttribute('placeholder', 'Date of Birth');
    expect(assignedSexInput).toHaveTextContent('Select Assigned Sex');
    expect(genderIdentityInput).toHaveTextContent('Select Gender Identity');
  });

  it('should have correct data when submit button is pressed', async () => {
    const { user } = setup();

    const fakeFormData: Omit<
      CreatePatientFormFields,
      'genderIdentity' | 'assignedSexAtBirth'
    > = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '800-555-5555',
      dateOfBirth: '01/01/2020',
    };

    const firstNameInput = getPatientFormFirstNameInput();
    const lastNameInput = getPatientFormLastNameInput();
    const phoneNumberInput = getPatientFormPhoneNumberInput();
    const dateOfBirthInput = getPatientFormDateOfBirthInput();
    const assignedSexInput = getPatientFormAssignedSexInput();
    const genderIdentityInput = getPatientFormGenderIdentityInput();

    const submitButton = getPatientFormSubmitButton();

    expect(submitButton).toBeDisabled();

    await user.type(firstNameInput, fakeFormData.firstName);

    await user.type(lastNameInput, fakeFormData.lastName);

    await user.type(phoneNumberInput, fakeFormData.phoneNumber);

    expect(submitButton).toBeDisabled();

    await user.type(dateOfBirthInput, fakeFormData.dateOfBirth);

    await user.click(assignedSexInput);

    const assignedSexFemaleOption =
      getPatientFormAssignedSexFemaleOptionInput();

    await user.click(assignedSexFemaleOption);

    await user.click(genderIdentityInput);

    expect(submitButton).toBeEnabled();

    const genderIdentifiesAsFemaleOption =
      getPatientFormGenderIdentifiesAsFemaleOptionInput();

    await user.click(genderIdentifiesAsFemaleOption);

    await user.click(submitButton);
  });

  it.each([
    {
      testCase: 'form is empty',
      formValues: {
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
        assignedSexAtBirth: '',
      },
      isValid: false,
    },
    {
      testCase: 'only first name is filled',
      formValues: {
        firstName: 'John',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
        assignedSexAtBirth: '',
      },
      isValid: false,
    },
    {
      testCase: 'first name and last name is filled',
      formValues: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '',
        dateOfBirth: '',
        assignedSexAtBirth: '',
      },
      isValid: false,
    },
    {
      testCase: 'first name, last name and phone number is filled',
      formValues: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '8003001000',
        dateOfBirth: '',
        assignedSexAtBirth: '',
      },
      isValid: false,
    },
    {
      testCase:
        'first name, last name, phone number and date of birth is filled',
      formValues: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '8003001000',
        dateOfBirth: '01/01/2020',
        assignedSexAtBirth: '',
      },
      isValid: false,
    },
    {
      testCase: 'all required fields is filled',
      formValues: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '8003001000',
        dateOfBirth: '01/01/2020',
        assignedSexAtBirth: 'Male',
      },
      isValid: true,
    },
  ])(
    'should return correct validation result when $testCase',
    async ({ formValues, isValid }) => {
      const validationResult = await validationSchema.isValid(formValues);

      expect(validationResult).toBe(isValid);
    }
  );
});
