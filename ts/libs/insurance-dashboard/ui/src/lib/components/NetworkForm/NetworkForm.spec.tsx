import { render, screen, within, waitFor } from '../../../testUtils';
import NetworkForm, { NetworkFormProps } from './NetworkForm';
import { NETWORK_FORM_TEST_IDS } from './testIds';

const mockedProps: Required<NetworkFormProps> = {
  network: {
    name: 'name',
    insuranceClassificationId: '1',
    packageId: '123',
    notes: 'notes',
    active: true,
    eligibilityCheck: true,
    providerEnrollment: true,
    insurancePayerId: '1',
    emcCode: '123Code',
    address: {
      addressLineOne: 'Address',
      city: 'City',
      stateName: 'Pennsylvania',
      zipCode: '80105',
    },
    addresses: [
      {
        addressLineOne: 'Address',
        city: 'City',
        stateName: 'Pennsylvania',
        zipCode: '80105',
      },
      {
        addressLineOne: 'Address 2',
        city: 'City 2',
        stateName: 'Colorado',
        zipCode: '80202',
      },
    ],
  },
  networkClassifications: [
    { id: 1, name: 'Classification 1' },
    { id: 2, name: 'Classification 2' },
  ],
  addressStates: [
    { id: '1', name: 'Pennsylvania' },
    { id: '2', name: 'Colorado' },
  ],
  onChangeField: vi.fn(),
  onChangeNetworkAddressFormField: vi.fn(),
  onArchive: vi.fn(),
  onAddAddress: vi.fn(),
  onRemoveAddress: vi.fn(),
  isEditingForm: true,
  isAddAddressButtonVisible: true,
  addAddressButtonTitle: 'Add Another Address',
  isDisabled: false,
};

const getNetworkNameInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.NAME_INPUT);
const getNetworkPackageInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.PACKAGE_ID_INPUT);
const getNetworkEmcCodeInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.EMC_CODE_INPUT);
const getNetworkNotesInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.NOTES_INPUT);
const getAddAnotherAddressButton = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.ADD_ANOTHER_ADDRESS_BUTTON);
const getRemoveAddressButton = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getRemoveAddressButtonTestId(addressIndex)
  );

const getNetworkCheckboxActive = (name: string) =>
  within(
    screen.getByTestId(NETWORK_FORM_TEST_IDS.getActiveQuestionTestId(name))
  ).getByLabelText('Status active');
const getNetworkCheckboxInactive = (name: string) =>
  within(
    screen.getByTestId(NETWORK_FORM_TEST_IDS.getInactiveQuestionTestId(name))
  ).getByLabelText('Status inactive');

const getNetworkClassificationsSelect = () =>
  within(
    screen.getByTestId(NETWORK_FORM_TEST_IDS.CLASSIFICATION_SELECT)
  ).getByRole('button');
const findNetworkClassificationsSelectOption = async (optionId: number) => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findByTestId(
    NETWORK_FORM_TEST_IDS.getClassificationSelectOptionTestId(optionId)
  );
};

const getNetworkArchiveButton = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.ARCHIVE_BUTTON);

const setup = (overrideProps: Partial<NetworkFormProps> = {}) => {
  return render(<NetworkForm {...mockedProps} {...overrideProps} />);
};

