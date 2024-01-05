import { fireEvent, screen, waitFor } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Pharmacy,
  PharmacyFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import PharmacyFormModal, { SUBMIT_BUTTON_TEST_ID } from '../PharmacyFormModal';

const mockedPharmacy = {
  ...PharmacyFromJSON(JSONMocks.pharmacy),
  faxNumber: '+321123111',
};

describe('<PharmacyFormModal />', () => {
  const setup = (options: { pharmacy?: Pharmacy; patientId: string }) => {
    const onCloseMock = vi.fn();
    renderWithClient(
      <PharmacyFormModal
        patientId={options.patientId}
        pharmacy={options.pharmacy}
        open
        onClose={onCloseMock}
      />
    );

    return { onCloseMock };
  };

  it('submits the create form', async () => {
    const { onCloseMock } = setup({ patientId: '1' });

    const pharmacyName = await screen.findByTestId('name-input');
    fireEvent.change(pharmacyName, {
      target: { value: 'Farmacias Benavides' },
    });

    const phoneNumber = await screen.findByTestId('phonenumber-input');
    fireEvent.change(phoneNumber, {
      target: { value: '123-123-123' },
    });

    const address = await screen.findByTestId('address-input');
    fireEvent.change(address, {
      target: { value: 'p sherman wallaby 42 sidney' },
    });

    const faxNumber = await screen.findByTestId('faxnumber-input');
    fireEvent.change(faxNumber, {
      target: { value: '999-111-232-232' },
    });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('fails if the required fields on the create form are empty', async () => {
    const { onCloseMock } = setup({ patientId: '1' });

    const faxNumber = await screen.findByTestId('faxnumber-input');
    fireEvent.change(faxNumber, {
      target: { value: '999-111-232-232' },
    });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).not.toHaveBeenCalled());
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('submits the edit form', async () => {
    const { onCloseMock } = setup({
      pharmacy: mockedPharmacy,
      patientId: '1',
    });

    expect(
      await screen.findByDisplayValue(mockedPharmacy.name)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockedPharmacy.address as string)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockedPharmacy.faxNumber)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockedPharmacy.phoneNumber as string)
    ).toBeInTheDocument();

    const name = await screen.findByTestId('name-input');
    fireEvent.change(name, { target: { value: 'new name' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('fails if the required fields on the edit form are empty', async () => {
    const { onCloseMock } = setup({
      pharmacy: mockedPharmacy,
      patientId: '1',
    });

    expect(
      await screen.findByDisplayValue(mockedPharmacy.name)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockedPharmacy.address as string)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockedPharmacy.faxNumber)
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(mockedPharmacy.phoneNumber as string)
    ).toBeInTheDocument();

    const name = await screen.findByTestId('name-input');
    fireEvent.change(name, { target: { value: '' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).not.toHaveBeenCalled());
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});
