import {
  render,
  renderForReadOnlyRole,
  screen,
  waitFor,
  within,
} from '../../testUtils';
import NetworksDetails from './NetworksDetails';
import {
  FORM_CONTROLS_TEST_IDS,
  NETWORK_FORM_TEST_IDS,
  networkFormClassificationSelectOptionPrefixText,
  networkFormStateAddressSelectOptionPrefixText,
} from '@*company-data-covered*/insurance/ui';
import {
  InsuranceNetworkForm,
  NETWORKS_API_PATH,
  environment,
  mockedInsuranceClassifications,
  mockedNetworkAddress,
  mockedNetworkFormData,
  mockedStates,
} from '@*company-data-covered*/insurance/data-access';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
} from '../constants';
import { TOAST_NOTIFICATIONS_TEST_IDS } from '../ToastNotifications/testIds';
import { ToastNotifications } from '../ToastNotifications';
import { rest } from 'msw';
import { mswServer } from '../../testUtils/server';

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
    useParams: vi.fn(() => ({
      networkId: '1',
    })),
  };
});

const updatedNetworkFormFieldValues = {
  updatedName: 'updated name',
  updatedNotes: 'updated notes',
  updatedStreetAddress: 'updated street address',
  updatedCity: 'updated city',
  updatedZipCode: '1234',
};

const mockFirstAddressIndex = 0;

const getNetworkNameInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.NAME_INPUT);
const getNetworkAthenaPackageIdInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.PACKAGE_ID_INPUT);
const getNetworkEmcCodeInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.EMC_CODE_INPUT);
const getNetworkNotesInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.NOTES_INPUT);
const getNetworkActiveRadioButtonByLabel = (name: keyof InsuranceNetworkForm) =>
  within(
    screen.getByTestId(NETWORK_FORM_TEST_IDS.getActiveQuestionTestId(name))
  ).getByLabelText('Status active');
const getNetworkInactiveRadioButtonByLabel = (
  name: keyof InsuranceNetworkForm
) =>
  within(
    screen.getByTestId(NETWORK_FORM_TEST_IDS.getInactiveQuestionTestId(name))
  ).getByLabelText('Status inactive');
const getNetworkClassificationsSelect = () =>
  within(
    screen.getByTestId(NETWORK_FORM_TEST_IDS.CLASSIFICATION_SELECT)
  ).getByRole('button');
const getAddressForm = (addressIndex: number) =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.getAddressFormTestId(addressIndex));
const getStreetAddressInput = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getStreetAddressInputTestId(addressIndex)
  );
const findStreetAddressInput = (addressIndex: number) =>
  screen.findByTestId(
    NETWORK_FORM_TEST_IDS.getStreetAddressInputTestId(addressIndex)
  );
const getCityAddressInput = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getCityAddressInputTestId(addressIndex)
  );
const findCityAddressInput = (addressIndex: number) =>
  screen.findByTestId(
    NETWORK_FORM_TEST_IDS.getCityAddressInputTestId(addressIndex)
  );
const getZipCodeAddressInput = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getZipAddressInputTestId(addressIndex)
  );
const findZipCodeAddressInput = (addressIndex: number) =>
  screen.findByTestId(
    NETWORK_FORM_TEST_IDS.getZipAddressInputTestId(addressIndex)
  );
const getNetworkStateAddressSelect = (addressIndex: number) =>
  within(
    screen.getByTestId(
      NETWORK_FORM_TEST_IDS.getStateAddressSelectTestId(addressIndex)
    )
  ).getByRole('button');
const getCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const getSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const getAddAddressButton = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.ADD_ANOTHER_ADDRESS_BUTTON);
const getRemoveAddressButton = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getRemoveAddressButtonTestId(addressIndex)
  );

const setup = (readOnly = false) => {
  const renderFN = readOnly ? renderForReadOnlyRole : render;

  return renderFN(
    <>
      <NetworksDetails />
      <ToastNotifications />
    </>,
    {
      withRouter: true,
      preloadedState: {
        notifications: {
          notifications: [],
        },
      },
    }
  );
};

