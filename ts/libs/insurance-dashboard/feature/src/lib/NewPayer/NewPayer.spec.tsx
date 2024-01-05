import {
  PAYER_FORM_TEST_IDS,
  FORM_CONTROLS_TEST_IDS,
  DETAILS_PAGE_HEADER_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import {
  environment,
  PAYERS_API_PATH,
} from '@*company-data-covered*/insurance/data-access';
import { rest } from 'msw';
import { render, screen, waitFor, within } from '../../testUtils';
import NewPayer from './NewPayer';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
} from '../constants';
import { ToastNotifications } from '../ToastNotifications';
import { TOAST_NOTIFICATIONS_TEST_IDS } from '../ToastNotifications/testIds';
import { mswServer } from '../../testUtils/server';
import { Provider } from 'react-redux';

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
  };
});

const getPayerNameInput = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_NAME_INPUT);
const getPayerNotesInput = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_NOTES_INPUT);
const getPayerGroupSelect = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_GROUP_SELECT);
const getPayerActiveRadioButton = () =>
  within(
    screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_STATUS_ACTIVE_RADIO)
  ).getByLabelText('Status active');
const getPayerInactiveRadioButton = () =>
  within(
    screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_STATUS_INACTIVE_RADIO)
  ).getByLabelText('Status inactive');
const getCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const getSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const getBackButton = () =>
  screen.getByTestId(DETAILS_PAGE_HEADER_TEST_IDS.BACK_BUTTON);

const setup = () =>
  render(
    <>
      <NewPayer />
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

const mockedPayerData = {
  name: 'Test Payer',
  notes: 'awesome notes',
  active: true,
};

describe('<NewPayer />', () => {
  it('should render properly', () => {
    setup();
    const nameInput = getPayerNameInput();
    const notesInput = getPayerNotesInput();
    const groupSelect = getPayerGroupSelect();
    const activeStatusRadioButton = getPayerActiveRadioButton();
    const inactiveStatusRadioButton = getPayerInactiveRadioButton();
    const cancelButton = getCancelButton();
    const submitButton = getSubmitButton();

    expect(nameInput).toBeVisible();
    expect(notesInput).toBeVisible();
    expect(groupSelect).toBeVisible();
    // toBeInTheDocument is used to just check that those hidden inputs are available
    // and have proper values.
    // toBeVisible can not be user, because it checks element for visibility as well.
    expect(activeStatusRadioButton).toBeInTheDocument();
    expect(inactiveStatusRadioButton).toBeInTheDocument();
    expect(cancelButton).toBeVisible();
    expect(submitButton).toBeVisible();
  });

  it('should change form values', async () => {
    const { user } = setup();
    const nameInput = getPayerNameInput();
    const notesInput = getPayerNotesInput();
    const activeStatusRadioButton = getPayerActiveRadioButton();
    const inactiveStatusRadioButton = getPayerInactiveRadioButton();

    await user.type(nameInput, mockedPayerData.name);
    expect(nameInput).toHaveValue(mockedPayerData.name);

    await user.type(notesInput, mockedPayerData.notes);
    expect(notesInput).toHaveValue(mockedPayerData.notes);

    expect(inactiveStatusRadioButton).toBeChecked();
    expect(activeStatusRadioButton).not.toBeChecked();
    await user.click(activeStatusRadioButton);
    expect(inactiveStatusRadioButton).not.toBeChecked();
    expect(activeStatusRadioButton).toBeChecked();
  });

  it('should reset form values', async () => {
    const { user } = setup();
    const nameInput = getPayerNameInput();
    const cancelButton = getCancelButton();

    await user.type(nameInput, mockedPayerData.name);
    expect(nameInput).toHaveValue(mockedPayerData.name);

    await user.click(cancelButton);

    await waitFor(() => {
      const updatedNameInput = getPayerNameInput();
      expect(updatedNameInput).toHaveValue('');
    });
    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(INSURANCE_DASHBOARD_ROUTES.PAYERS);
    });
  });

  it('should reset create payer form values after clicking on back button', async () => {
    const { user, rerender, store } = setup();
    const nameInput = getPayerNameInput();
    const backButton = getBackButton();

    await user.type(nameInput, mockedPayerData.name);
    expect(nameInput).toHaveValue(mockedPayerData.name);

    await user.click(backButton);

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(INSURANCE_DASHBOARD_ROUTES.PAYERS);
    });

    rerender(
      <Provider store={store}>
        <NewPayer />
      </Provider>
    );

    const rerenderedPayerNameInput = getPayerNameInput();
    expect(rerenderedPayerNameInput).toHaveValue('');
  });

  describe('Payer submit', () => {
    it('should throw error on payer create submit', async () => {
      mswServer.use(
        rest.post(
          `${environment.serviceURL}${PAYERS_API_PATH}`,
          (_req, res, ctx) => {
            return res.once(
              ctx.status(400),
              ctx.json({
                message: DEFAULT_NOTIFICATION_MESSAGES.PAYER_CREATE_ERROR,
              })
            );
          }
        )
      );

      const { user } = setup();
      const nameInput = getPayerNameInput();
      const submitButton = getSubmitButton();

      await user.clear(nameInput);
      expect(nameInput).toHaveValue('');

      await user.click(submitButton);

      const notificationsRoot = await screen.findByTestId(
        TOAST_NOTIFICATIONS_TEST_IDS.ROOT
      );
      const snackbar = screen.getByTestId(
        TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR
      );
      const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

      expect(notificationsRoot).toBeVisible();
      expect(snackbar).toBeVisible();
      expect(alert).toBeVisible();
      expect(alert).toHaveTextContent(
        DEFAULT_NOTIFICATION_MESSAGES.PAYER_CREATE_ERROR
      );

      mswServer.resetHandlers();
    });

    it('should submit creating new payer', async () => {
      const { user } = setup();
      const nameInput = getPayerNameInput();
      const submitButton = getSubmitButton();

      await user.type(nameInput, mockedPayerData.name);
      expect(nameInput).toHaveValue(mockedPayerData.name);

      await user.click(submitButton);

      const alert = await screen.findByTestId(
        TOAST_NOTIFICATIONS_TEST_IDS.ALERT
      );
      const snackbar = screen.queryByTestId(
        TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR
      );
      expect(snackbar).toBeInTheDocument();
      expect(alert).toBeVisible();
      expect(alert).toHaveTextContent(
        DEFAULT_NOTIFICATION_MESSAGES.PAYER_CREATE_SUCCESS
      );

      await waitFor(() => {
        expect(mockedNavigator).toBeCalledWith(
          INSURANCE_DASHBOARD_ROUTES.PAYERS
        );
      });
    });
  });
});
