import { render, screen } from '../../../testUtils';

import FormManageControls, {
  FormManageControlsProps,
} from './FormManageControls';
import { FORM_CONTROLS_TEST_IDS } from './testIds';

const mockedProps: FormManageControlsProps = {
  onCancel: vi.fn(),
  onSubmit: vi.fn(),
  disabled: false,
  isLoading: false,
};

const getCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const getSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);

const setup = (overrideProps: Partial<FormManageControlsProps> = {}) => {
  return {
    ...render(<FormManageControls {...mockedProps} {...overrideProps} />),
  };
};

describe('<FormManageControls />', () => {
  it('should render properly', () => {
    setup();

    const cancelButton = getCancelButton();
    const submitButton = getSubmitButton();

    expect(cancelButton).toBeVisible();
    expect(cancelButton).not.toBeDisabled();
    expect(submitButton).toBeVisible();
    expect(submitButton).not.toBeDisabled();
  });

  it('should render disabled buttons', () => {
    setup({ disabled: true });

    const cancelButton = getCancelButton();
    const submitButton = getSubmitButton();

    expect(cancelButton).toBeVisible();
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should disable buttons when loading', () => {
    setup({ isLoading: true });

    const cancelButton = getCancelButton();
    const submitButton = getSubmitButton();

    expect(cancelButton).toBeVisible();
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeVisible();
    expect(submitButton).toBeDisabled();
  });

  it('should call buttons actions', async () => {
    const { user } = setup();

    const cancelButton = getCancelButton();
    const submitButton = getSubmitButton();

    await user.click(cancelButton);
    expect(mockedProps.onCancel).toBeCalledTimes(1);

    await user.click(submitButton);
    expect(mockedProps.onSubmit).toBeCalledTimes(1);
  });
});
