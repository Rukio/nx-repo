import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  ExternalCareProvider,
  ExternalCareProviderFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import ExternalCareProviderFormModal, {
  PROVIDER_TYPE_SELECT_CONTAINER_TEST_ID,
  SUBMIT_BUTTON_TEST_ID,
} from '../ExternalCareProviderFormModal';

const mockedExternalCareProvider = ExternalCareProviderFromJSON(
  JSONMocks.externalCareProvider
);

describe('ExternalCareProviderFormModal', () => {
  const setup = (options: {
    externalCareProvider?: ExternalCareProvider;
    patientId?: string;
  }) => {
    const onCloseMock = vi.fn();
    renderWithClient(
      <ExternalCareProviderFormModal
        patientId={options.patientId}
        externalCareProvider={options.externalCareProvider}
        open
        onClose={onCloseMock}
      />
    );

    return { onCloseMock };
  };

  it('submits the create form', async () => {
    const { onCloseMock } = setup({ patientId: 'mockedId' });

    const dropdown = await screen.findByTestId(
      PROVIDER_TYPE_SELECT_CONTAINER_TEST_ID
    );
    const button = within(dropdown).getByRole('button');
    fireEvent.mouseDown(button);
    const listbox = screen.getByRole('listbox');
    const option = await within(listbox).findByText('Other');
    fireEvent.click(option);

    const nameInput = await screen.findByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'abc' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('fails if the required fields on the create form are empty', async () => {
    const { onCloseMock } = setup({ patientId: 'mockedId' });

    const addressInput = await screen.findByTestId('address-input');
    fireEvent.change(addressInput, { target: { value: 'abc' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).not.toHaveBeenCalled());
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Provider Type is required')).toBeInTheDocument();
  });

  it('submits the edit form', async () => {
    const { onCloseMock } = setup({
      externalCareProvider: mockedExternalCareProvider,
    });

    const middleNameInput = await screen.findByTestId('name-input');
    fireEvent.change(middleNameInput, { target: { value: 'abc' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });

  it('fails if the required fields on the edit form are empty', async () => {
    const { onCloseMock } = setup({ patientId: 'mockedId' });

    const phoneNumberInput = await screen.findByTestId('phonenumber-input');
    fireEvent.change(phoneNumberInput, { target: { value: 'abc' } });

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).not.toHaveBeenCalled());
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Provider Type is required')).toBeInTheDocument();
  });
});
