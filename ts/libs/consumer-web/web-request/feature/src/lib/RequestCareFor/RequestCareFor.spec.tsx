import { render, screen, waitFor } from '../../testUtils';
import RequestCareFor, { careOptions } from './RequestCareFor';
import { REQUEST_CARE_FOR_TEST_IDS } from './testIds';

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

describe('<RequestCareFor />', () => {
  it('should render correctly', () => {
    render(<RequestCareFor />);

    const requestingCareHeader = screen.getByTestId(
      REQUEST_CARE_FOR_TEST_IDS.REQUESTING_CARE_HEADER
    );
    expect(requestingCareHeader).toBeVisible();
    expect(requestingCareHeader).toHaveTextContent(
      'Who are you requesting care for?'
    );

    careOptions.forEach((careOption) => {
      const careForButton = screen.getByTestId(
        REQUEST_CARE_FOR_TEST_IDS.getCareForButtonTestId(careOption.title)
      );
      expect(careForButton).toBeVisible();
      expect(careForButton).toBeEnabled();
      expect(careForButton).toHaveTextContent(careOption.title);
    });

    const continueButton = screen.getByTestId(
      REQUEST_CARE_FOR_TEST_IDS.CONTINUE_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeDisabled();
  });

  it('should enable Continue button if care for option is selected', async () => {
    const { user } = render(<RequestCareFor />);

    const mockCareOption = careOptions[0];

    const continueButton = screen.getByTestId(
      REQUEST_CARE_FOR_TEST_IDS.CONTINUE_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeDisabled();

    const careForButton = screen.getByTestId(
      REQUEST_CARE_FOR_TEST_IDS.getCareForButtonTestId(mockCareOption.title)
    );
    expect(careForButton).toBeVisible();
    expect(careForButton).toBeEnabled();
    expect(careForButton).toHaveTextContent(mockCareOption.title);

    await user.click(careForButton);

    await waitFor(() => {
      expect(continueButton).toBeEnabled();
    });
  });
});
