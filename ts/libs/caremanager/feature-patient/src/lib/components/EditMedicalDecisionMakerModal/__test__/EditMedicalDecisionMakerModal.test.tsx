import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import EditMedicalDecisionMakerModal, {
  testIds,
} from '../EditMedicalDecisionMakerModal';
import { server } from '../../../../test/mockServer';

const setup = () => {
  const onCloseMock = vi.fn();

  renderWithClient(
    <EditMedicalDecisionMakerModal
      onClose={onCloseMock}
      open
      patientId={JSONMocks.medicalDecisionMaker.patient_id}
    />
  );

  return { onCloseMock };
};

describe('<EditMedicalDecisionMakerModal />', () => {
  it('renders', async () => {
    setup();

    expect(
      await screen.findByText('Medical Decision Maker')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(testIds.CANCEL_BUTTON)
    ).toBeInTheDocument();
    expect(await screen.findByTestId(testIds.SAVE_BUTTON)).toBeInTheDocument();
  });

  it('creates a MedicalDecisionMaker', async () => {
    server.use(
      rest.get('/v1/patients/:patientId', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            patient: JSONMocks.patients.patients[0],
            medical_decision_makers: [],
          })
        )
      )
    );

    const { onCloseMock } = setup();

    fireEvent.change(await screen.findByTestId('firstname-input'), {
      target: { value: 'John' },
    });
    fireEvent.change(await screen.findByTestId('lastname-input'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(await screen.findByTestId('address-input'), {
      target: { value: 'Acacia 43' },
    });
    fireEvent.change(await screen.findByTestId('phonenumber-input'), {
      target: { value: '+523323844908' },
    });
    fireEvent.change(await screen.findByTestId('relationship-input'), {
      target: { value: 'Parent' },
    });

    const submitButton = await screen.findByTestId(testIds.SAVE_BUTTON);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('edits an existing MedicalDecisionMaker', async () => {
    server.use(
      rest.get('/v1/patients/:patientId', (_, res, ctx) =>
        res.once(
          ctx.status(200),
          ctx.json({
            patient: JSONMocks.patients.patients[0],
            medical_decision_makers: [JSONMocks.medicalDecisionMaker],
          })
        )
      )
    );

    const { onCloseMock } = setup();

    expect(
      await screen.findByDisplayValue(JSONMocks.medicalDecisionMaker.first_name)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(JSONMocks.medicalDecisionMaker.last_name)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(
        JSONMocks.medicalDecisionMaker.phone_number
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(JSONMocks.medicalDecisionMaker.address)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(
        JSONMocks.medicalDecisionMaker.relationship
      )
    ).toBeInTheDocument();

    fireEvent.change(await screen.findByTestId('firstname-input'), {
      target: { value: 'Jane' },
    });

    const submitButton = await screen.findByTestId(testIds.SAVE_BUTTON);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });
});
