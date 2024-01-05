import { render, screen, waitFor, within } from '../../testUtils';
import RequestHelp from './RequestHelp';
import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import { REQUEST_HELP_TEST_IDS } from './testIds';
import { WEB_REQUEST_ROUTES } from '../constants';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn().mockImplementation(() => mockUseNavigate),
  useSearchParams: jest.fn().mockImplementation(() => [
    new URLSearchParams({
      address: 'County Road 23, Denver, Denver, CO, USA',
    }),
  ]),
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

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getAddressInfo: jest.fn().mockImplementation(() =>
    Promise.resolve({
      parsedAddress: {
        streetName: 'County Road 23',
        streetNumber: '123',
        township: 'township',
        addressLine2: 'Denver County',
        state: 'CO',
        country: 'United States',
        postalCode: '123',
      },
      coordinates: {
        lat: 39.7843889,
        lng: -104.6216109,
      },
    })
  ),
}));

const setup = () => {
  const { user, ...wrapper } = render(<RequestHelp />);

  const selectSymptomAutocompleteOption = async (symptomName: string) => {
    const symptomsAutocompleteBtn = within(
      screen.getByTestId(REQUEST_HELP_TEST_IDS.SYMPTOM_REQUEST_AUTOCOMPLETE)
    ).getByRole('button');

    await user.click(symptomsAutocompleteBtn);

    const symptomsAutocompleteOption = await screen.findByTestId(
      REQUEST_HELP_TEST_IDS.getSymptomRequestAutocompleteDropdownOption(
        symptomName
      )
    );

    await user.click(symptomsAutocompleteOption);
  };

  return {
    user,
    selectSymptomAutocompleteOption,
    ...wrapper,
  };
};

const validateTitleAndQuestionHeader = async () => {
  const title = await screen.findByTestId('requesting-help-header');
  expect(title).toBeVisible();
  expect(title).toHaveTextContent('What can we help with today?');

  const questionHeader = await screen.findByTestId('question-header');
  expect(questionHeader).toBeVisible();
  expect(questionHeader).toHaveTextContent(
    'Please enter the primary reason for your care visit today.'
  );
};

describe('<RequestHelp />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('RequestHelp snapshot without progress', () => {
    const { asFragment } = setup();

    expect(asFragment()).toMatchSnapshot();
  });

  describe('structured symptoms flow', () => {
    it('should disable continue btn if no symptom was stated', async () => {
      setup();

      await validateTitleAndQuestionHeader();

      const continueBtn = screen.getByTestId(
        REQUEST_HELP_TEST_IDS.SUBMIT_BUTTON
      );
      expect(continueBtn).toBeVisible();
      expect(continueBtn).toBeDisabled();
    });

    it('should call router push fn on continue btn click when symptom is stated', async () => {
      jest.spyOn(statsig, 'getConfig').mockImplementation(
        () =>
          new DynamicConfig(
            'web_request_structured_symptoms',
            { structured_symptoms: ['cough'] },
            'ruleId',
            {
              time: 0,
              reason: EvaluationReason.Bootstrap,
            }
          )
      );

      const { user, selectSymptomAutocompleteOption } = setup();

      await validateTitleAndQuestionHeader();

      await selectSymptomAutocompleteOption('cough');

      const continueBtn = screen.getByTestId(
        REQUEST_HELP_TEST_IDS.SUBMIT_BUTTON
      );
      expect(continueBtn).toBeVisible();
      expect(continueBtn).toBeEnabled();
      await user.click(continueBtn);

      await waitFor(() => {
        expect(mockUseNavigate).toBeCalledWith(
          WEB_REQUEST_ROUTES.requestPreferredTime
        );
      });
    });

    it('should call router push fn on continue btn click when symptom is reselected', async () => {
      jest.spyOn(statsig, 'getConfig').mockImplementation(
        () =>
          new DynamicConfig(
            'web_request_structured_symptoms',
            { structured_symptoms: ['Cough', 'Blood in stool'] },
            'ruleId',
            {
              time: 0,
              reason: EvaluationReason.Bootstrap,
            }
          )
      );

      const { user, selectSymptomAutocompleteOption } = setup();

      await validateTitleAndQuestionHeader();

      await selectSymptomAutocompleteOption('Cough');

      const continueBtn = screen.getByTestId(
        REQUEST_HELP_TEST_IDS.SUBMIT_BUTTON
      );
      expect(continueBtn).toBeVisible();
      expect(continueBtn).toBeEnabled();

      await selectSymptomAutocompleteOption('Blood in stool');
      expect(continueBtn).toBeEnabled();
      await user.click(continueBtn);

      await waitFor(() => {
        expect(mockUseNavigate).toBeCalledWith(
          WEB_REQUEST_ROUTES.requestPreferredTime
        );
      });
    });

    it('should activate custom symptom input after custom input btn click', async () => {
      const { user } = setup();

      await validateTitleAndQuestionHeader();

      const customSymptomInputBtn = screen.getByTestId(
        REQUEST_HELP_TEST_IDS.CUSTOM_SYMPTOM_INPUT_BTN
      );
      expect(customSymptomInputBtn).toBeVisible();
      expect(customSymptomInputBtn).toBeEnabled();
      await user.click(customSymptomInputBtn);

      const symptomsPlaceholder = screen.getByTestId(
        REQUEST_HELP_TEST_IDS.SYMPTOM_REQUEST_INPUT_PLACEHOLDER
      );
      expect(symptomsPlaceholder).toHaveTextContent(
        'Separate symptoms by commas (i.e., "fever, cough, chills")'
      );

      const customSymptomInput = screen.getByTestId(
        REQUEST_HELP_TEST_IDS.SYMPTOM_REQUEST_INPUT
      );

      await user.type(customSymptomInput, 'cough');

      expect(customSymptomInput).toHaveValue('cough');

      const continueBtn = screen.getByTestId(
        REQUEST_HELP_TEST_IDS.SUBMIT_BUTTON
      );
      expect(continueBtn).toBeVisible();

      await waitFor(() => {
        expect(continueBtn).toBeEnabled();
      });

      await user.click(continueBtn);

      await waitFor(() => {
        expect(mockUseNavigate).toBeCalledWith(
          WEB_REQUEST_ROUTES.requestPreferredTime
        );
      });
    });
  });
});
