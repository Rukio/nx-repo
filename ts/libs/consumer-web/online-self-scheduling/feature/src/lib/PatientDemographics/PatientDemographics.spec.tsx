import { rest } from 'msw';
import {
  manageSelfScheduleInitialState,
  MANAGE_SELF_SCHEDULE_SLICE_KEY,
  mockUpdatePatientAccountPayload,
  mockAccountPatients,
  mockPatientAccount,
  mockSelfScheduleData,
  RelationToPatient,
  mockCreatePatientAccountUnverifiedPatientPayload,
  mockPatientAccountVerifiedPatient,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  FORM_FOOTER_TEST_IDS,
  FORM_HEADER_TEST_IDS,
  PAGE_LAYOUT_TEST_IDS,
  PATIENT_DEMOGRAPHICS_FORM_TEST_IDS,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  render,
  screen,
  waitFor,
  within,
  testSegmentPageView,
} from '../../testUtils';
import {
  RequestProgressStep,
  SEGMENT_EVENTS,
  ONLINE_SELF_SCHEDULING_ROUTES,
} from '../constants';
import { LEGAL_SEX_OPTIONS } from './constants';
import {
  buildCacheApiPath,
  buildGetAccountApiPath,
  buildGetAccountPatientsApiPath,
  mswServer,
} from '../../testUtils/server';
import { PatientDemographics } from './PatientDemographics';
import { ADD_SOMEONE_ELSE_OPTION } from './utils';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const findTitle = () => screen.findByTestId(FORM_HEADER_TEST_IDS.TITLE);

const getPatientLegalSexFieldSelectButton = () => {
  const selectField = screen.getByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LEGAL_SEX_FIELD
  );

  return within(selectField).getByRole('button');
};

const findPatientLegalSexOption = (value: string) =>
  screen.findByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.getPatientLegalSexSelectItem(value)
  );

const getSubmitButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const findReturningPatientSection = () =>
  screen.findByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.RETURNING_PATIENT_SECTION
  );

const findReturningPatientRadioOption = (value: string) =>
  screen.getByTestId(
    PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.getReturningPatientRadioOption(value)
  );

const mockNewPatientResponses = () => {
  mswServer.use(
    rest.get(buildGetAccountPatientsApiPath(), (_req, res, ctx) => {
      return res.once(
        ctx.status(200),
        ctx.json({
          data: [],
        })
      );
    })
  );
};

const setup = () => {
  mockNewPatientResponses();

  return render(<PatientDemographics />, {
    withRouter: true,
  });
};

const setupWithNonSelfRelationship = () => {
  mockNewPatientResponses();

  mswServer.use(
    rest.get(buildCacheApiPath(), (_req, res, ctx) => {
      return res.once(
        ctx.status(200),
        ctx.json({
          data: {
            ...mockSelfScheduleData,
            requester: {
              ...mockSelfScheduleData.requester,
              relationToPatient: RelationToPatient.FamilyFriend,
            },
          },
        })
      );
    })
  );

  return render(<PatientDemographics />, {
    withRouter: true,
  });
};

const setupWithReturningPatient = () => {
  return render(<PatientDemographics />, {
    preloadedState: {
      [MANAGE_SELF_SCHEDULE_SLICE_KEY]: {
        ...manageSelfScheduleInitialState,
        data: {
          ...manageSelfScheduleInitialState.data,
          requester: {
            relationToPatient: RelationToPatient.Patient,
          },
        },
      },
    },
    withRouter: true,
  });
};

