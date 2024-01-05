import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Insurance,
  InsuranceFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import InsuranceFormModal, {
  SUBMIT_BUTTON_TEST_ID,
} from '../InsuranceFormModal';

const mockedInsurance = InsuranceFromJSON(JSONMocks.insurance);

describe('InsuranceFormModal', () => {
  const setup = (options: { insurance?: Insurance; patientId?: string }) => {
    const onCloseMock = vi.fn();
    renderWithClient(
      <InsuranceFormModal
        patientId={options.patientId}
        insurance={options.insurance}
        priorityLabel="Primary"
        open
        onClose={onCloseMock}
      />
    );

    return { onCloseMock };
  };

  it('submits the create form', async () => {
    const { onCloseMock } = setup({ patientId: 'mockedId' });

    const insuranceNameInput = await screen.findByTestId('name-input');
    fireEvent.change(insuranceNameInput, { target: { value: 'abc' } });

    const memberIdInput = await screen.findByTestId('memberid-input');
    fireEvent.change(memberIdInput, { target: { value: '123' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('fails if the required fields on the create form are empty', async () => {
    const { onCloseMock } = setup({ patientId: 'mockedId' });

    const insuranceNameInput = await screen.findByTestId('name-input');
    fireEvent.change(insuranceNameInput, { target: { value: 'abc' } });

    const memberIdInput = await screen.findByTestId('memberid-input');
    fireEvent.change(memberIdInput, { target: { value: null } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).not.toHaveBeenCalled());
    expect(screen.getByText('Member ID is required')).toBeInTheDocument();
  });

  it('submits the edit form', async () => {
    const { onCloseMock } = setup({ insurance: mockedInsurance });

    const insuranceNameInput = await screen.findByTestId('name-input');
    fireEvent.change(insuranceNameInput, { target: { value: 'abc' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('submit button is disabled if the required fields on the edit form are empty', async () => {
    const { onCloseMock } = setup({ patientId: 'mockedId' });

    const insuranceNameInput = await screen.findByTestId('name-input');
    fireEvent.change(insuranceNameInput, { target: { value: '' } });
    const memberIdInput = await screen.findByTestId('memberid-input');
    fireEvent.change(memberIdInput, { target: { value: '' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();
    submitButton.click();

    await waitFor(() => expect(onCloseMock).not.toHaveBeenCalled());
  });
});
