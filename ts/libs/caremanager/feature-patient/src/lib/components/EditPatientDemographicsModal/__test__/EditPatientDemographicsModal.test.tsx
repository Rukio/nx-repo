import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import EditPatientDemographicsModal, {
  SUBMIT_BUTTON_TEST_ID,
} from '../EditPatientDemographicsModal';

describe('EditPatientDemographicsModal', () => {
  const setup = () => {
    const onCloseMock = vi.fn();
    renderWithClient(
      <EditPatientDemographicsModal patientId="1" open onClose={onCloseMock} />
    );

    return { onCloseMock };
  };

  it('submits the form', async () => {
    const { onCloseMock } = setup();

    const middleNameInput = await screen.findByTestId('middlename-input');
    fireEvent.change(middleNameInput, { target: { value: 'abc' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('validation fails if required fields are empty', async () => {
    const { onCloseMock } = setup();

    const firstNameInput = await screen.findByTestId('firstname-input');
    fireEvent.change(firstNameInput, { target: { value: '' } });
    const lastNameInput = await screen.findByTestId('lastname-input');
    fireEvent.change(lastNameInput, { target: { value: '' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).not.toHaveBeenCalled());
    expect(screen.getByText('First Name is required')).toBeInTheDocument();
    expect(screen.getByText('Last Name is required')).toBeInTheDocument();
  });
});
