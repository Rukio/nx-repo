import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import RejectServiceRequestDialog, {
  SUBMIT_BUTTON_TEST_ID,
} from '../RejectServiceRequestDialog';

describe('RejectServiceRequestDialog', () => {
  const setup = () => {
    const onCloseMock = vi.fn();
    renderWithClient(
      <RejectServiceRequestDialog
        serviceRequestId="2"
        open
        onClose={onCloseMock}
      />
    );

    return { onCloseMock };
  };

  it('submit button should be disabled by default', async () => {
    setup();

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();
  });

  it('triggers the reject action and closes the dialog', async () => {
    const { onCloseMock } = setup();

    const insuranceCheckbox = await screen.findByTestId('insurance-checkbox');
    await userEvent.click(insuranceCheckbox);

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('submit button should be disabled if text field is empty', async () => {
    setup();

    const insuranceCheckbox = await screen.findByTestId('insurance-checkbox');
    await userEvent.click(insuranceCheckbox);

    const clinicalCheckbox = await screen.findByTestId('clinical-checkbox');
    await userEvent.click(clinicalCheckbox);

    const otherCheckbox = await screen.findByTestId('other-checkbox');
    await userEvent.click(otherCheckbox);

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();
  });

  it('submit form should be called when all checkbox and text field is filled', async () => {
    const user = userEvent.setup();

    const { onCloseMock } = setup();

    const insuranceCheckbox = await screen.findByTestId('insurance-checkbox');
    await user.click(insuranceCheckbox);

    const clinicalCheckbox = await screen.findByTestId('clinical-checkbox');
    await user.click(clinicalCheckbox);

    const otherCheckbox = await screen.findByTestId('other-checkbox');
    await user.click(otherCheckbox);

    const otherTextField = await screen.findByTestId(
      'other-reject-reason-text-field'
    );
    await user.type(otherTextField, 'xxx');

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });
});
