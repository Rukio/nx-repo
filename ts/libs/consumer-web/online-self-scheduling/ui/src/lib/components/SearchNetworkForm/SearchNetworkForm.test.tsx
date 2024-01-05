import {
  exactRegexMatch,
  render,
  renderHook,
  screen,
} from '../../../testUtils';
import SearchNetworkForm, {
  SearchNetworkFormFieldValues,
  SearchNetworkFormProps,
} from './SearchNetworkForm';
import { SEARCH_NETWORK_FORM_TEST_IDS } from './testIds';
import { FORM_FOOTER_TEST_IDS } from '../FormFooter/testIds';
import { useForm } from 'react-hook-form';
import { InsuranceProviderOption } from '../SelectInsuranceProviderModal';
import {
  IMAGE_UPLOAD_STATUS_TEST_IDS,
  ImageUploadStatusState,
} from '@*company-data-covered*/design-system';

const insurancePayerMock: InsuranceProviderOption = {
  id: '1',
  label: 'A Insurance 3',
};
const mockSearchNetworkFormValues: SearchNetworkFormFieldValues = {
  payer: insurancePayerMock,
  networkId: '',
  memberId: '',
};

const defaultProps: Required<Omit<SearchNetworkFormProps, 'formControl'>> = {
  isVerifyInsuranceButtonDisabled: false,
  isAddAnotherInsuranceDisabled: false,
  alert: {
    severity: 'success',
    title: 'In Network',
    message: 'We’re in network with your insurance.',
  },
  networkOptions: [
    {
      label: 'Network 1',
      value: '1',
    },
    {
      label: 'Network 2',
      value: '2',
    },
  ],
  isAddAnotherInsuranceButtonVisible: true,
  searchNetworkFormTitle:
    'Please select the network that best matches your insurance card',
  isRemoveInsurancePayerButtonVisible: true,
  isLoading: false,
  isNetworkSelectVisible: true,
  isVerifyInsuranceButtonVisible: true,
  isContinueButtonVisible: true,
  verifyInsuranceButtonLabel: 'Verify Insurance',
  isInsuranceIneligible: false,
  insuranceCardBackUrl: 'invalidURl',
  insuranceCardFrontUrl: 'invalidURl',
  cardFrontUploadStatus: ImageUploadStatusState.Completed,
  cardBackUploadStatus: ImageUploadStatusState.Completed,
  isUserShouldTakeInsurancePhotos: false,
  submitButtonLabel: 'Continue',
  onAddAnotherInsuranceButton: jest.fn(),
  onVerifyInsurance: jest.fn(),
  onRemoveSelectedInsuranceProvider: jest.fn(),
  onClickSelectedInsuranceProvider: jest.fn(),
  onContinueToConfirmDetailsClick: jest.fn(),
};

const getContainer = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.CONTAINER);

const getSelectNetwork = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT);

const getRemoveSelectedProviderIcon = () =>
  screen.getByTestId(
    SEARCH_NETWORK_FORM_TEST_IDS.REMOVE_SELECTED_INSURANCE_PROVIDER_ICON
  );

const getSelectedProviderInput = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.SELECTED_PROVIDER_INPUT);

const getSelectNetworkInput = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT_INPUT);

const getMemberIdInput = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.MEMBER_ID_INPUT);

const getAddAnotherInsuranceButton = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.ADD_ANOTHER_INSURANCE_BUTTON);

const queryAddAnotherInsuranceButton = () =>
  screen.queryByTestId(
    SEARCH_NETWORK_FORM_TEST_IDS.ADD_ANOTHER_INSURANCE_BUTTON
  );

const getVerifyInsuranceButton = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.VERIFY_INSURANCE_BUTTON);

const getContinueButton = () =>
  screen.getByTestId(FORM_FOOTER_TEST_IDS.SUBMIT_BUTTON);

const getAlert = () => screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.ALERT);

const getTakePhotosTitle = () =>
  screen.getByTestId(SEARCH_NETWORK_FORM_TEST_IDS.TAKE_PHOTOS_TITLE);

const getInsuranceFrontImage = () =>
  screen.getByTestId(
    IMAGE_UPLOAD_STATUS_TEST_IDS.getImagePreviewTestId(
      SEARCH_NETWORK_FORM_TEST_IDS.INSURANCE_CARD_FRONT_IMAGE_PREFIX
    )
  );

const getInsuranceBackImage = () =>
  screen.getByTestId(
    IMAGE_UPLOAD_STATUS_TEST_IDS.getImagePreviewTestId(
      SEARCH_NETWORK_FORM_TEST_IDS.INSURANCE_CARD_BACK_IMAGE_PREFIX
    )
  );

const getCompleteFrontImageIndicator = () =>
  screen.getByTestId(
    IMAGE_UPLOAD_STATUS_TEST_IDS.getCompleteIndicatorTestId(
      SEARCH_NETWORK_FORM_TEST_IDS.INSURANCE_CARD_FRONT_IMAGE_PREFIX
    )
  );

const getCompleteBackImageIndicator = () =>
  screen.getByTestId(
    IMAGE_UPLOAD_STATUS_TEST_IDS.getCompleteIndicatorTestId(
      SEARCH_NETWORK_FORM_TEST_IDS.INSURANCE_CARD_BACK_IMAGE_PREFIX
    )
  );

const setup = (props: Partial<SearchNetworkFormProps> = {}) => {
  const { result } = renderHook(() =>
    useForm<SearchNetworkFormFieldValues>({
      values: mockSearchNetworkFormValues,
    })
  );

  return render(
    <SearchNetworkForm
      formControl={result.current.control}
      {...defaultProps}
      {...props}
    />
  );
};