describe('<PatientDemographics />', () => {
  it('should render correctly', async () => {
    setup();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PATIENT_DEMOGRAPHICS);

    const title = await findTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Tell us more about yourself');

    const requestProgressBar = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.REQUEST_PROGRESS_BAR
    );
    expect(requestProgressBar).toBeVisible();
    expect(requestProgressBar).toHaveAttribute(
      'aria-valuenow',
      RequestProgressStep.PatientDemographics.toString()
    );

    const messageSection = screen.getByTestId(
      PAGE_LAYOUT_TEST_IDS.MESSAGE_SECTION
    );
    expect(messageSection).toHaveTextContent('Email verified!');

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
  });

  it('should render title correctly for non-self relation to patient', async () => {
    setupWithNonSelfRelationship();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PATIENT_DEMOGRAPHICS);

    const title = await findTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent('Tell us more about the patient');
  });

  it('should submit patient for non-self relation to patient', async () => {
    const { user } = setupWithNonSelfRelationship();

    const title = await findTitle();
    expect(title).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();

    expect(submitButton).toBeDisabled();

    const requesterFirstNameInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_FIRST_NAME_INPUT
    );
    expect(requesterFirstNameInput).toBeVisible();

    await user.type(
      requesterFirstNameInput,
      mockUpdatePatientAccountPayload.firstName
    );

    const requesterLastNameInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_LAST_NAME_INPUT
    );
    expect(requesterLastNameInput).toBeVisible();

    await user.type(
      requesterLastNameInput,
      mockUpdatePatientAccountPayload.lastName
    );

    const requesterPhoneNumberInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.REQUESTER_PHONE_NUMBER_INPUT
    );
    expect(requesterPhoneNumberInput).toBeVisible();

    await user.type(
      requesterPhoneNumberInput,
      mockUpdatePatientAccountPayload.phone
    );

    const patientFirstNameInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_FIRST_NAME_INPUT
    );
    expect(patientFirstNameInput).toBeVisible();

    await user.type(
      patientFirstNameInput,
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .givenName
    );

    const patientMiddleNameInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_MIDDLE_NAME_INPUT
    );
    expect(patientMiddleNameInput).toBeVisible();

    await user.type(
      patientMiddleNameInput,
      mockPatientAccountVerifiedPatient.middleName
    );

    const patientLastNameInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_LAST_NAME_INPUT
    );
    expect(patientLastNameInput).toBeVisible();

    await user.type(
      patientLastNameInput,
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .familyName
    );

    const patientPhoneNumberInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_PHONE_NUMBER_INPUT
    );
    expect(patientPhoneNumberInput).toBeVisible();

    await user.type(
      patientPhoneNumberInput,
      mockCreatePatientAccountUnverifiedPatientPayload.unverifiedPatient
        .phoneNumber
    );

    const patientDateOfBirthInput = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_DATE_OF_BIRTH_INPUT
    );
    expect(patientDateOfBirthInput).toBeVisible();

    await user.clear(patientDateOfBirthInput);

    await user.type(patientDateOfBirthInput, '01/01/2000');

    const patientLegalSexFieldSelectButton =
      getPatientLegalSexFieldSelectButton();
    expect(patientLegalSexFieldSelectButton).toBeVisible();

    await user.click(patientLegalSexFieldSelectButton);

    const firstOption = await findPatientLegalSexOption(
      LEGAL_SEX_OPTIONS[0].value
    );
    expect(firstOption).toBeVisible();

    await user.click(firstOption);

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.CONSENT
      );
    });
  });

  it('should render correctly for returning patient', async () => {
    setupWithReturningPatient();

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PATIENT_DEMOGRAPHICS);

    const title = await findTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(
      `Welcome back, ${mockPatientAccount.firstName}`
    );

    const subtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(subtitle).toBeVisible();
    expect(subtitle).toHaveTextContent('Who are you requesting care for?');

    const returningPatientSection = await findReturningPatientSection();
    expect(returningPatientSection).toBeVisible();

    mockAccountPatients.forEach((mockAccountPatient) => {
      const returningPatientRadioOption = findReturningPatientRadioOption(
        mockAccountPatient.id.toString()
      );

      expect(returningPatientRadioOption).toBeVisible();
      expect(returningPatientRadioOption).toHaveTextContent(
        `${mockAccountPatient.unverifiedPatient.givenName} ${mockAccountPatient.unverifiedPatient.familyName}`
      );

      const returningPatientRadioOptionInput = within(
        returningPatientRadioOption
      ).getByRole('radio');

      //RTL .toHaveValue() is not supported for type="radio"
      expect(returningPatientRadioOptionInput).toHaveAttribute(
        'value',
        mockAccountPatient.id.toString()
      );
    });

    const returningPatientRadioAddSomeoneElseOption =
      findReturningPatientRadioOption(ADD_SOMEONE_ELSE_OPTION);
    expect(returningPatientRadioAddSomeoneElseOption).toBeVisible();
    expect(returningPatientRadioAddSomeoneElseOption).toHaveTextContent(
      ADD_SOMEONE_ELSE_OPTION
    );

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should render sex and gender details section correctly', async () => {
    const { user } = setup();

    const patientDemographicsForm = await screen.findByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.ROOT
    );
    expect(patientDemographicsForm).toBeVisible();

    const patientAddSexAndGenderDetailsButton = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ADD_SEX_AND_GENDER_DETAILS_BUTTON
    );
    expect(patientAddSexAndGenderDetailsButton).toBeVisible();
    expect(patientAddSexAndGenderDetailsButton).toHaveTextContent(
      'Add Sex and Gender Details'
    );

    await user.click(patientAddSexAndGenderDetailsButton);

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

    const patientAssignedSexAtBirthField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_ASSIGNED_SEX_AT_BIRTH_FIELD
    );
    expect(patientAssignedSexAtBirthField).toBeVisible();

    const patientGenderIdentityLabel = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_LABEL
    );
    expect(patientGenderIdentityLabel).toBeVisible();
    expect(patientGenderIdentityLabel).toHaveTextContent('Gender Identity');

    const patientGenderIdentityField = screen.getByTestId(
      PATIENT_DEMOGRAPHICS_FORM_TEST_IDS.PATIENT_GENDER_IDENTITY_FIELD
    );
    expect(patientGenderIdentityField).toBeVisible();
  });

  it('should behave correctly on submit and display correct title for returning patient', async () => {
    mswServer.use(
      rest.get(buildGetAccountApiPath(), (_req, res, ctx) => {
        return res.once(
          ctx.status(200),
          ctx.json({ data: { ...mockPatientAccount, firstName: '' } })
        );
      })
    );
    const { user } = setupWithReturningPatient();

    const title = await findTitle();
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(/^Welcome back$/);

    await testSegmentPageView(SEGMENT_EVENTS.PAGE_VIEW_PATIENT_DEMOGRAPHICS);

    const returningPatientSection = await findReturningPatientSection();
    expect(returningPatientSection).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();

    const returningPatientRadioOption = findReturningPatientRadioOption(
      mockAccountPatients[0].id.toString()
    );

    await user.click(returningPatientRadioOption);

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(
        ONLINE_SELF_SCHEDULING_ROUTES.CONSENT
      );
    });
  });
});
