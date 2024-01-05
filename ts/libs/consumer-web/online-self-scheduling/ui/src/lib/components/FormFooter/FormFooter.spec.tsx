import { render, screen } from '../../../testUtils';
import FormFooter, { FormFooterProps } from './FormFooter';
import { FORM_FOOTER_TEST_IDS } from './testIds';

const defaultProps: FormFooterProps & { submitButtonLabel: string } = {
  submitButtonLabel: 'Continue',
  onSubmit: jest.fn(),
};

const setup = (props: Partial<FormFooterProps> = {}) => {
  const { user, ...wrapper } = render(
    <FormFooter {...defaultProps} {...props} />
  );

  const getFooterContainer = () =>
    screen.getByTestId(FORM_FOOTER_TEST_IDS.CONTAINER);
  const getFooterButton = () =>
    screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);
  const getFooterHelperText = () =>
    screen.getByTestId(FORM_FOOTER_TEST_IDS.HELPER_TEXT);

  return {
    user,
    ...wrapper,
    getFooterContainer,
    getFooterButton,
    getFooterHelperText,
  };
};

describe('Footer', () => {
  it('should render Footer with button only', () => {
    const { getFooterContainer, getFooterButton } = setup();

    const container = getFooterContainer();
    expect(container).toBeVisible();

    const button = getFooterButton();
    expect(button).toBeVisible();
    expect(button).toHaveTextContent(defaultProps.submitButtonLabel as string);
  });

  it('should render Footer with button and helper text', () => {
    const helperTextLabel = 'helper text';
    const { getFooterContainer, getFooterButton, getFooterHelperText } = setup({
      helperText: helperTextLabel,
    });

    const container = getFooterContainer();
    expect(container).toBeVisible();

    const button = getFooterButton();
    expect(button).toBeVisible();
    expect(button).toHaveTextContent(defaultProps.submitButtonLabel);

    const helperText = getFooterHelperText();
    expect(helperText).toBeVisible();
    expect(helperText).toHaveTextContent(helperTextLabel);
  });

  it('should render Footer with loading and disabled button', () => {
    const { getFooterButton } = setup({
      isSubmitButtonLoading: true,
      isSubmitButtonDisabled: true,
    });

    const button = getFooterButton();
    expect(button).toBeVisible();
    expect(button).toHaveTextContent(defaultProps.submitButtonLabel);
    expect(button).toBeDisabled();
  });

  it('should call onSubmit once submit button clicked', async () => {
    const { getFooterContainer, getFooterButton, user } = setup();

    const container = getFooterContainer();
    expect(container).toBeVisible();

    const button = getFooterButton();
    expect(button).toBeVisible();
    expect(button).toHaveTextContent(defaultProps.submitButtonLabel);

    await user.click(button);

    expect(defaultProps.onSubmit).toBeCalled();
  });
});
