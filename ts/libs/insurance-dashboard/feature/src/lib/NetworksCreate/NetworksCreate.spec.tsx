import { render, screen, waitFor } from '../../testUtils';
import NetworksCreate from './NetworksCreate';
import {
  FORM_CONTROLS_TEST_IDS,
  NETWORK_FORM_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import {
  environment,
  mockedNetworkFormData,
  NETWORKS_API_PATH,
} from '@*company-data-covered*/insurance/data-access';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
} from '../constants';
import { mswServer } from '../../testUtils/server';
import { rest } from 'msw';
import { TOAST_NOTIFICATIONS_TEST_IDS } from '../ToastNotifications/testIds';
import { ToastNotifications } from '../ToastNotifications';

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
    useParams: vi.fn(() => ({
      payerId: mockedNetworkFormData.insurancePayerId,
    })),
  };
});

const getNetworkNameInput = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.NAME_INPUT);
const getCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const getSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const getAddressForm = (addressIndex: number) =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.getAddressFormTestId(addressIndex));
const getStreetAddressInput = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getStreetAddressInputTestId(addressIndex)
  );
const getAddAddressButton = () =>
  screen.getByTestId(NETWORK_FORM_TEST_IDS.ADD_ANOTHER_ADDRESS_BUTTON);
const getRemoveAddressButton = (addressIndex: number) =>
  screen.getByTestId(
    NETWORK_FORM_TEST_IDS.getRemoveAddressButtonTestId(addressIndex)
  );

const setup = () =>
  render(
    <>
      <NetworksCreate />
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

describe('<NetworksCreate />', () => {
  it('should render properly', async () => {
    setup();
    const networkNameInput = getNetworkNameInput();
    const cancelButton = getCancelButton();
    const submitButton = getSubmitButton();

    expect(networkNameInput).toBeVisible();
    expect(cancelButton).toBeVisible();
    expect(submitButton).toBeVisible();
  });

  it('should reset form values and redirect to Payer Networks Tab after clicking on cancel button', async () => {
    const { user } = setup();
    const networkNameInput = getNetworkNameInput();
    const cancelButton = getCancelButton();

    expect(networkNameInput).toHaveValue('');
    await user.type(networkNameInput, mockedNetworkFormData.name);
    expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);

    await user.click(cancelButton);

    await waitFor(() => {
      const updatedNetworkNameInput = getNetworkNameInput();
      expect(updatedNetworkNameInput).toHaveValue('');
    });

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(
        INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(
          mockedNetworkFormData.insurancePayerId
        ),
        { replace: true }
      );
    });
  });

  it('should submit creating new network', async () => {
    const { user } = setup();
    const networkNameInput = getNetworkNameInput();
    const submitButton = getSubmitButton();

    expect(networkNameInput).toHaveValue('');
    await user.type(networkNameInput, mockedNetworkFormData.name);
    expect(networkNameInput).toHaveValue(mockedNetworkFormData.name);

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

  it('should throw error on network create submit', async () => {
    mswServer.use(
      rest.post(
        `${environment.serviceURL}${NETWORKS_API_PATH}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_CREATE_ERROR,
            })
          );
        }
      )
    );
    const { user } = setup();
    const submitButton = getSubmitButton();

    const networkNameInput = getNetworkNameInput();
    await user.type(networkNameInput, 'network1');
    expect(networkNameInput).toHaveValue('network1');

    await user.clear(networkNameInput);
    await user.click(submitButton);

    const notificationsRoot = await screen.findByTestId(
      TOAST_NOTIFICATIONS_TEST_IDS.ROOT
    );
    const snackbar = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR);
    const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_CREATE_ERROR
    );

    mswServer.resetHandlers();
  });

  it('should show success toast on network create submit', async () => {
    mswServer.use(
      rest.post(
        `${environment.serviceURL}${NETWORKS_API_PATH}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({
              message:
                DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_CREATE_SUCCESS,
            })
          );
        }
      )
    );
    const { user } = setup();

    const networkNameInput = getNetworkNameInput();
    await user.type(networkNameInput, 'network1');
    expect(networkNameInput).toHaveValue('network1');

    const submitButton = getSubmitButton();
    await user.click(submitButton);

    const notificationsRoot = await screen.findByTestId(
      TOAST_NOTIFICATIONS_TEST_IDS.ROOT
    );
    const snackbar = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR);
    const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_CREATE_SUCCESS
    );

    mswServer.resetHandlers();
  });

  it('should add and remove additional address', async () => {
    const mockAddedAddressIndex = 0;
    const { user } = setup();
    const addAddressButton = getAddAddressButton();
    expect(addAddressButton).toBeVisible();
    expect(addAddressButton).toBeEnabled();
    await user.click(addAddressButton);

    const addressForm = getAddressForm(mockAddedAddressIndex);
    expect(addressForm).toBeVisible();
    const addressStreetInput = getStreetAddressInput(mockAddedAddressIndex);
    expect(addressStreetInput).toBeVisible();
    expect(addressStreetInput).toHaveValue('');

    const removeAddressButton = getRemoveAddressButton(mockAddedAddressIndex);
    expect(removeAddressButton).toBeVisible();
    expect(removeAddressButton).toBeEnabled();
    await user.click(removeAddressButton);
    await waitFor(() => expect(addressForm).not.toBeInTheDocument());
    expect(addressStreetInput).not.toBeInTheDocument();
    expect(removeAddressButton).not.toBeInTheDocument();
  });

  it('should change additional address form field value and do not change main address form field value', async () => {
    const updatedSecondaryStreetAddressInputValue = 'updated street address';
    const mockFirstAddressIndex = 0;
    const mockSecondAddressIndex = 1;
    const { user } = setup();

    const addAddressButton = getAddAddressButton();
    expect(addAddressButton).toBeVisible();
    expect(addAddressButton).toBeEnabled();
    await user.click(addAddressButton);

    const networkStreetAddressInput = getStreetAddressInput(
      mockFirstAddressIndex
    );

    expect(networkStreetAddressInput).toHaveValue('');

    const addAnotherAddressButton = getAddAddressButton();
    await user.click(addAnotherAddressButton);

    const secondaryStreetAddressInput = getStreetAddressInput(
      mockSecondAddressIndex
    );
    expect(secondaryStreetAddressInput).toHaveValue('');
    await user.type(
      secondaryStreetAddressInput,
      updatedSecondaryStreetAddressInputValue
    );
    expect(networkStreetAddressInput).toHaveValue('');
    expect(secondaryStreetAddressInput).toHaveValue(
      updatedSecondaryStreetAddressInputValue
    );
  });
});
