import { render, screen, within } from '../../testUtils';
import {
  requestInitialState,
  RelationshipToPatient,
  RequestState,
  mockPatient,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { REQUEST_PERSONAL_INFO_TEST_IDS } from './testIds';
import RequestPersonalInfo from './RequestPersonalInfo';
import { PHONE_NUMBER_INPUT_TEST_IDS } from '@*company-data-covered*/consumer-web/web-request/ui';

jest.mock('libphonenumber-js', () => ({
  ...jest.requireActual('libphonenumber-js'),
  isValidPhoneNumber: jest.fn(() => true),
}));

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
  getConfig: () => ({
    get: (_name: string, fallback: unknown) => fallback,
  }),
}));

describe('<RequestPersonalInfo />', () => {
  it('RequestPersonalInfo snapshot without progress', () => {
    const { asFragment } = render(<RequestPersonalInfo />);

    expect(asFragment()).toMatchSnapshot();
  });

  describe('check the "Continue" button', () => {
    const mockRequestState: RequestState = {
      ...requestInitialState,
      patient: {
        ...requestInitialState.patient,
        firstName: 'test',
        lastName: 'test',
        email: 'test@test.com',
        phone: '4242424242',
        birthday: '1990-10-09T21:00:00.000Z',
        sex: 'M',
      },
      caller: {
        ...requestInitialState.caller,
        relationshipToPatient: RelationshipToPatient.familyFriend,
      },
    };

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2020-04-30T07:00:00.000Z'));
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should display the "Continue" button', () => {
      render(<RequestPersonalInfo />);

      expect(screen.getByTestId('continue-button')).toBeVisible();
      expect(screen.getByTestId('continue-button')).toHaveTextContent(
        'Continue'
      );
    });

    it('should be enable the button', () => {
      render(<RequestPersonalInfo />, {
        withRouter: true,
        preloadedState: { request: mockRequestState },
      });
      expect(screen.getByTestId('continue-button')).toBeEnabled();
    });

    it('should be disable the button, for a reason: isValidForm is false', () => {
      render(<RequestPersonalInfo />, {
        withRouter: true,
        preloadedState: {
          request: {
            ...mockRequestState,
            patient: requestInitialState.patient,
          },
        },
      });
      expect(
        screen.getByTestId(REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN)
      ).toHaveTextContent('Friend / Family Member');
      expect(screen.getByTestId('continue-button')).toBeDisabled();
    });

    it('should be disable the button, for a reason: relationshipToPatient is RelationshipToPatient.else', () => {
      render(<RequestPersonalInfo />, {
        withRouter: true,
        preloadedState: {
          request: {
            ...mockRequestState,
            caller: {
              ...mockRequestState.caller,
              relationshipToPatient: RelationshipToPatient.else,
            },
          },
        },
      });
      expect(
        screen.getByTestId(REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN)
      ).toHaveTextContent('Select relationship');
      expect(screen.getByTestId('continue-button')).toBeDisabled();
    });

    it('should enable "Continue" button when all fields are filled and valid', async () => {
      const { user } = render(<RequestPersonalInfo />, {
        withRouter: true,
        userEventOptions: { delay: null },
      });

      const relationshipDropdown = screen.getByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN
      );
      expect(relationshipDropdown).toBeVisible();

      const relationshipDropdownButton =
        within(relationshipDropdown).getByRole('button');
      await user.click(relationshipDropdownButton);

      const relationshipDropdownOptionFamilyFriend = screen.getByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN_OPTION_FAMILY_FRIEND
      );
      expect(relationshipDropdownOptionFamilyFriend).toBeVisible();
      await user.click(relationshipDropdownOptionFamilyFriend);

      const firstNameInput = await screen.findByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.FIRST_NAME_INPUT
      );
      expect(firstNameInput).toBeVisible();
      await user.type(firstNameInput, mockPatient.firstName);

      const lastNameInput = screen.getByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.LAST_NAME_INPUT
      );
      expect(lastNameInput).toBeVisible();
      await user.type(lastNameInput, mockPatient.lastName);

      const dateOfBirthInput = screen.getByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.DATE_OF_BIRTH_INPUT
      );
      expect(dateOfBirthInput).toBeVisible();
      await user.type(dateOfBirthInput, '12/12/1990');

      const legalSexDropdown = screen.getByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_DROPDOWN
      );
      expect(legalSexDropdown).toBeVisible();

      const legalSexDropdownButton =
        within(legalSexDropdown).getByRole('button');
      await user.click(legalSexDropdownButton);

      const legalSexDropdownOptionMale = screen.getByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_DROPDOWN_OPTION_MALE
      );
      expect(legalSexDropdownOptionMale).toBeVisible();
      await user.click(legalSexDropdownOptionMale);

      const phoneNumberInput = screen.getByTestId(
        `${PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER}-${REQUEST_PERSONAL_INFO_TEST_IDS.PHONE_NUMBER_INPUT}`
      );
      expect(phoneNumberInput).toBeVisible();
      await user.type(phoneNumberInput, mockPatient.phone);

      const continueButton = screen.getByTestId(
        REQUEST_PERSONAL_INFO_TEST_IDS.CONTINUE_BUTTON
      );
      expect(continueButton).toBeVisible();
      expect(continueButton).toBeEnabled();
    });
  });

  it('should block "Continue" button and not show personal and birthday fields if relationship is empty', () => {
    render(<RequestPersonalInfo />);

    const relationshipDropdown = screen.getByTestId(
      REQUEST_PERSONAL_INFO_TEST_IDS.RELATIONSHIP_DROPDOWN
    );
    expect(relationshipDropdown).toBeVisible();
    expect(relationshipDropdown).toHaveTextContent('Select relationship');

    const firstNameInput = screen.queryByTestId(
      REQUEST_PERSONAL_INFO_TEST_IDS.FIRST_NAME_INPUT
    );
    expect(firstNameInput).not.toBeInTheDocument();

    const lastNameInput = screen.queryByTestId(
      REQUEST_PERSONAL_INFO_TEST_IDS.LAST_NAME_INPUT
    );
    expect(lastNameInput).not.toBeInTheDocument();

    const dateOfBirthInput = screen.queryByTestId(
      REQUEST_PERSONAL_INFO_TEST_IDS.DATE_OF_BIRTH_LABEL
    );
    expect(dateOfBirthInput).not.toBeInTheDocument();

    const legalSexDropdown = screen.queryByTestId(
      REQUEST_PERSONAL_INFO_TEST_IDS.LEGAL_SEX_DROPDOWN
    );
    expect(legalSexDropdown).not.toBeInTheDocument();

    const phoneNumberInput = screen.queryByTestId(
      REQUEST_PERSONAL_INFO_TEST_IDS.PHONE_NUMBER_INPUT
    );
    expect(phoneNumberInput).not.toBeInTheDocument();

    const continueButton = screen.getByTestId(
      REQUEST_PERSONAL_INFO_TEST_IDS.CONTINUE_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeDisabled();
  });
});
