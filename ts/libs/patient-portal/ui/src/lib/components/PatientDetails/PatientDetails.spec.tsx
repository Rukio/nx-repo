import { TEST_IDS } from '../../..';
import { render, screen } from '../../../testUtils';
import { PatientData } from '../../types';
import PatientDetails, { PatientDetailsProps } from './PatientDetails';
import { PATIENT_DETAILS_TEST_IDS } from './testIds';

const MOCK_DATA_WITH_PATIENT_DETAILS: Required<PatientData> = {
  firstName: 'TEST_FIRST_NAME',
  lastName: 'TEST_LAST_NAME',
  email: 'test_email@*company-data-covered*.com',
  dateOfBirth: 'TEST_DATE',
  phoneNumber: 'TEST_PHONE_NUMBER',
  legalSex: 'TEST_LEGAL_SEX',
  assignedSexAtBirth: 'TEST_ASSIGNED_SEX_AT_BIRTH',
  genderIdentity: 'TEST_GENDER_IDENTITY',
};

const defaultProps: PatientDetailsProps = {
  patientDetails: MOCK_DATA_WITH_PATIENT_DETAILS,
  onRemovePatient: vi.fn(),
  onSectionEdit: vi.fn(),
  onSectionInfo: vi.fn(),
};

const setup = () => render(<PatientDetails {...defaultProps} />);

describe('<PatientDetails />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        TEST_IDS.FORMATTED_LIST.getListRootTestId(
          PATIENT_DETAILS_TEST_IDS.PREFIX
        )
      )
    ).toBeVisible();

    const nameSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(PATIENT_DETAILS_TEST_IDS.NAME)
    );
    const emailSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(PATIENT_DETAILS_TEST_IDS.EMAIL)
    );
    const phoneNumberSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        PATIENT_DETAILS_TEST_IDS.PHONE_NUMBER
      )
    );

    const dobSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(PATIENT_DETAILS_TEST_IDS.DOB)
    );
    const legalSexSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        PATIENT_DETAILS_TEST_IDS.LEGAL_SEX
      )
    );
    const assignedSexAtBirthSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        PATIENT_DETAILS_TEST_IDS.ASSIGNED_SEX_AT_BIRTH
      )
    );
    const genderIdentitySection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        PATIENT_DETAILS_TEST_IDS.GENDER_IDENTITY
      )
    );

    expect(nameSection).toBeVisible();
    expect(nameSection).toHaveTextContent(
      `${MOCK_DATA_WITH_PATIENT_DETAILS.firstName} ${MOCK_DATA_WITH_PATIENT_DETAILS.lastName}`
    );
    expect(emailSection).toBeVisible();
    expect(emailSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.email
    );
    expect(phoneNumberSection).toBeVisible();
    expect(phoneNumberSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.phoneNumber
    );

    expect(dobSection).toBeVisible();
    expect(dobSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.dateOfBirth
    );
    expect(legalSexSection).toBeVisible();
    expect(legalSexSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.legalSex
    );
    expect(assignedSexAtBirthSection).toBeVisible();
    expect(assignedSexAtBirthSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.assignedSexAtBirth
    );
    expect(genderIdentitySection).toBeVisible();
    expect(genderIdentitySection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.genderIdentity
    );
  });
});
