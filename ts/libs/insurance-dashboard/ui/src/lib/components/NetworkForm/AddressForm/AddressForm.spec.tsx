import { render, screen, within, waitFor } from '../../../../testUtils';
import { NETWORK_FORM_TEST_IDS } from '../testIds';
import AddressForm, { AddressFormProps } from './AddressForm';

const mockedProps: Required<AddressFormProps> = {
  address: {
    city: 'city',
    stateName: 'Pennsylvania',
    zipCode: '1231',
    addressLineOne: 'streetAddress',
  },
  addressIndex: 0,
  states: [
    { id: '1', name: 'Pennsylvania' },
    { id: '2', name: 'Colorado' },
  ],
  addressTitle: 'claims address',
  onChangeNetworkAddressFormField: vi.fn(),
  onRemoveAddress: vi.fn(),
  isDisabled: false,
};

const getAddressFormTitle = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getAddressFormTitleTestId(addressIndex)
  );
const getStreetAddressInput = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getStreetAddressInputTestId(addressIndex)
  );
const getCityAddressInput = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getCityAddressInputTestId(addressIndex)
  );
const getZipAddressInput = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getZipAddressInputTestId(addressIndex)
  );

const getStateAddressSelect = (addressIndex: number) =>
  within(
    screen.getByTestId(
      NETWORK_FORM_TEST_IDS.getStateAddressSelectTestId(addressIndex)
    )
  ).getByRole('button');
const findStateAddressSelectOption = async (
  optionId: string,
  addressIndex: number
) => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findByTestId(
    NETWORK_FORM_TEST_IDS.getStateAddressSelectOptionTestId(
      optionId,
      addressIndex
    )
  );
};

const setup = (overrideProps: Partial<AddressFormProps> = {}) => {
  return render(<AddressForm {...mockedProps} {...overrideProps} />);
};

describe('<AddressForm />', () => {
  it('should render properly', async () => {
    const { user } = setup();

    const addressFormTitle = getAddressFormTitle(mockedProps.addressIndex);
    expect(addressFormTitle).toHaveTextContent(mockedProps.addressTitle);

    const streetAddressInput = getStreetAddressInput(mockedProps.addressIndex);
    const cityAddressInput = getCityAddressInput(mockedProps.addressIndex);
    const zipAddressInput = getZipAddressInput(mockedProps.addressIndex);

    expect(streetAddressInput).toHaveValue(mockedProps.address.addressLineOne);
    expect(cityAddressInput).toHaveValue(mockedProps.address.city);
    expect(zipAddressInput).toHaveValue(mockedProps.address.zipCode);

    const stateAddressSelect = getStateAddressSelect(mockedProps.addressIndex);

    await user.click(stateAddressSelect);

    for (let i = 0; i < mockedProps.states.length; i++) {
      const option = mockedProps.states[i];
      const stateOption = await findStateAddressSelectOption(
        option.id,
        mockedProps.addressIndex
      );
      expect(stateOption).toBeVisible();
      expect(stateOption).toHaveAttribute(
        'data-value',
        String(mockedProps.states[i].name)
      );
    }
  });

  it('should update form input fields value', async () => {
    const { user } = setup();

    const streetAddressInput = getStreetAddressInput(mockedProps.addressIndex);
    const cityAddressInput = getCityAddressInput(mockedProps.addressIndex);
    const zipAddressInput = getZipAddressInput(mockedProps.addressIndex);

    await user.type(streetAddressInput, '1');
    expect(mockedProps.onChangeNetworkAddressFormField).toHaveBeenCalled();
    await user.type(cityAddressInput, '1');
    expect(mockedProps.onChangeNetworkAddressFormField).toHaveBeenCalled();
    await user.type(zipAddressInput, '1');
    expect(mockedProps.onChangeNetworkAddressFormField).toHaveBeenCalled();
  });

  it('should update form state select field value', async () => {
    const { user } = setup();

    const statesSelect = getStateAddressSelect(mockedProps.addressIndex);

    await user.click(statesSelect);
    const statesSelectOption = await findStateAddressSelectOption(
      mockedProps.states[0].id,
      mockedProps.addressIndex
    );
    await user.click(statesSelectOption);
    await waitFor(() =>
      expect(mockedProps.onChangeNetworkAddressFormField).toHaveBeenCalled()
    );
  });

  it('should render properly for disabled state', async () => {
    setup({ isDisabled: true });

    const streetAddressInput = getStreetAddressInput(mockedProps.addressIndex);
    const cityAddressInput = getCityAddressInput(mockedProps.addressIndex);
    const zipAddressInput = getZipAddressInput(mockedProps.addressIndex);
    const stateAddressSelect = getStateAddressSelect(mockedProps.addressIndex);

    expect(streetAddressInput).toHaveValue(mockedProps.address.addressLineOne);
    expect(streetAddressInput).toBeVisible();
    expect(streetAddressInput).toBeDisabled();

    expect(cityAddressInput).toHaveValue(mockedProps.address.city);
    expect(cityAddressInput).toBeVisible();
    expect(cityAddressInput).toBeDisabled();

    expect(zipAddressInput).toHaveValue(mockedProps.address.zipCode);
    expect(zipAddressInput).toBeVisible();
    expect(zipAddressInput).toBeDisabled();

    expect(stateAddressSelect).toBeVisible();
    expect(stateAddressSelect).toHaveAttribute('aria-disabled', 'true');
  });
});
