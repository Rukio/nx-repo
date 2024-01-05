import { useForm } from 'react-hook-form';
import {
  render,
  renderHook,
  screen,
  within,
  exactRegexMatch,
} from '../../../testUtils';
import { Alert } from '@*company-data-covered*/design-system';
import { FORM_SELECT_MENU_ITEM_TEST_IDS } from '@*company-data-covered*/shared/ui/forms';
import AddressForm, {
  AddressFormProps,
  AddressFormFieldValues,
} from './AddressForm';
import { ADDRESS_FORM_TEST_IDS } from './testIds';
import { FORM_HEADER_TEST_IDS } from '../FormHeader';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter';

const defaultAddressFormFieldValues: AddressFormFieldValues = {
  zipCode: '',
  streetAddress1: '',
  streetAddress2: '',
  city: '',
  state: '',
  locationType: '',
  locationDetails: '',
};

const defaultProps: Omit<AddressFormProps, 'formControl'> = {
  formHeaderTitle: 'Where should we send our team?',
  formHeaderSubtitle:
    'Enter your ZIP Code to confirm that the address is in our service area',
  stateOptions: [{ value: 'DEN', label: 'Denver' }],
  locationTypeOptions: [{ value: 'home', label: 'Home' }],
  isFormFooterVisible: true,
  isSubmitButtonDisabled: false,
  onSubmit: jest.fn(),
};

const setup = (
  props: Partial<AddressFormProps> = {},
  formFieldValues: Partial<AddressFormFieldValues> = {}
) => {
  const { result } = renderHook(() =>
    useForm<AddressFormFieldValues>({
      values: {
        ...defaultAddressFormFieldValues,
        ...formFieldValues,
      },
    })
  );

  return render(
    <AddressForm
      {...defaultProps}
      {...props}
      formControl={result.current.control}
    />,
    {
      withRouter: true,
    }
  );
};

