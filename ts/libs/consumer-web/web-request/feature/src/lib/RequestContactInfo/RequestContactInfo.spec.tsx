import {
  requestInitialState,
  RequestState,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { PHONE_NUMBER_INPUT_TEST_IDS } from '@*company-data-covered*/consumer-web/web-request/ui';
import { render, screen, within } from '../../testUtils';
import RequestContactInfo from './RequestContactInfo';
import { REQUEST_CONTACT_INFO_TEST_IDS } from './testIds';

const mockRequestState: RequestState = {
  ...requestInitialState,
  caller: {
    ...requestInitialState.caller,
    firstName: 'test',
    lastName: 'test',
    phone: '4242424242',
  },
};

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

const setupWithExistingRequest = () => {
  return render(<RequestContactInfo />, {
    withRouter: true,
    preloadedState: { request: mockRequestState },
  });
};

describe('<RequestContactInfo />', () => {
  it('should render correctly', () => {
    render(<RequestContactInfo />);

    const header = screen.getByTestId(REQUEST_CONTACT_INFO_TEST_IDS.HEADER);
    expect(header).toBeVisible();
    expect(header).toHaveTextContent('Let’s get you the care you need');

    const questionHeader = screen.getByTestId(
      REQUEST_CONTACT_INFO_TEST_IDS.QUESTION_HEADER
    );
    expect(questionHeader).toBeVisible();
    expect(questionHeader).toHaveTextContent('First, how can we reach you?');

    const callerFirstNameField = screen.getByTestId(
      REQUEST_CONTACT_INFO_TEST_IDS.CALLER_FIRST_NAME_FIELD
    );
    expect(callerFirstNameField).toBeVisible();

    const callerLastNameField = screen.getByTestId(
      REQUEST_CONTACT_INFO_TEST_IDS.CALLER_LAST_NAME_FIELD
    );
    expect(callerLastNameField).toBeVisible();

    const callerPhoneNumberInput = screen.getByTestId(
      PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER
    );
    expect(callerPhoneNumberInput).toBeVisible();
  });

  it('should enter the form fields', async () => {
    const { user } = render(<RequestContactInfo />);

    const continueButton = screen.getByTestId(
      REQUEST_CONTACT_INFO_TEST_IDS.CONTINUE_BUTTON
    );
    expect(continueButton).toBeDisabled();

    const callerFirstNameInput = screen.getByTestId(
      REQUEST_CONTACT_INFO_TEST_IDS.CALLER_FIRST_NAME_INPUT
    );

    await user.type(callerFirstNameInput, 'test');

    const callerLastNameInput = screen.getByTestId(
      REQUEST_CONTACT_INFO_TEST_IDS.CALLER_LAST_NAME_INPUT
    );

    await user.type(callerLastNameInput, 'test');

    const callerPhoneNumberInputTextbox = within(
      screen.getByTestId(PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER)
    ).getByRole('textbox');

    await user.type(callerPhoneNumberInputTextbox, '4242424242');

    expect(continueButton).toBeEnabled();
    await user.click(continueButton);
  });

  describe('Field Validation', () => {
    it('First name - should display an error message: "This field is required"', async () => {
      const { user } = setupWithExistingRequest();

      const continueButton = screen.getByTestId(
        REQUEST_CONTACT_INFO_TEST_IDS.CONTINUE_BUTTON
      );
      expect(continueButton).toBeEnabled();

      const callerFirstNameInput = screen.getByTestId(
        REQUEST_CONTACT_INFO_TEST_IDS.CALLER_FIRST_NAME_INPUT
      );

      await user.clear(callerFirstNameInput);

      await user.tab();

      expect(
        screen.getByTestId(
          REQUEST_CONTACT_INFO_TEST_IDS.CALLER_FIRST_NAME_FIELD
        )
      ).toHaveTextContent('This field is required');
      expect(continueButton).toBeDisabled();
    });

    it('Last name - should display an error message: "This field is required"', async () => {
      const { user } = setupWithExistingRequest();

      const continueButton = screen.getByTestId(
        REQUEST_CONTACT_INFO_TEST_IDS.CONTINUE_BUTTON
      );
      expect(continueButton).toBeEnabled();

      const callerLastNameInput = screen.getByTestId(
        REQUEST_CONTACT_INFO_TEST_IDS.CALLER_LAST_NAME_INPUT
      );

      await user.clear(callerLastNameInput);

      await user.tab();

      expect(
        screen.getByTestId(REQUEST_CONTACT_INFO_TEST_IDS.CALLER_LAST_NAME_FIELD)
      ).toHaveTextContent('This field is required');
      expect(continueButton).toBeDisabled();
    });

    it('Phone Number - should display an error message: "Please enter a valid phone number."', async () => {
      const { user } = render(<RequestContactInfo />);
      const phoneInput = screen.getByTestId(
        PHONE_NUMBER_INPUT_TEST_IDS.CONTAINER
      );
      await user.type(within(phoneInput).getByRole('textbox'), '1');
      await user.tab();
      expect(phoneInput).toHaveTextContent(
        'Please enter a valid phone number.'
      );
    });
  });
});
