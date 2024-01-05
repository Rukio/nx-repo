import { render, screen } from '../../../testUtils';
import { AddressObject } from '../../types';
import Address, { AddressProps } from './Address';
import { ADDRESS_TEST_IDS } from './testIds';

const ADDRESS_MOCK: Omit<AddressObject, 'locationDetails'> = {
  id: '123',
  streetAddress1: '100 Elm ST',
  streetAddress2: '#203',
  city: 'Denver',
  state: 'CO',
  zipCode: '80205',
};

const defaultProps: AddressProps = {
  ...ADDRESS_MOCK,
};

const setup = (props?: Partial<AddressObject>) =>
  render(<Address {...defaultProps} {...props} />);

describe('<Address />', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(
        ADDRESS_TEST_IDS.getAddressContainerTestId(ADDRESS_MOCK.id)
      )
    ).toBeVisible();

    const streetLine = screen.getByTestId(
      ADDRESS_TEST_IDS.getAddressStreetLineTestId(ADDRESS_MOCK.id)
    );

    expect(streetLine).toBeVisible();
    expect(streetLine).toHaveTextContent(ADDRESS_MOCK.streetAddress1);

    const secondLine = screen.getByTestId(
      ADDRESS_TEST_IDS.getAddressStreetAddress2LineTestId(ADDRESS_MOCK.id)
    );

    expect(secondLine).toBeVisible();
    expect(secondLine).toHaveTextContent(`${ADDRESS_MOCK.streetAddress2}`);

    const thirdLine = screen.getByTestId(
      ADDRESS_TEST_IDS.getAddressCityStateZipLineTestId(ADDRESS_MOCK.id)
    );

    expect(thirdLine).toBeVisible();
    expect(thirdLine).toHaveTextContent(
      `${ADDRESS_MOCK.city}, ${ADDRESS_MOCK.state} ${ADDRESS_MOCK.zipCode}`
    );
  });

  it('should render correctly with optional fields', () => {
    setup({ streetAddress2: undefined });

    const secondLine = screen.queryByTestId(
      ADDRESS_TEST_IDS.getAddressStreetAddress2LineTestId(ADDRESS_MOCK.id)
    );

    expect(secondLine).not.toBeInTheDocument();
  });
});
