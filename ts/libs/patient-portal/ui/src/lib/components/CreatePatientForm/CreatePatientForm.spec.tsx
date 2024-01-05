import { useForm } from 'react-hook-form';
import { render, renderHook, screen, within } from '../../../testUtils';
import CreatePatientForm, {
  CreatePatientFormProps,
  type CreatePatientFormFields,
} from './CreatePatientForm';
import { CREATE_PATIENT_FORM_TEST_IDS } from './testIds';

const defaultProps: Omit<CreatePatientFormProps, 'control'> = {
  handleSubmit: vi.fn((e) => e.preventDefault()),
  isSubmitButtonDisabled: false,
};

const getPatientFormFirstNameInput = () =>
  screen.getByTestId(CREATE_PATIENT_FORM_TEST_IDS.FIRST_NAME);

const getPatientFormLastNameInput = () =>
  screen.getByTestId(CREATE_PATIENT_FORM_TEST_IDS.LAST_NAME);

const getPatientFormPhoneNumberInput = () =>
  screen.getByTestId(CREATE_PATIENT_FORM_TEST_IDS.PHONE_NUMBER);

const getPatientFormDateOfBirthInput = () =>
  screen.getByTestId(CREATE_PATIENT_FORM_TEST_IDS.DATE_OF_BIRTH);

const getPatientFormAssignedSexInput = () => {
  const assignedSexFormControl = screen.getByTestId(
    CREATE_PATIENT_FORM_TEST_IDS.ASSIGNED_SEX_FORM_CONTROL
  );

  return within(assignedSexFormControl).getByRole('button', {
    ...screen.getByTestId(CREATE_PATIENT_FORM_TEST_IDS.ASSIGNED_SEX),
    expanded: false,
  });
};

const getPatientFormGenderIdentityInput = () => {
  const genderIdentityFormControl = screen.getByTestId(
    CREATE_PATIENT_FORM_TEST_IDS.GENDER_IDENTITY_FORM_CONTROL
  );

  return within(genderIdentityFormControl).getByRole('button', {
    ...screen.getByTestId(CREATE_PATIENT_FORM_TEST_IDS.GENDER_IDENTITY),
    expanded: false,
  });
};

const getPatientFormAssignedSexFemaleOptionInput = () =>
  screen.getByTestId(
    CREATE_PATIENT_FORM_TEST_IDS.getCreatePatientFormAssignedSexOptionTestId(
      'female'
    )
  );

const getPatientFormGenderIdentifiesAsFemaleOptionInput = () =>
  screen.getByTestId(
    CREATE_PATIENT_FORM_TEST_IDS.getCreatePatientFormGenderIdentityOptionTestId(
      'female'
    )
  );

const setup = () => {
  const { result } = renderHook(() =>
    useForm<CreatePatientFormFields>({
      defaultValues: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phoneNumber: '',
        assignedSexAtBirth: '',
        genderIdentity: '',
      },
    })
  );

  return render(
    <CreatePatientForm {...defaultProps} control={result.current.control} />,
    { withRouter: true }
  );
};

describe('<PatientForm />', () => {
  it('should render correctly', async () => {
    const { user } = setup();

    expect(getPatientFormFirstNameInput()).toBeVisible();

    expect(getPatientFormLastNameInput()).toBeVisible();

    expect(getPatientFormPhoneNumberInput()).toBeVisible();

    expect(getPatientFormDateOfBirthInput()).toBeVisible();

    const assignedSexInput = getPatientFormAssignedSexInput();

    expect(assignedSexInput).toBeVisible();
    expect(assignedSexInput).toHaveTextContent('Select Assigned Sex at Birth');

    await user.click(assignedSexInput);

    const assignedSexFemaleOption =
      getPatientFormAssignedSexFemaleOptionInput();

    await user.click(assignedSexFemaleOption);

    expect(assignedSexInput).toHaveTextContent('Female');

    const genderIdentityInput = getPatientFormGenderIdentityInput();

    expect(genderIdentityInput).toBeVisible();
    expect(genderIdentityInput).toHaveTextContent('Select Gender Identity');

    await user.click(genderIdentityInput);

    const genderIdentifiesAsOption =
      getPatientFormGenderIdentifiesAsFemaleOptionInput();

    await user.click(genderIdentifiesAsOption);

    expect(genderIdentityInput).toHaveTextContent('Identifies as Female');

    const submitButton = screen.getByTestId(
      CREATE_PATIENT_FORM_TEST_IDS.SUBMIT_BUTTON
    );

    expect(submitButton).toBeVisible();

    await user.click(submitButton);

    expect(defaultProps.handleSubmit).toHaveBeenCalled();
  });
});
