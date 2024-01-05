import { screen, waitFor } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  ExternalCareProvider,
  ExternalCareProviderFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import DeleteExternalCareProviderDialog, {
  SUBMIT_BUTTON_TEST_ID,
} from '../DeleteExternalCareProviderDialog';

const mockedECP = ExternalCareProviderFromJSON(JSONMocks.externalCareProvider);

describe('DeleteExternalCareProviderDialog', () => {
  const setup = (externalCareProvider: ExternalCareProvider) => {
    const onCloseMock = vi.fn();
    renderWithClient(
      <DeleteExternalCareProviderDialog
        externalCareProvider={externalCareProvider}
        open
        onClose={onCloseMock}
      />
    );

    return { onCloseMock };
  };

  it('triggers the delete action and closes the dialog', async () => {
    const { onCloseMock } = setup(mockedECP);

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });
});
