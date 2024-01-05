import { render, screen } from '../../../testUtils';
import SavedAddresses, { SavedAddressesProps } from './SavedAddresses';
import { SAVED_ADDRESSES_TEST_IDS } from './testIds';
import { ADDRESS_TEST_IDS } from '../Address';
import { FORMATTED_LIST_TEST_IDS } from '../FormattedList';
import { ADDRESSES_MOCKS } from './mocks';

const defaultProps: SavedAddressesProps = {
  addresses: ADDRESSES_MOCKS,
  onAddAddress: vi.fn(),
  onEditAddress: vi.fn(),
};

const setup = (props?: Partial<SavedAddressesProps>) =>
  render(<SavedAddresses {...defaultProps} {...props} />);

describe('<SavedAddresses />', () => {
  it('should render correctly', () => {
    setup();

    ADDRESSES_MOCKS.forEach((address) => {
      expect(
        screen.getByTestId(
          ADDRESS_TEST_IDS.getAddressContainerTestId(address.id)
        )
      ).toBeVisible();
    });

    const addAddressButton = screen.getByTestId(
      SAVED_ADDRESSES_TEST_IDS.ADD_ADDRESS_BUTTON
    );

    expect(addAddressButton).toBeVisible();
    expect(addAddressButton).toHaveTextContent('Add Address');
  });

  it('should call onEditAddress when press edit button', async () => {
    const { user } = setup();

    const editButton = screen.getByTestId(
      FORMATTED_LIST_TEST_IDS.getListItemButtonTestId(
        SAVED_ADDRESSES_TEST_IDS.getListItemPrefix(ADDRESSES_MOCKS[0].id)
      )
    );

    await user.click(editButton);

    expect(defaultProps.onEditAddress).toBeCalledWith(ADDRESSES_MOCKS[0].id);
  });

  it('should call onAddAddress when press add button', async () => {
    const { user } = setup();

    const addButton = screen.getByTestId(
      SAVED_ADDRESSES_TEST_IDS.ADD_ADDRESS_BUTTON
    );

    await user.click(addButton);

    expect(defaultProps.onAddAddress).toHaveBeenCalledTimes(1);
  });
});
