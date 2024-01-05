import { render, screen } from '../../../testUtils';
import SavedAddresses from './SavedAddresses';
import { ADDRESSES_MOCKS, TEST_IDS } from '@*company-data-covered*/patient-portal/ui';
import { SAVED_ADDRESSES_TEST_IDS } from './testIds';
import { EDIT_ADDRESS_MODAL_TEST_IDS } from '../EditAddressModal';

const setup = () => render(<SavedAddresses />);

const consoleSpy = vi.spyOn(console, 'info');

describe('<SavedAddresses />', () => {
  it('should render correctly', () => {
    setup();

    const sectionTitle = screen.getByTestId(
      TEST_IDS.PAGE_SECTION.getPageSectionTitleTestId(
        SAVED_ADDRESSES_TEST_IDS.TITLE
      )
    );

    expect(sectionTitle).toBeVisible();
    expect(sectionTitle).toHaveTextContent('Saved Addresses');
  });

  it('should call onEditAddress when press edit button', async () => {
    const { user } = setup();

    const editButton = screen.getByTestId(
      TEST_IDS.FORMATTED_LIST.getListItemButtonTestId(
        TEST_IDS.SAVED_ADDRESSES.getListItemPrefix(ADDRESSES_MOCKS[0].id)
      )
    );

    await user.click(editButton);

    const editModal = screen.getByTestId(
      TEST_IDS.RESPONSIVE_MODAL.getResponsiveModalTitleTestId(
        EDIT_ADDRESS_MODAL_TEST_IDS.MODAL
      )
    );

    expect(editModal).toBeVisible();

    expect(editModal).toHaveTextContent('Edit Address');
  });

  it('should call onAddAddress when press add button', async () => {
    const { user } = setup();

    const addButton = screen.getByTestId(
      TEST_IDS.SAVED_ADDRESSES.ADD_ADDRESS_BUTTON
    );

    await user.click(addButton);

    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    expect(consoleSpy).toBeCalledWith('onAddAddress');
  });
});
