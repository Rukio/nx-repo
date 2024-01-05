import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModalityControls, { ModalityControlsProps } from './ModalityControls';
import { MODALITY_CONTROLS_TEST_IDS } from './testIds';

const props: ModalityControlsProps = {
  onCancel: jest.fn(),
  onSave: jest.fn(),
  isLoading: false,
};

const setup = (overrideProps?: Partial<ModalityControlsProps>) => {
  const getSubmitButton = () =>
    screen.getByTestId(MODALITY_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
  const getCancelButton = () =>
    screen.getByTestId(MODALITY_CONTROLS_TEST_IDS.CANCEL_BUTTON);

  return {
    ...render(<ModalityControls {...{ ...props, ...overrideProps }} />),
    user: userEvent.setup(),
    getSubmitButton,
    getCancelButton,
  };
};

describe('<ModalityControls />', () => {
  it('should render modality controls', () => {
    const { getSubmitButton, getCancelButton } = setup();

    const submitButton = getSubmitButton();
    const cancelButton = getCancelButton();

    expect(submitButton).toBeVisible();
    expect(cancelButton).toBeVisible();
  });

  it('should call action functions', async () => {
    const { user, getSubmitButton, getCancelButton } = setup();

    const submitButton = getSubmitButton();
    const cancelButton = getCancelButton();

    await user.click(submitButton);
    expect(props.onSave).toBeCalledTimes(1);

    await user.click(cancelButton);
    expect(props.onCancel).toBeCalledTimes(1);
  });

  it('should update buttons status when loading', () => {
    const { getSubmitButton, getCancelButton } = setup({ isLoading: true });

    const submitButton = getSubmitButton();
    const cancelButton = getCancelButton();

    expect(submitButton).toHaveProperty('disabled', true);
    expect(cancelButton).toHaveProperty('disabled', true);
  });
});