describe('<NetworkForm />', () => {
  it('should render properly', async () => {
    const { user } = setup();

    const nameInput = getNetworkNameInput();
    const packageInput = getNetworkPackageInput();
    const notesInput = getNetworkNotesInput();
    const emcCodeInput = getNetworkEmcCodeInput();

    expect(nameInput).toHaveValue(mockedProps.network?.name);
    expect(packageInput).toHaveValue(mockedProps.network?.packageId);
    expect(notesInput).toHaveValue(mockedProps.network?.notes);
    expect(emcCodeInput).toHaveValue(mockedProps.network?.emcCode);

    const classificationsSelect = getNetworkClassificationsSelect();

    await user.click(classificationsSelect);
    for (const option of mockedProps.networkClassifications) {
      const classificationOption = await findNetworkClassificationsSelectOption(
        option.id
      );
      expect(classificationOption).toBeVisible();
      expect(classificationOption).toHaveAttribute(
        'data-value',
        String(option.id)
      );
    }

    const addAnotherAddressButton = getAddAnotherAddressButton();
    expect(addAnotherAddressButton).toBeVisible();

    const activeActiveCheckbox = getNetworkCheckboxActive('active');
    const eligibilityCheckActiveCheckbox =
      getNetworkCheckboxActive('eligibilityCheck');
    const providerEnrollmentActiveCheckbox =
      getNetworkCheckboxActive('providerEnrollment');
    expect(activeActiveCheckbox).toBeChecked();
    expect(eligibilityCheckActiveCheckbox).toBeChecked();
    expect(providerEnrollmentActiveCheckbox).toBeChecked();

    const activeInactiveCheckbox = getNetworkCheckboxInactive('active');
    const eligibilityCheckInactiveCheckbox =
      getNetworkCheckboxInactive('eligibilityCheck');
    const providerEnrollmentInactiveCheckbox =
      getNetworkCheckboxInactive('providerEnrollment');
    expect(activeInactiveCheckbox).not.toBeChecked();
    expect(eligibilityCheckInactiveCheckbox).not.toBeChecked();
    expect(providerEnrollmentInactiveCheckbox).not.toBeChecked();

    const archiveButton = getNetworkArchiveButton();
    expect(archiveButton).toBeVisible();
  });

  it('should update form input fields value', async () => {
    const { user } = setup({
      network: undefined,
    });

    const nameInput = getNetworkNameInput();
    const packageInput = getNetworkPackageInput();
    const notesInput = getNetworkNotesInput();
    const emcCodeInput = getNetworkEmcCodeInput();

    await user.type(nameInput, '1');
    expect(mockedProps.onChangeField).toHaveBeenCalledWith('name', '1');
    await user.type(packageInput, '1');
    expect(mockedProps.onChangeField).toHaveBeenCalledWith('packageId', '1');
    await user.type(notesInput, '1');
    expect(mockedProps.onChangeField).toHaveBeenCalledWith('notes', '1');
    await user.type(emcCodeInput, '1');
    expect(mockedProps.onChangeField).toHaveBeenCalledWith('emcCode', '1');
  });

  it('should update form checkbox fields value', async () => {
    const { user } = setup({
      network: undefined,
    });

    const activeInactiveCheckbox = getNetworkCheckboxInactive('active');
    const eligibilityCheckInactiveCheckbox =
      getNetworkCheckboxInactive('eligibilityCheck');
    const providerEnrollmentInactiveCheckbox =
      getNetworkCheckboxInactive('providerEnrollment');

    await user.click(activeInactiveCheckbox);
    expect(mockedProps.onChangeField).toHaveBeenLastCalledWith('active', false);

    await user.click(eligibilityCheckInactiveCheckbox);
    expect(mockedProps.onChangeField).toHaveBeenLastCalledWith(
      'eligibilityCheck',
      false
    );

    await user.click(providerEnrollmentInactiveCheckbox);
    expect(mockedProps.onChangeField).toHaveBeenLastCalledWith(
      'providerEnrollment',
      false
    );
  });

  it('should update form classification select field value', async () => {
    const { user } = setup({
      network: undefined,
    });

    const classificationsSelect = getNetworkClassificationsSelect();

    await user.click(classificationsSelect);
    const classificationsSelectOption =
      await findNetworkClassificationsSelectOption(
        mockedProps.networkClassifications[0].id
      );
    await user.click(classificationsSelectOption);
    await waitFor(() =>
      expect(mockedProps.onChangeField).toHaveBeenLastCalledWith(
        'insuranceClassificationId',
        mockedProps.networkClassifications[0].id
      )
    );
  });

  it('should call archive network on archive button click', async () => {
    const { user } = setup();

    const archiveButton = getNetworkArchiveButton();
    await user.click(archiveButton);
    expect(mockedProps.onArchive).toHaveBeenCalledTimes(1);
  });

  it('should call onAddAnotherAddress on add another address button click', async () => {
    const { user } = setup();

    const addAnotherAddressButton = getAddAnotherAddressButton();
    await user.click(addAnotherAddressButton);
    expect(mockedProps.onAddAddress).toHaveBeenCalledTimes(1);
  });

  it('should call onRemoveAdditionalAddress on remove additional address button click', async () => {
    const mockAddressToRemoveIndex = 1;
    const { user } = setup();

    const removeAdditionalAddressButton = getRemoveAddressButton(
      mockAddressToRemoveIndex
    );
    await user.click(removeAdditionalAddressButton);
    expect(mockedProps.onRemoveAddress).toHaveBeenCalledWith(
      mockAddressToRemoveIndex
    );
  });
});