describe('<SearchNetworkForm />', () => {
  it('should render form correctly', () => {
    setup();

    const container = getContainer();
    expect(container).toBeVisible();

    const selectedProviderInput = getSelectedProviderInput();
    expect(selectedProviderInput).toBeVisible();
    expect(selectedProviderInput).toHaveValue(
      mockSearchNetworkFormValues.payer.label
    );

    const removeSelectedProviderIcon = getRemoveSelectedProviderIcon();
    expect(removeSelectedProviderIcon).toBeVisible();

    const selectedNetwork = getSelectNetwork();
    expect(selectedNetwork).toBeVisible();

    const selectNetworkInput = getSelectNetworkInput();
    expect(selectNetworkInput).toHaveValue(
      mockSearchNetworkFormValues.networkId
    );

    const memberIdInput = getMemberIdInput();
    expect(memberIdInput).toBeVisible();
    expect(memberIdInput).toHaveValue(mockSearchNetworkFormValues.memberId);

    const alert = getAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      `${defaultProps.alert.title}${defaultProps.alert.message}`
    );

    const addAnotherInsuranceButton = getAddAnotherInsuranceButton();
    expect(addAnotherInsuranceButton).toBeVisible();
    expect(addAnotherInsuranceButton).toBeEnabled();
    expect(addAnotherInsuranceButton).toHaveTextContent(
      'Add another health insurance'
    );

    const continueButton = getContinueButton();
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeEnabled();
    expect(continueButton).toHaveTextContent('Continue');
  });

  it('should render form correctly with ineligible insurance', () => {
    setup({
      isInsuranceIneligible: true,
      isUserShouldTakeInsurancePhotos: true,
      isAddAnotherInsuranceButtonVisible: false,
      submitButtonLabel: 'Take Photos',
    });

    expect(getContainer()).toBeVisible();

    const selectedProviderInput = getSelectedProviderInput();
    expect(selectedProviderInput).toBeVisible();
    expect(selectedProviderInput).toHaveValue(
      mockSearchNetworkFormValues.payer.label
    );

    expect(getRemoveSelectedProviderIcon()).toBeVisible();

    expect(getSelectNetwork()).toBeVisible();

    const selectNetworkInput = getSelectNetworkInput();
    expect(selectNetworkInput).toHaveValue(
      mockSearchNetworkFormValues.networkId
    );

    const memberIdInput = getMemberIdInput();
    expect(memberIdInput).toBeVisible();
    expect(memberIdInput).toHaveValue(mockSearchNetworkFormValues.memberId);

    const alert = getAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      exactRegexMatch(
        `${defaultProps.alert.title}${defaultProps.alert.message}`
      )
    );

    expect(queryAddAnotherInsuranceButton()).not.toBeInTheDocument();

    const takePhotosTitle = getTakePhotosTitle();
    expect(takePhotosTitle).toBeVisible();
    expect(takePhotosTitle).toHaveTextContent(
      'It looks like the patient’s insurance may be out of network.In order to confirm their appointment, we require an image of their insurance card.'
    );

    expect(getInsuranceFrontImage()).toBeVisible();

    expect(getCompleteFrontImageIndicator()).toBeVisible();

    expect(getInsuranceBackImage()).toBeVisible();

    expect(getCompleteBackImageIndicator()).toBeVisible();

    const continueButton = getContinueButton();
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeEnabled();
    expect(continueButton).toHaveTextContent('Take Photos');
  });

  it('should call onRemoveSelectedInsuranceProvider if click on Remove selected insurance provider icon', async () => {
    const { user } = setup();

    const removeSelectedProviderIcon = getRemoveSelectedProviderIcon();
    expect(removeSelectedProviderIcon).toBeVisible();

    await user.click(removeSelectedProviderIcon);

    expect(defaultProps.onRemoveSelectedInsuranceProvider).toBeCalledTimes(1);
  });

  it('should call onClickSelectedInsuranceProvider if click on Selected insurance provider input', async () => {
    const { user } = setup();

    const selectedProviderInput = getSelectedProviderInput();
    expect(selectedProviderInput).toBeVisible();

    await user.click(selectedProviderInput);

    expect(defaultProps.onClickSelectedInsuranceProvider).toBeCalledTimes(1);
  });

  it('should call onAddAnotherInsuranceButton if click on Add Another Health Insurance button', async () => {
    const { user } = setup();

    const addAnotherInsuranceButton = getAddAnotherInsuranceButton();
    expect(addAnotherInsuranceButton).toBeVisible();
    expect(addAnotherInsuranceButton).toBeEnabled();

    await user.click(addAnotherInsuranceButton);

    expect(defaultProps.onAddAnotherInsuranceButton).toBeCalledTimes(1);
  });

  it('should call onVerifyInsurance if click on Verify Insurance button', async () => {
    const { user } = setup({
      alert: undefined,
    });

    const verifyInsuranceButton = getVerifyInsuranceButton();
    expect(verifyInsuranceButton).toBeVisible();
    expect(verifyInsuranceButton).toBeEnabled();
    expect(verifyInsuranceButton).toHaveTextContent('Verify Insurance');

    await user.click(verifyInsuranceButton);

    expect(defaultProps.onVerifyInsurance).toBeCalledTimes(1);
  });

  it('should call onContinueToConfirmDetailsClick if click on Continue button', async () => {
    const { user } = setup();

    const continueButton = getContinueButton();
    expect(continueButton).toBeVisible();
    expect(continueButton).toBeEnabled();
    expect(continueButton).toHaveTextContent('Continue');

    await user.click(continueButton);

    expect(defaultProps.onContinueToConfirmDetailsClick).toBeCalledTimes(1);
  });
});
