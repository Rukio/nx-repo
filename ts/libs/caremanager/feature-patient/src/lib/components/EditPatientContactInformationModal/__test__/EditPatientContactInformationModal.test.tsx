import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import EditPatientContactInformationModal, {
  testIds,
} from '../EditPatientContactInformationModal';
import { server } from '../../../../test/mockServer';

const setup = () => {
  const onCloseMock = vi.fn();

  renderWithClient(
    <EditPatientContactInformationModal
      onClose={onCloseMock}
      open
      patientId="1"
    />
  );

  return { onCloseMock };
};

describe('<EditPatientContactInformationModal', () => {
  it('renders', async () => {
    setup();

    expect(
      await screen.findByText('Patient Contact Information')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(testIds.CANCEL_BUTTON)
    ).toBeInTheDocument();
    expect(await screen.findByTestId(testIds.SAVE_BUTTON)).toBeInTheDocument();
  });

  it('edits a Patient contact information', async () => {
    const mockPatient = {
      ...JSONMocks.patients.patients[0],
      address_street: 'Test Street 12',
      address_street_2: 'Suite 3',
      address_notes: 'Nice neighborhood',
    };

    server.use(
      rest.get('/v1/patients/:patientId', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            patient: mockPatient,
          })
        )
      )
    );

    const { onCloseMock } = setup();

    expect(
      await screen.findByDisplayValue(mockPatient.address_street)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockPatient.address_street_2)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockPatient.address_city)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockPatient.address_state)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockPatient.address_zipcode)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockPatient.phone_number)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockPatient.address_notes)
    ).toBeInTheDocument();

    fireEvent.change(await screen.findByTestId('addressstreet-input'), {
      target: { value: 'New Street 12' },
    });

    const submitButton = await screen.findByTestId(testIds.SAVE_BUTTON);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('disables save button if form has not been touched', async () => {
    const { onCloseMock } = setup();

    const submitButton = await screen.findByTestId(testIds.SAVE_BUTTON);
    submitButton.click();

    expect(onCloseMock).not.toHaveBeenCalled();
  });
});
