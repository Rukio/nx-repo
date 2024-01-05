import { render, screen, waitFor, within } from '../../../testUtils';
import InputField, { InputFieldProps } from './InputField';

const defaultProps = {
  label: 'Input field',
  onFocus: jest.fn(),
  onBlur: jest.fn(),
  onChange: jest.fn(),
  'data-testid': 'input-field',
};

const getInputField = () => screen.getByTestId(defaultProps['data-testid']);

const setup = (overrideProps: Partial<InputFieldProps> = {}) => {
  const { user, ...wrapper } = render(
    <InputField {...defaultProps} {...overrideProps} />
  );

  const clickInput = (inputField: HTMLElement) =>
    user.click(within(inputField).getByRole('textbox'));

  return {
    ...wrapper,
    user,
    clickInput,
  };
};

describe('<InputField />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InputField should call onFocus when focused', async () => {
    const { clickInput } = setup();

    const inputField = getInputField();
    expect(inputField).toBeVisible();

    await clickInput(inputField);

    await waitFor(() => {
      expect(defaultProps.onFocus).toBeCalled();
    });
  });

  it('InputField should call onBlur when blurred', async () => {
    const { clickInput, user } = setup();

    const inputField = getInputField();
    expect(inputField).toBeVisible();

    await clickInput(inputField);

    await user.tab();

    await waitFor(() => {
      expect(defaultProps.onBlur).toBeCalled();
    });
  });

  it('InputField should not call onFocus when focused but no props passed', async () => {
    const { clickInput } = setup({ onFocus: undefined });

    const inputField = getInputField();
    expect(inputField).toBeVisible();

    await clickInput(inputField);

    await waitFor(() => {
      expect(defaultProps.onFocus).not.toBeCalled();
    });
  });

  it('InputField should not call onBlur when blurred but no props passed', async () => {
    const { clickInput, user } = setup({ onBlur: undefined });

    const inputField = getInputField();
    expect(inputField).toBeVisible();

    await clickInput(inputField);

    await user.tab();

    await waitFor(() => {
      expect(defaultProps.onBlur).not.toBeCalled();
    });
  });

  it('InputField should render helperText from errorMessage if there and error and input is not focused', async () => {
    const errorMessage = 'Error Message';
    setup({
      error: true,
      errorMessage,
    });

    const inputField = getInputField();
    expect(inputField).toBeVisible();
    expect(inputField).toHaveTextContent(errorMessage);
  });

  it('InputField should render helperText from helperText value if there and error and input is not focused', async () => {
    const helperText = 'Helper message';
    setup({
      error: true,
      helperText,
    });

    const inputField = getInputField();
    expect(inputField).toBeVisible();
    expect(inputField).toHaveTextContent(helperText);
  });

  it('InputField should render empty helperText if there are error and input is focused and without errorMessage', async () => {
    const helperText = 'Helper message';

    const { clickInput } = setup({ error: true, helperText });

    const inputField = getInputField();
    expect(inputField).toBeVisible();
    await clickInput(inputField);

    expect(inputField).not.toHaveTextContent(helperText);
  });
});