describe('<AddressForm />', () => {
  it('should correctly display Address form', () => {
    setup();
    const radioRoot = screen.queryByTestId(ADDRESS_FORM_TEST_IDS.RADIO_ROOT);
    expect(radioRoot).not.toBeInTheDocument();

    const headerTitle = screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
    expect(headerTitle).toBeVisible();
    expect(headerTitle).toHaveTextContent('Where should we send our team?');

    const headerSubtitle = screen.getByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(headerSubtitle).toBeVisible();
    expect(headerSubtitle).toHaveTextContent(
      exactRegexMatch(
        'Enter your ZIP Code to confirm that the address is in our service area'
      )
    );

    const zipCodeInput = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.ZIP_CODE_INPUT
    );
    expect(zipCodeInput).toBeVisible();

    const addressAvailabilityAlert = screen.queryByTestId(
      ADDRESS_FORM_TEST_IDS.ADDRESS_AVAILABILITY_ALERT
    );
    expect(addressAvailabilityAlert).not.toBeInTheDocument();

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).toBeVisible();
    expect(continueButton).toHaveTextContent(exactRegexMatch('Continue'));
  });

  it('should correctly display success address availability alert with location input fields section', () => {
    const mockAlertMessage = 'Great news! You’re in our service area.';
    const mockAddressAvailabilityAlert: AddressFormProps['addressAvailabilityAlert'] =
      <Alert severity="success" message={mockAlertMessage} />;

    setup({
      isLocationFieldsSectionVisible: true,
      addressAvailabilityAlert: mockAddressAvailabilityAlert,
      isFormFooterVisible: true,
    });

    const addressAvailabilityAlert = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.ADDRESS_AVAILABILITY_ALERT
    );
    expect(addressAvailabilityAlert).toBeVisible();
    expect(addressAvailabilityAlert).toHaveTextContent(
      exactRegexMatch(mockAlertMessage)
    );

    const locationInputFieldsSection = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_FIELDS_SECTION
    );
    expect(locationInputFieldsSection).toBeVisible();

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).toBeVisible();
  });

  it('should correctly display error address availability alert', () => {
    const mockAlertTitle = 'Sorry, we’re not available in that location.';
    const mockAlertMessage =
      'Our recommendation is that the patient goes to their nearest urgent care or contacts their primary care provider.';
    const mockAddressAvailabilityAlert: AddressFormProps['addressAvailabilityAlert'] =
      (
        <Alert
          severity="error"
          title={mockAlertTitle}
          message={mockAlertMessage}
        />
      );

    setup({
      isLocationFieldsSectionVisible: false,
      addressAvailabilityAlert: mockAddressAvailabilityAlert,
      isFormFooterVisible: false,
    });

    const addressAvailabilityAlert = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.ADDRESS_AVAILABILITY_ALERT
    );
    expect(addressAvailabilityAlert).toBeVisible();
    expect(addressAvailabilityAlert).toHaveTextContent(mockAlertTitle);
    expect(addressAvailabilityAlert).toHaveTextContent(mockAlertMessage);

    const continueButton = screen.queryByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );
    expect(continueButton).not.toBeInTheDocument();
  });

  it('should correctly display with invalid address', () => {
    const mockFormHeaderTitle = 'Confirm your address';
    const mockAlertTitle = 'Invalid Address';
    const mockAlertMessage =
      'We can’t validate the address you entered. Please enter a correct address.';

    setup({
      formHeaderTitle: mockFormHeaderTitle,
      formHeaderSubtitle: '',
      isInvalidAddressAlertVisible: true,
      isLocationFieldsSectionVisible: true,
      isFormFooterVisible: false,
    });

    const headerTitle = screen.getByTestId(FORM_HEADER_TEST_IDS.TITLE);
    expect(headerTitle).toBeVisible();
    expect(headerTitle).toHaveTextContent(mockFormHeaderTitle);

    const headerSubtitle = screen.queryByTestId(FORM_HEADER_TEST_IDS.SUBTITLE);
    expect(headerSubtitle).not.toBeInTheDocument();

    const invalidAddressAlert = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.INVALID_ADDRESS_ALERT
    );
    expect(invalidAddressAlert).toBeVisible();
    expect(invalidAddressAlert).toHaveTextContent(mockAlertTitle);
    expect(invalidAddressAlert).toHaveTextContent(mockAlertMessage);

    const locationInputFieldsSection = screen.getByTestId(
      ADDRESS_FORM_TEST_IDS.LOCATION_FIELDS_SECTION
    );
    expect(locationInputFieldsSection).toBeVisible();
  });

  it.each([
    {
      name: 'zipCode',
      fieldTestId: ADDRESS_FORM_TEST_IDS.ZIP_CODE_FIELD,
      placeholder: 'ZIP Code',
    },
    {
      name: 'streetAddress1',
      fieldTestId: ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_PRIMARY_FIELD,
      placeholder: 'Street Address',
    },
    {
      name: 'streetAddress2',
      fieldTestId: ADDRESS_FORM_TEST_IDS.STREET_ADDRESS_SECONDARY_FIELD,
      placeholder: 'Unit / Apt / Suite Number',
    },
    {
      name: 'city',
      fieldTestId: ADDRESS_FORM_TEST_IDS.CITY_FIELD,
      placeholder: 'City',
    },
    {
      name: 'state',
      fieldTestId: ADDRESS_FORM_TEST_IDS.STATE_FIELD,
      placeholder: 'State',
    },
    {
      name: 'locationType',
      fieldTestId: ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_FIELD,
      placeholder: 'Location Type',
    },
    {
      name: 'locationDetails',
      fieldTestId: ADDRESS_FORM_TEST_IDS.LOCATION_DETAILS_FIELD,
      placeholder: 'Location Details',
    },
  ])(
    'should render address location fields section with $name field',
    ({ fieldTestId, placeholder }) => {
      setup({
        isLocationFieldsSectionVisible: true,
      });

      const field = screen.getByTestId(fieldTestId);
      expect(field).toBeVisible();
      expect(field).toHaveTextContent(placeholder);
    }
  );

  it.each([
    {
      name: 'state',
      selectTestId: ADDRESS_FORM_TEST_IDS.STATE_SELECT,
      selectItemTestId: ADDRESS_FORM_TEST_IDS.STATE_SELECT_ITEM_PREFIX,
      propsOptionsName: 'stateOptions',
    },
    {
      name: 'locationType',
      selectTestId: ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT,
      selectItemTestId: ADDRESS_FORM_TEST_IDS.LOCATION_TYPE_SELECT_ITEM_PREFIX,
      propsOptionsName: 'locationTypeOptions',
    },
  ])(
    'should render address location fields section with $name select and options',
    async ({ selectTestId, selectItemTestId, propsOptionsName }) => {
      const mockOptions = [
        { value: 'value 1', label: 'label 1' },
        { value: 'value 2', label: 'label 2' },
        { value: 'value 3', label: 'label 3' },
      ];

      const { user } = setup({
        isLocationFieldsSectionVisible: true,
        [propsOptionsName]: mockOptions,
      });

      const select = screen.getByTestId(selectTestId);
      expect(select).toBeVisible();

      const selectButton = within(select).getByRole('button');
      expect(selectButton).toBeVisible();

      await user.click(selectButton);

      mockOptions.forEach((option) => {
        const selectFieldOption = screen.getByTestId(
          FORM_SELECT_MENU_ITEM_TEST_IDS.getFormSelectMenuItem(
            selectItemTestId,
            option.value
          )
        );

        expect(selectFieldOption).toBeVisible();
        expect(selectFieldOption).toHaveTextContent(option.label);
      });
    }
  );

  it('should call onSubmit on continue button click', async () => {
    const { user } = setup({
      isLocationFieldsSectionVisible: true,
      radioOptions: [
        { value: '1', label: '5830 Elliot Avenue, #202' },
        { value: '', label: 'Add New Address' },
      ],
    });

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );

    const radioRoot = screen.queryByTestId(ADDRESS_FORM_TEST_IDS.RADIO_ROOT);
    expect(radioRoot).toBeVisible();

    await user.click(continueButton);

    expect(defaultProps.onSubmit).toBeCalled();
  });

  it('should render continue loading button', () => {
    setup({
      isSubmitButtonDisabled: true,
    });

    const continueButton = screen.getByTestId(
      FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON
    );

    expect(continueButton).toBeVisible();
    expect(continueButton).toBeDisabled();
  });
});
