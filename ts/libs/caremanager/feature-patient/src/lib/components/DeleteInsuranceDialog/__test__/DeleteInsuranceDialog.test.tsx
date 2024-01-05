import { screen, waitFor } from '@testing-library/react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  Insurance,
  InsuranceFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import DeleteInsuranceDialog, {
  SUBMIT_BUTTON_TEST_ID,
} from '../DeleteInsuranceDialog';

const mockedInsurance = InsuranceFromJSON(JSONMocks.insurance);

describe('DeleteInsuranceDialog', () => {
  const setup = (insurance: Insurance) => {
    const onCloseMock = vi.fn();
    renderWithClient(
      <DeleteInsuranceDialog insurance={insurance} open onClose={onCloseMock} />
    );

    return { onCloseMock };
  };

  it('triggers the delete action and closes the dialog', async () => {
    const { onCloseMock } = setup(mockedInsurance);

    const submitButton = await screen.findByTestId(SUBMIT_BUTTON_TEST_ID);
    submitButton.click();

    await waitFor(() => expect(onCloseMock).toHaveBeenCalled());
  });
});
