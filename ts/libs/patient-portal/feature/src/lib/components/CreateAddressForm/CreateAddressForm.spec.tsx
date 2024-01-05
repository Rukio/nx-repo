import { AddressPayload, TEST_IDS } from '@*company-data-covered*/patient-portal/ui';
import { render, screen, within } from '../../../testUtils';
import CreateAddressForm from './CreateAddressForm';
import { CREATE_ADDRESS_FORM_TEST_IDS } from './testIds';

const getAddressFormStreetAddress1Input = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getStreetAddress1InputTestId(
      TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX
    )
  );

const getAddressFormStreetAddress2Input = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getStreetAddress2InputTestId(
      TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX
    )
  );

const getAddressFormLocationDetailsInput = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getLocationDetailsInputTestId(
      TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX
    )
  );

const getAddressFormCityInput = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getCityInputTestId(
      TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX
    )
  );

const getAddressFormStateInput = () => {
  const stateFormControl = screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getStateFormControlTestId(
      TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX
    )
  );

  expect(stateFormControl).toBeVisible();

  return within(stateFormControl).getByRole('button', {
    ...screen.getByTestId(
      TEST_IDS.ADDRESS_FORM.getStateTestId(
        TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX
      )
    ),
    expanded: false,
  });
};

const getAddressFormStateOption = (state: string) =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getAddressFormStateOptionTestId(
      TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX,
      state
    )
  );

const getAddressFormZipInput = () =>
  screen.getByTestId(
    TEST_IDS.ADDRESS_FORM.getZipCodeInputTestId(
      TEST_IDS.CREATE_ADDRESS_FORM.CREATE_FORM_PREFIX
    )
  );

const getAddressFormSubmitButtonInput = () =>
  screen.getByTestId(TEST_IDS.CREATE_ADDRESS_FORM.SUBMIT_BUTTON);

const setup = () => render(<CreateAddressForm />, { withRouter: true });

describe('<CreateAddressForm />', () => {
  it('should have default empty values', () => {
    setup();

    const formTitle = screen.getByTestId(
      TEST_IDS.PAGE_SECTION.getPageSectionTitleTestId(
        CREATE_ADDRESS_FORM_TEST_IDS.TITLE
      )
    );

    expect(formTitle).toBeVisible();
    expect(formTitle).toHaveTextContent('Add Address');

    const streetAddress1Input = getAddressFormStreetAddress1Input();
    const streetAddress2Input = getAddressFormStreetAddress2Input();
    const locationDetailsInput = getAddressFormLocationDetailsInput();
    const cityInput = getAddressFormCityInput();
    const stateInput = getAddressFormStateInput();
    const zipInput = getAddressFormZipInput();

    expect(streetAddress1Input).toHaveValue('');
    expect(streetAddress1Input).toHaveAttribute('placeholder', 'Address');
    expect(streetAddress2Input).toHaveValue('');
    expect(streetAddress2Input).toHaveAttribute('placeholder', 'Unit Number');
    expect(locationDetailsInput).toHaveValue('');
    expect(locationDetailsInput).toHaveAttribute(
      'placeholder',
      'Location Details'
    );
    expect(cityInput).toHaveValue('');
    expect(cityInput).toHaveAttribute('placeholder', 'City');
    expect(stateInput).toHaveTextContent('State');
    expect(zipInput).toHaveTextContent('');
    expect(zipInput).toHaveAttribute('placeholder', 'ZIP Code');
  });

  it('should enable submit button when all required fields is filled', async () => {
    const { user } = setup();

    const fakeFormData: Required<AddressPayload> = {
      streetAddress1: 'Street Address 1',
      streetAddress2: 'Street Address 2',
      locationDetails: 'Near the park',
      city: 'Denver',
      zipCode: '80532',
      state: 'AL',
    };

    const streetAddress1Input = getAddressFormStreetAddress1Input();
    const streetAddress2Input = getAddressFormStreetAddress2Input();
    const locationDetailsInput = getAddressFormLocationDetailsInput();
    const cityInput = getAddressFormCityInput();
    const stateInput = getAddressFormStateInput();
    const zipInput = getAddressFormZipInput();

    const submitButton = getAddressFormSubmitButtonInput();

    expect(submitButton).toBeDisabled();

    await user.type(streetAddress1Input, fakeFormData.streetAddress1);

    await user.type(streetAddress2Input, fakeFormData.streetAddress2);

    await user.type(locationDetailsInput, fakeFormData.locationDetails);

    await user.type(cityInput, fakeFormData.city);

    expect(submitButton).toBeDisabled();

    await user.click(stateInput);

    const alabamaStateOption = getAddressFormStateOption(fakeFormData.state);

    await user.click(alabamaStateOption);

    await user.type(zipInput, fakeFormData.zipCode.toString());

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
  });
});
