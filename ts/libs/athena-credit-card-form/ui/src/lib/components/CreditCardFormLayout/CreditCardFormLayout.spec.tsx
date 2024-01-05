import { render, screen, waitFor } from '../../../testUtils';
import CreditCardFormLayout, {
  CreditCardFormLayoutProps,
} from './CreditCardFormLayout';
import { CREDIT_CARD_FORM_LAYOUT_TEST_IDS } from './testIds';

const defaultProps: CreditCardFormLayoutProps = {
  title: 'Form title',
  buttonText: 'Continue',
  onSubmit: vi.fn(),
};

const setup = (props: Partial<CreditCardFormLayoutProps> = {}) => {
  const { user, ...wrapper } = render(
    <CreditCardFormLayout {...defaultProps} {...props} />
  );

  const getSubmitButton = () =>
    screen.getByTestId(CREDIT_CARD_FORM_LAYOUT_TEST_IDS.SUBMIT_BUTTON);

  return { ...wrapper, user, getSubmitButton };
};

describe('CreditCardFormLayout', () => {
  it('should render form correctly without error alert and total to be charged text', () => {
    const { getSubmitButton } = setup();

    const container = screen.getByTestId(
      CREDIT_CARD_FORM_LAYOUT_TEST_IDS.CONTAINER
    );
    expect(container).toBeVisible();

    const title = screen.getByTestId(CREDIT_CARD_FORM_LAYOUT_TEST_IDS.TITLE);
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(defaultProps.title);

    const errorAlert = screen.queryByTestId(
      CREDIT_CARD_FORM_LAYOUT_TEST_IDS.ERROR_ALERT
    );
    expect(errorAlert).not.toBeInTheDocument();

    const totalToBeChargedText = screen.queryByTestId(
      CREDIT_CARD_FORM_LAYOUT_TEST_IDS.TOTAL_TO_BE_CHARGED_TEXT
    );
    expect(totalToBeChargedText).not.toBeInTheDocument();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();
  });

  it('should render form correctly with error alert', () => {
    const mockErrorMessage = 'Error!';
    setup({ errorMessage: mockErrorMessage });

    const errorAlert = screen.getByTestId(
      CREDIT_CARD_FORM_LAYOUT_TEST_IDS.ERROR_ALERT
    );
    expect(errorAlert).toBeVisible();
    expect(errorAlert).toHaveTextContent(mockErrorMessage);
  });

  it('should render form correctly with total to be charged text', () => {
    const mockTotalToBeChargedText = '275.00';
    setup({ totalToBeChargedText: mockTotalToBeChargedText });

    const totalToBeChargedText = screen.getByTestId(
      CREDIT_CARD_FORM_LAYOUT_TEST_IDS.TOTAL_TO_BE_CHARGED_TEXT
    );
    expect(totalToBeChargedText).toBeVisible();
    expect(totalToBeChargedText).toHaveTextContent(
      `$${mockTotalToBeChargedText}`
    );
  });

  it('should render form correctly with disabled loading button if isLoading and isSubmitButtonDisabled are truthy', () => {
    const { getSubmitButton } = setup({
      isSubmitButtonDisabled: true,
      isLoading: true,
    });

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should call onSubmit on submit button click', async () => {
    const { user, getSubmitButton } = setup();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toBeCalled();
    });
  });
});
