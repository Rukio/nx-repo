import {
  ADDRESSES_MOCKS,
  STATES,
  TEST_IDS,
} from '@*company-data-covered*/patient-portal/ui';
import { render, screen, within } from '../../../testUtils';
import EditAddressModal, { EditAddressModalProps } from './EditAddressModal';
import { EDIT_ADDRESS_MODAL_TEST_IDS } from './testIds';

const defaultProps: EditAddressModalProps = {
  open: true,
  onClose: vi.fn(),
  address: ADDRESSES_MOCKS[0],
};

const getAddressFormStreetAddress1Input = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getStreetAddress1InputTestId(
      TEST_IDS.EDIT_ADDRESS_FORM.EDIT_FORM_PREFIX
    )
  );

const getAddressFormStreetAddress2Input = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getStreetAddress2InputTestId(
      TEST_IDS.EDIT_ADDRESS_FORM.EDIT_FORM_PREFIX
    )
  );

const getAddressFormCityInput = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getCityInputTestId(
      TEST_IDS.EDIT_ADDRESS_FORM.EDIT_FORM_PREFIX
    )
  );

const getAddressFormStateInput = () => {
  const stateFormControl = screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getStateFormControlTestId(
      TEST_IDS.EDIT_ADDRESS_FORM.EDIT_FORM_PREFIX
    )
  );

  expect(stateFormControl).toBeVisible();

  return within(stateFormControl).getByRole('button', {
    ...screen.getByTestId(
      TEST_IDS.ADDRESS_FORM.getStateTestId(
        TEST_IDS.EDIT_ADDRESS_FORM.EDIT_FORM_PREFIX
      )
    ),
    expanded: false,
  });
};

const getAddressFormZipInput = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getZipCodeInputTestId(
      TEST_IDS.EDIT_ADDRESS_FORM.EDIT_FORM_PREFIX
    )
  );

const setup = () =>
  render(<EditAddressModal {...defaultProps} />, { withRouter: true });

describe('<EditAddressModal />', () => {
  it('should have default values', () => {
    setup();

    const modalTitle = screen.getByTestId(
      TEST_IDS.RESPONSIVE_MODAL.getResponsiveModalTitleTestId(
        EDIT_ADDRESS_MODAL_TEST_IDS.MODAL
      )
    );

    expect(modalTitle).toBeVisible();
    expect(modalTitle).toHaveTextContent('Edit Address');

    const streetAddress1Input = getAddressFormStreetAddress1Input();
    const streetAddress2Input = getAddressFormStreetAddress2Input();

    const cityInput = getAddressFormCityInput();
    const stateInput = getAddressFormStateInput();
    const zipInput = getAddressFormZipInput();

    expect(streetAddress1Input).toHaveValue(
      defaultProps.address.streetAddress1
    );
    expect(streetAddress2Input).toHaveValue(
      defaultProps.address.streetAddress2
    );

    const selectedState = STATES.find(
      (state) => state.abbreviation === defaultProps.address.state
    );

    expect(cityInput).toHaveValue(defaultProps.address.city);
    expect(stateInput).toHaveTextContent(selectedState?.name as string);
    expect(zipInput).toHaveValue(defaultProps.address.zipCode);
  });

  it('should call delete confirmation modal', async () => {
    const { user } = setup();

    const deleteButton = screen.getByTestId(
      TEST_IDS.EDIT_ADDRESS_FORM.DELETE_BUTTON
    );

    expect(deleteButton).toBeVisible();

    await user.click(deleteButton);

    const deleteConfirmationModal = screen.getByTestId(
      TEST_IDS.CONFIRMATION.getConfirmationContainerTestId(
        EDIT_ADDRESS_MODAL_TEST_IDS.DELETE_ADDRESS_CONFIRMATION
      )
    );

    expect(deleteConfirmationModal).toBeVisible();

    const modalTitle = screen.getByTestId(
      TEST_IDS.RESPONSIVE_MODAL.getResponsiveModalTitleTestId(
        EDIT_ADDRESS_MODAL_TEST_IDS.MODAL
      )
    );

    expect(modalTitle).toBeVisible();
    expect(modalTitle).toHaveTextContent('Delete this Address?');
  });
});