describe('<NetworksDetails />', () => {
  it('should render properly', async () => {
    const { user } = setup();
    const networkNameInput = getNetworkNameInput();
    expect(networkNameInput).toBeVisible();

    const networkAthenaPackageIdInput = getNetworkAthenaPackageIdInput();
    expect(networkAthenaPackageIdInput).toBeVisible();

    const networkEmcCodeInput = getNetworkEmcCodeInput();
    expect(networkEmcCodeInput).toBeVisible();

    const networkNotesInput = getNetworkNotesInput();
    expect(networkNotesInput).toBeVisible();

    const cancelButton = getCancelButton();
    expect(cancelButton).toBeVisible();

    const submitButton = getSubmitButton();
    expect(submitButton).toBeVisible();

    const networkActiveActive = getNetworkActiveRadioButtonByLabel('active');
    expect(networkActiveActive).not.toBeChecked();

    const networkEligibilityCheckActive =
      getNetworkActiveRadioButtonByLabel('eligibilityCheck');
    expect(networkEligibilityCheckActive).not.toBeChecked();

    const networkProviderEnrollmentActive =
      getNetworkActiveRadioButtonByLabel('providerEnrollment');
    expect(networkProviderEnrollmentActive).not.toBeChecked();

    const networkActiveInactive =
      getNetworkInactiveRadioButtonByLabel('active');
    expect(networkActiveInactive).toBeChecked();

    const networkEligibilityCheckInactive =
      getNetworkInactiveRadioButtonByLabel('eligibilityCheck');
    expect(networkEligibilityCheckInactive).toBeChecked();

    const networkProviderEnrollmentInactive =
      getNetworkInactiveRadioButtonByLabel('providerEnrollment');
    expect(networkProviderEnrollmentInactive).toBeChecked();

    const networkClassificationsSelect = getNetworkClassificationsSelect();
    await user.click(networkClassificationsSelect);
    const classificationsDropdownItems = await screen.findAllByTestId(
      new RegExp(networkFormClassificationSelectOptionPrefixText)
    );
    expect(classificationsDropdownItems.length).toEqual(
      mockedInsuranceClassifications.length
    );
    classificationsDropdownItems.forEach((item, index) => {
      expect(item.getAttribute('data-value')).toEqual(
        String(mockedInsuranceClassifications[index].id)
      );
    });
    await user.click(classificationsDropdownItems[0]);

    const networkStreetAddressInput = await findStreetAddressInput(
      mockFirstAddressIndex
    );
    expect(networkStreetAddressInput).toBeVisible();

    const networkCityAddressInput = getCityAddressInput(mockFirstAddressIndex);
    expect(networkCityAddressInput).toBeVisible();

    const networkZipCodeAddressInput = getZipCodeAddressInput(
      mockFirstAddressIndex
    );
    expect(networkZipCodeAddressInput).toBeVisible();

    const networkStateAddressSelect = getNetworkStateAddressSelect(
      mockFirstAddressIndex
    );
    await user.click(networkStateAddressSelect);
    const stateAddressDropdownItems = await screen.findAllByTestId(
      new RegExp(networkFormStateAddressSelectOptionPrefixText)
    );
    expect(stateAddressDropdownItems.length).toEqual(mockedStates.length);
    stateAddressDropdownItems.forEach((item, index) => {
      expect(item.getAttribute('data-value')).toEqual(
        String(mockedStates[index].name)
      );
    });
    await user.click(stateAddressDropdownItems[0]);
  });

  it('should preselect network data from response', async () => {
    setup();
    const networkNameInput = getNetworkNameInput();
    expect(networkNameInput).toHaveValue('');

    const networkClassificationsSelect = getNetworkClassificationsSelect();
    expect(networkClassificationsSelect).toHaveTextContent(new RegExp(''));

    const networkAthenaPackageIdInput = getNetworkAthenaPackageIdInput();
    expect(networkAthenaPackageIdInput).toHaveValue('');

    const networkEmcCodeInput = getNetworkEmcCodeInput();
    expect(networkEmcCodeInput).toHaveValue('');

    const networkActiveActive = getNetworkActiveRadioButtonByLabel('active');
    expect(networkActiveActive).not.toBeChecked();

    const networkEligibilityCheckActive =
      getNetworkActiveRadioButtonByLabel('eligibilityCheck');
    expect(networkEligibilityCheckActive).not.toBeChecked();

    const networkProviderEnrollmentActive =
      getNetworkActiveRadioButtonByLabel('providerEnrollment');
    expect(networkProviderEnrollmentActive).not.toBeChecked();

    const networkNotesInput = getNetworkNotesInput();
    expect(networkNotesInput).toHaveValue('');

    await waitFor(() => {
      expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);
    });

    expect(networkClassificationsSelect).toHaveTextContent(
      mockedInsuranceClassifications[0].name
    );
    expect(networkAthenaPackageIdInput).toHaveValue(
      mockedNetworkFormData.packageId
    );
    expect(networkEmcCodeInput).toHaveValue(mockedNetworkFormData.emcCode);
    const networkStreetAddressInput = getStreetAddressInput(
      mockFirstAddressIndex
    );
    expect(networkStreetAddressInput).toHaveValue(
      mockedNetworkAddress.addressLineOne
    );

    const networkCityAddressInput = getCityAddressInput(mockFirstAddressIndex);
    expect(networkCityAddressInput).toHaveValue(mockedNetworkAddress.city);

    const networkZipCodeAddressInput = getZipCodeAddressInput(
      mockFirstAddressIndex
    );
    expect(networkZipCodeAddressInput).toHaveValue(
      mockedNetworkAddress.zipCode
    );
    expect(networkActiveActive).toBeChecked();
    expect(networkEligibilityCheckActive).toBeChecked();
    expect(networkProviderEnrollmentActive).toBeChecked();
    expect(networkNotesInput).toHaveValue(mockedNetworkFormData.notes);
  });

  it('should change form values (network name input)', async () => {
    const { user } = setup();

    const networkNameInput = getNetworkNameInput();
    await waitFor(() => {
      expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);
    });
    await user.clear(networkNameInput);
    await user.type(
      networkNameInput,
      updatedNetworkFormFieldValues.updatedName
    );
    expect(networkNameInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedName
    );
  });

  it('should change form values (network athena package id input)', async () => {
    const { user } = setup();

    const networkAthenaPackageIdInput = getNetworkAthenaPackageIdInput();
    await waitFor(() => {
      expect(networkAthenaPackageIdInput).toHaveValue(
        mockedNetworkFormData.packageId
      );
    });
    await user.clear(networkAthenaPackageIdInput);
    await user.type(
      networkAthenaPackageIdInput,
      mockedNetworkFormData.packageId
    );
    expect(networkAthenaPackageIdInput).toHaveValue(
      mockedNetworkFormData.packageId
    );
  });

  it('should change form values (network emc code input)', async () => {
    const { user } = setup();

    const networkEmcCodeInput = getNetworkEmcCodeInput();
    await waitFor(() => {
      expect(networkEmcCodeInput).toHaveValue(mockedNetworkFormData.emcCode);
    });
    await user.clear(networkEmcCodeInput);
    await user.type(networkEmcCodeInput, mockedNetworkFormData.emcCode);
    expect(networkEmcCodeInput).toHaveValue(mockedNetworkFormData.emcCode);
  });

  it('should change form values (network notes input)', async () => {
    const { user } = setup();

    const networkNotesInput = getNetworkNotesInput();
    await waitFor(() => {
      expect(networkNotesInput).toHaveValue(mockedNetworkFormData.notes);
    });
    await user.clear(networkNotesInput);
    await user.type(
      networkNotesInput,
      updatedNetworkFormFieldValues.updatedNotes
    );
    expect(networkNotesInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedNotes
    );
  });

  it('should change form values (network street address input)', async () => {
    const { user } = setup();

    const networkStreetAddressInput = await findStreetAddressInput(
      mockFirstAddressIndex
    );
    expect(networkStreetAddressInput).toHaveValue(
      mockedNetworkAddress.addressLineOne
    );

    await user.clear(networkStreetAddressInput);
    await user.type(
      networkStreetAddressInput,
      updatedNetworkFormFieldValues.updatedStreetAddress
    );
    expect(networkStreetAddressInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedStreetAddress
    );
  });

  it('should change form values (network city address input)', async () => {
    const { user } = setup();

    const networkCityAddressInput = await findCityAddressInput(
      mockFirstAddressIndex
    );
    expect(networkCityAddressInput).toHaveValue(mockedNetworkAddress.city);

    await user.clear(networkCityAddressInput);
    await user.type(
      networkCityAddressInput,
      updatedNetworkFormFieldValues.updatedCity
    );
    expect(networkCityAddressInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedCity
    );
  });

  it('should change form values (network zip code address input)', async () => {
    const { user } = setup();

    const networkZipCodeAddressInput = await findZipCodeAddressInput(
      mockFirstAddressIndex
    );
    expect(networkZipCodeAddressInput).toHaveValue(
      mockedNetworkAddress.zipCode
    );

    await user.clear(networkZipCodeAddressInput);
    await user.type(
      networkZipCodeAddressInput,
      updatedNetworkFormFieldValues.updatedZipCode
    );
    expect(networkZipCodeAddressInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedZipCode
    );
  });

  it('should change form values (select)', async () => {
    const { user } = setup();
    const networkClassificationsSelect = getNetworkClassificationsSelect();
    await waitFor(() => {
      expect(networkClassificationsSelect).toHaveTextContent(
        mockedInsuranceClassifications[0].name
      );
    });
    await user.click(networkClassificationsSelect);
    const insuranceClassificationsOption = await screen.findByTestId(
      NETWORK_FORM_TEST_IDS.getClassificationSelectOptionTestId(
        mockedInsuranceClassifications[1].id
      )
    );
    await user.click(insuranceClassificationsOption);
    await waitFor(() => {
      expect(networkClassificationsSelect).toHaveTextContent(
        mockedInsuranceClassifications[1].name
      );
    });

    const networkStateAddressSelect = getNetworkStateAddressSelect(
      mockFirstAddressIndex
    );
    expect(networkStateAddressSelect).toHaveTextContent(new RegExp(''));
    await user.click(networkStateAddressSelect);
    const stateAddressOption = await screen.findByTestId(
      NETWORK_FORM_TEST_IDS.getStateAddressSelectOptionTestId(
        mockedStates[0].id,
        mockFirstAddressIndex
      )
    );
    await user.click(stateAddressOption);
    await waitFor(() => {
      expect(networkStateAddressSelect).toHaveTextContent(mockedStates[0].name);
    });
  });

  it('should change form values (radio buttons)', async () => {
    const { user } = setup();
    const networkActiveInactive =
      getNetworkInactiveRadioButtonByLabel('active');
    await waitFor(() => {
      expect(networkActiveInactive).not.toBeChecked();
    });
    await user.click(networkActiveInactive);
    expect(networkActiveInactive).toBeChecked();

    const networkEligibilityCheckInactive =
      getNetworkInactiveRadioButtonByLabel('eligibilityCheck');
    expect(networkEligibilityCheckInactive).not.toBeChecked();
    await user.click(networkEligibilityCheckInactive);
    expect(networkEligibilityCheckInactive).toBeChecked();

    const networkProviderEnrollmentInactive =
      getNetworkInactiveRadioButtonByLabel('providerEnrollment');
    expect(networkProviderEnrollmentInactive).not.toBeChecked();
    await user.click(networkProviderEnrollmentInactive);
    expect(networkProviderEnrollmentInactive).toBeChecked();
  });

  it('should redirect to Payer Networks Tab after clicking on cancel button', async () => {
    const { user } = setup();
    const networkNameInput = getNetworkNameInput();

    await waitFor(() => {
      expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);
    });

    const cancelButton = getCancelButton();

    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(
        INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(
          mockedNetworkFormData.insurancePayerId
        ),
        { replace: true }
      );
    });
  });

  it('should submit network update', async () => {
    const { user } = setup();
    const networkNameInput = getNetworkNameInput();

    await waitFor(() => {
      expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);
    });

    await user.clear(networkNameInput);
    await user.type(
      networkNameInput,
      updatedNetworkFormFieldValues.updatedName
    );
    expect(networkNameInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedName
    );

    const submitButton = getSubmitButton();

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(
        INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(
          mockedNetworkFormData.insurancePayerId
        ),
        { replace: true }
      );
    });
  });

  it('should show success toast on network update submit', async () => {
    const { user } = setup();
    const networkNameInput = getNetworkNameInput();

    await waitFor(() => {
      expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);
    });

    await user.clear(networkNameInput);
    await user.type(
      networkNameInput,
      updatedNetworkFormFieldValues.updatedName
    );
    expect(networkNameInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedName
    );

    const submitButton = getSubmitButton();
    await user.click(submitButton);

    const notificationsRoot = await screen.findByTestId(
      TOAST_NOTIFICATIONS_TEST_IDS.ROOT
    );
    expect(notificationsRoot).toBeVisible();

    const snackbar = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR);
    expect(snackbar).toBeVisible();

    const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_UPDATE_SUCCESS
    );
  });

  it('should throw error on network create submit', async () => {
    mswServer.use(
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_UPDATE_ERROR,
            })
          );
        }
      )
    );
    const { user } = setup();
    const networkNameInput = getNetworkNameInput();

    await waitFor(() => {
      expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);
    });

    await user.clear(networkNameInput);
    expect(networkNameInput).toHaveValue('');

    const submitButton = getSubmitButton();
    await user.click(submitButton);

    const notificationsRoot = await screen.findByTestId(
      TOAST_NOTIFICATIONS_TEST_IDS.ROOT
    );
    expect(notificationsRoot).toBeVisible();

    const snackbar = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR);
    expect(snackbar).toBeVisible();

    const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_UPDATE_ERROR
    );
  });

  it('should reset form values when component unmounts', async () => {
    const { user, unmount } = setup();
    const networkNameInput = getNetworkNameInput();
    await waitFor(() => {
      expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);
    });

    const cancelButton = getCancelButton();
    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalled();
    });

    unmount();

    render(<NetworksDetails />);

    const resetedNetworkNameInput = getNetworkNameInput();
    expect(resetedNetworkNameInput).toHaveValue('');
  });

  it('should render properly for read only state', async () => {
    setup(true);
    const networkNameInput = getNetworkNameInput();
    expect(networkNameInput).toBeVisible();
    expect(networkNameInput).toBeDisabled();

    const networkAthenaPackageIdInput = getNetworkAthenaPackageIdInput();
    expect(networkAthenaPackageIdInput).toBeVisible();
    expect(networkAthenaPackageIdInput).toBeDisabled();

    const networkEmcCodeInput = getNetworkEmcCodeInput();
    expect(networkEmcCodeInput).toBeVisible();
    expect(networkEmcCodeInput).toBeDisabled();

    const networkNotesInput = getNetworkNotesInput();
    expect(networkNotesInput).toBeVisible();
    expect(networkNotesInput).toBeDisabled();

    const networkActiveActive = getNetworkActiveRadioButtonByLabel('active');
    expect(networkActiveActive).toBeDisabled();

    const networkEligibilityCheckActive =
      getNetworkActiveRadioButtonByLabel('eligibilityCheck');
    expect(networkEligibilityCheckActive).toBeDisabled();

    const networkProviderEnrollmentActive =
      getNetworkActiveRadioButtonByLabel('providerEnrollment');
    expect(networkProviderEnrollmentActive).toBeDisabled();

    const networkActiveInactive =
      getNetworkInactiveRadioButtonByLabel('active');
    expect(networkActiveInactive).toBeDisabled();

    const networkEligibilityCheckInactive =
      getNetworkInactiveRadioButtonByLabel('eligibilityCheck');
    expect(networkEligibilityCheckInactive).toBeDisabled();

    const networkProviderEnrollmentInactive =
      getNetworkInactiveRadioButtonByLabel('providerEnrollment');
    expect(networkProviderEnrollmentInactive).toBeDisabled();

    const networkClassificationsSelect = getNetworkClassificationsSelect();
    expect(networkClassificationsSelect).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    const networkStreetAddressInput = await findStreetAddressInput(
      mockFirstAddressIndex
    );
    expect(networkStreetAddressInput).toBeVisible();
    expect(networkStreetAddressInput).toBeDisabled();

    const networkCityAddressInput = getCityAddressInput(mockFirstAddressIndex);
    expect(networkCityAddressInput).toBeVisible();
    expect(networkCityAddressInput).toBeDisabled();

    const networkZipCodeAddressInput = getZipCodeAddressInput(
      mockFirstAddressIndex
    );
    expect(networkZipCodeAddressInput).toBeVisible();
    expect(networkZipCodeAddressInput).toBeDisabled();

    const networkStateAddressSelect = getNetworkStateAddressSelect(
      mockFirstAddressIndex
    );
    expect(networkStateAddressSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it('should add and remove additional address', async () => {
    const mockSecondAddressIndex = 1;
    const { user } = setup();
    const addAnotherAddressButton = getAddAddressButton();
    expect(addAnotherAddressButton).toBeVisible();
    expect(addAnotherAddressButton).toBeEnabled();
    await user.click(addAnotherAddressButton);

    const secondaryAddressForm = getAddressForm(mockSecondAddressIndex);
    expect(secondaryAddressForm).toBeVisible();
    const secondaryAddressStreetInput = await findStreetAddressInput(
      mockSecondAddressIndex
    );
    expect(secondaryAddressStreetInput).toBeVisible();
    expect(secondaryAddressStreetInput).toHaveValue('');

    const removeAdditionalAddressButton = getRemoveAddressButton(
      mockSecondAddressIndex
    );
    expect(removeAdditionalAddressButton).toBeVisible();
    expect(removeAdditionalAddressButton).toBeEnabled();
    await user.click(removeAdditionalAddressButton);
    await waitFor(() => expect(secondaryAddressForm).not.toBeInTheDocument());
    expect(secondaryAddressStreetInput).not.toBeInTheDocument();
    expect(removeAdditionalAddressButton).not.toBeInTheDocument();
  });

  it('should change additional address form field value and do not change main address form field value', async () => {
    const mockSecondAddressIndex = 1;
    const { user } = setup();
    const networkStreetAddressInput = await findStreetAddressInput(
      mockFirstAddressIndex
    );
    expect(networkStreetAddressInput).toHaveValue(
      mockedNetworkAddress.addressLineOne
    );

    const addAnotherAddressButton = getAddAddressButton();
    await user.click(addAnotherAddressButton);

    const secondaryStreetAddressInput = await findStreetAddressInput(
      mockSecondAddressIndex
    );
    expect(secondaryStreetAddressInput).toHaveValue('');
    await user.type(
      secondaryStreetAddressInput,
      updatedNetworkFormFieldValues.updatedStreetAddress
    );
    expect(networkStreetAddressInput).toHaveValue(
      mockedNetworkAddress.addressLineOne
    );
    expect(secondaryStreetAddressInput).toHaveValue(
      updatedNetworkFormFieldValues.updatedStreetAddress
    );
  });
});
