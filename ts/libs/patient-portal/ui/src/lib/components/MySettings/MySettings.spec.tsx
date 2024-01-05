import { TEST_IDS } from '../../..';
import { render, screen } from '../../../testUtils';
import MySettings, { MySettingsData, MySettingsProps } from './MySettings';
import { MY_SETTINGS_LIST_TEST_IDS } from './testIds';

const MOCK_TEST_ID_PREFIX = 'test-id-prefix';
const MOCK_DATA_WITH_PATIENT_DETAILS: Required<MySettingsData> = {
  firstName: 'TEST_FIRST_NAME',
  lastName: 'TEST_LAST_NAME',
  email: 'test_email@*company-data-covered*.com',
  dateOfBirth: 'TEST_DATE',
  phoneNumber: 'TEST_PHONE_NUMBER',
  legalSex: 'TEST_LEGAL_SEX',
  assignedSexAtBirth: 'TEST_ASSIGNED_SEX_AT_BIRTH',
  genderIdentity: 'TEST_GENDER_IDENTITY',
  billingAddress: {
    id: 'BILLING_ADDRESS_TEST_ID',
    streetAddress1: 'TEST_STREET_ADDRESS_1',
    streetAddress2: 'TEST_STREET_ADDRESS_2',
    city: 'TEST_CITY',
    state: 'TEST_STATE',
    zipCode: 'TEST_ZIPCODE',
  },
};
const MOCK_DATA_WITHOUT_PATIENT_DETAILS = {
  firstName: MOCK_DATA_WITH_PATIENT_DETAILS.firstName,
  lastName: MOCK_DATA_WITH_PATIENT_DETAILS.lastName,
  email: MOCK_DATA_WITH_PATIENT_DETAILS.email,
  phoneNumber: MOCK_DATA_WITH_PATIENT_DETAILS.phoneNumber,
};

const setup = <HasPatientDetails extends boolean>({
  settingsData,
  ...props
}: Partial<MySettingsProps<HasPatientDetails>> = {}) => {
  return render(
    <MySettings
      onAddPatientDetails={() => null}
      onSectionEdit={() => null}
      onSectionInfo={() => null}
      settingsData={{
        ...MOCK_DATA_WITHOUT_PATIENT_DETAILS,
        ...settingsData,
      }}
      testIdPrefix={MOCK_TEST_ID_PREFIX}
      {...props}
    />
  );
};

describe('<FormattedList />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        TEST_IDS.FORMATTED_LIST.getListRootTestId(MOCK_TEST_ID_PREFIX)
      )
    ).toBeVisible();
  });

  it('should render initial components if patient details have not been added', () => {
    setup({
      hasPatientDetails: false,
      settingsData: MOCK_DATA_WITHOUT_PATIENT_DETAILS,
    });

    const nameSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        MY_SETTINGS_LIST_TEST_IDS.getNameListItemTestIdPrefix(
          MOCK_TEST_ID_PREFIX
        )
      )
    );
    const emailSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        MY_SETTINGS_LIST_TEST_IDS.getEmailListItemTestIdPrefix(
          MOCK_TEST_ID_PREFIX
        )
      )
    );
    const phoneNumberSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        MY_SETTINGS_LIST_TEST_IDS.getPhoneNumberListItemTestIdPrefix(
          MOCK_TEST_ID_PREFIX
        )
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
  });

  it('should render patient details', () => {
    setup({
      hasPatientDetails: true,
      settingsData: MOCK_DATA_WITH_PATIENT_DETAILS,
    });

    const dobSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        MY_SETTINGS_LIST_TEST_IDS.getDOBListItemTestIdPrefix(
          MOCK_TEST_ID_PREFIX
        )
      )
    );
    const assignedSexAtBirthSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        MY_SETTINGS_LIST_TEST_IDS.getAssignedSexAtBirthListItemTestIdPrefix(
          MOCK_TEST_ID_PREFIX
        )
      )
    );
    const genderIdentitySection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        MY_SETTINGS_LIST_TEST_IDS.getGenderIdentityListItemTestIdPrefix(
          MOCK_TEST_ID_PREFIX
        )
      )
    );
    const billingAddressSection = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemTestId(
        MY_SETTINGS_LIST_TEST_IDS.getBillingAddressListItemTestIdPrefix(
          MOCK_TEST_ID_PREFIX
        )
      )
    );

    expect(dobSection).toBeVisible();
    expect(dobSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.dateOfBirth
    );
    expect(assignedSexAtBirthSection).toBeVisible();
    expect(assignedSexAtBirthSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.assignedSexAtBirth
    );
    expect(genderIdentitySection).toBeVisible();
    expect(genderIdentitySection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.genderIdentity as string
    );
    expect(billingAddressSection).toBeVisible();
    expect(billingAddressSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.billingAddress.streetAddress1 as string
    );
    expect(billingAddressSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.billingAddress.streetAddress2 as string
    );
    expect(billingAddressSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.billingAddress.city as string
    );
    expect(billingAddressSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.billingAddress.state as string
    );
    expect(billingAddressSection).toHaveTextContent(
      MOCK_DATA_WITH_PATIENT_DETAILS.billingAddress.zipCode as string
    );
  });
});
