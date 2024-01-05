import {
  PAYER_FORM_TEST_IDS,
  FORM_CONTROLS_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import {
  mockedInsurancePayer,
  insurancePayerToInsurancePayerFormData,
  RootState,
  environment,
  PAYERS_API_PATH,
} from '@*company-data-covered*/insurance/data-access';
import { rest } from 'msw';
import { mswServer } from '../../testUtils/server';
import {
  render,
  screen,
  waitFor,
  within,
  renderForReadOnlyRole,
} from '../../testUtils';
import ManagePayer from './ManagePayer';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
} from '../constants';
import { ToastNotifications } from '../ToastNotifications';
import { TOAST_NOTIFICATIONS_TEST_IDS } from '../ToastNotifications/testIds';
import { ConfigureStoreOptions } from '@reduxjs/toolkit';

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
    useParams: vi.fn(() => ({ payerId: mockedInsurancePayer.id })),
  };
});

const preselectedInsurancePayer =
  insurancePayerToInsurancePayerFormData(mockedInsurancePayer);

const getCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const queryCancelButton = () =>
  screen.queryByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const getSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const querySubmitButton = () =>
  screen.queryByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const getInputNameElement = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_NAME_INPUT);
const getNotesElement = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_NOTES_INPUT);
const getGroupSelect = () =>
  screen.getByRole('button', {
    ...screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_GROUP_SELECT),
    expanded: false,
  });
const getActiveRadioButton = () =>
  within(
    screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_STATUS_ACTIVE_RADIO)
  ).getByLabelText('Status active');
const getInactiveRadioButton = () =>
  within(
    screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_STATUS_INACTIVE_RADIO)
  ).getByLabelText('Status inactive');
const getArchiveButton = () =>
  screen.getByTestId(PAYER_FORM_TEST_IDS.ARCHIVE_BUTTON);

const setup = (
  overridePreloadedState: ConfigureStoreOptions<RootState>['preloadedState'] = {},
  renderAsReadOnly = false
) => {
  const renderFN = renderAsReadOnly ? renderForReadOnlyRole : render;

  return renderFN(
    <>
      <ManagePayer />
      <ToastNotifications />
    </>,
    {
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getPayerDetailsTabPath(
            mockedInsurancePayer.id
          ),
        ],
      },
      preloadedState: {
        notifications: {
          notifications: [],
        },
        ...overridePreloadedState,
      },
    }
  );
};

describe('<ManagePayer />', () => {
  it('should render properly', () => {
    setup();
    const nameInput = getInputNameElement();
    const notesInput = getNotesElement();
    const groupSelect = getGroupSelect();
    const activeStatusRadioButton = getActiveRadioButton();
    const inactiveStatusRadioButton = getInactiveRadioButton();
    const cancelButton = getCancelButton();
    const submitButton = getSubmitButton();

    expect(nameInput).toBeVisible();
    expect(notesInput).toBeVisible();
    expect(groupSelect).toBeVisible();
    expect(activeStatusRadioButton).toBeInTheDocument();
    expect(inactiveStatusRadioButton).toBeInTheDocument();
    expect(cancelButton).toBeVisible();
    expect(submitButton).toBeVisible();
  });

  it('should preselect payer data from response', async () => {
    setup();
    const defaultInput = getInputNameElement();
    expect(defaultInput).toHaveValue('');
    const defaultActiveStatusRadioButton = getActiveRadioButton();
    expect(defaultActiveStatusRadioButton).not.toBeChecked();

    await waitFor(() => {
      const nameInput = getInputNameElement();
      expect(nameInput).toHaveValue(preselectedInsurancePayer.name);
    });
    await waitFor(() => {
      const notesInput = getNotesElement();
      expect(notesInput).toHaveValue(preselectedInsurancePayer.notes);
    });
    await waitFor(() => {
      const activeStatusRadioButton = getActiveRadioButton();
      expect(activeStatusRadioButton).toBeChecked();
    });
  });

  it('should change form values', async () => {
    const { user } = setup();

    await waitFor(() => {
      const nameInput = getInputNameElement();
      expect(nameInput).toHaveValue(preselectedInsurancePayer.name);
    });

    const nameInput = getInputNameElement();
    const notesInput = getNotesElement();
    const activeStatusRadioButton = getActiveRadioButton();
    const inactiveStatusRadioButton = getInactiveRadioButton();

    await user.clear(nameInput);
    await user.type(nameInput, 'updated name');
    expect(nameInput).toHaveValue('updated name');

    await user.clear(notesInput);
    await user.type(notesInput, 'updated notes');
    expect(notesInput).toHaveValue('updated notes');

    expect(inactiveStatusRadioButton).not.toBeChecked();
    expect(activeStatusRadioButton).toBeChecked();
    await user.click(inactiveStatusRadioButton);
    expect(inactiveStatusRadioButton).toBeChecked();
    expect(activeStatusRadioButton).not.toBeChecked();
  });

  it('should reset form values', async () => {
    const { user } = setup();
    const cancelButton = getCancelButton();

    await waitFor(() => {
      const nameInput = getInputNameElement();
      expect(nameInput).toHaveValue(preselectedInsurancePayer.name);
    });

    const nameInput = getInputNameElement();
    await user.type(nameInput, 'updated');

    await user.click(cancelButton);

    await waitFor(() => {
      const updatedNameInput = getInputNameElement();
      expect(updatedNameInput).toHaveValue('');
    });
    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(INSURANCE_DASHBOARD_ROUTES.PAYERS);
    });
  });

  it('should throw error on payer update submit', async () => {
    mswServer.use(
      rest.patch(
        `${environment.serviceURL}${PAYERS_API_PATH}/:payerId`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: DEFAULT_NOTIFICATION_MESSAGES.PAYER_EDIT_ERROR,
            })
          );
        }
      )
    );
    const { user } = setup();
    const submitButton = getSubmitButton();

    await waitFor(() => {
      const nameInput = getInputNameElement();
      expect(nameInput).toHaveValue(preselectedInsurancePayer.name);
    });

    const nameInput = getInputNameElement();
    await user.clear(nameInput);
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
      DEFAULT_NOTIFICATION_MESSAGES.PAYER_EDIT_ERROR
    );

    mswServer.resetHandlers();
  });

  it('should submit payer update', async () => {
    const { user } = setup();
    const submitButton = getSubmitButton();

    await waitFor(() => {
      const nameInput = getInputNameElement();
      expect(nameInput).toHaveValue(preselectedInsurancePayer.name);
    });

    const nameInput = getInputNameElement();
    await user.type(nameInput, 'updated');
    await user.click(submitButton);

    const alert = await screen.findByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.PAYER_EDIT_SUCCESS
    );

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(INSURANCE_DASHBOARD_ROUTES.PAYERS);
    });
  });

  it('should archive payer', async () => {
    const { user } = setup();
    const archiveButton = getArchiveButton();

    await waitFor(() => {
      const nameInput = getInputNameElement();
      expect(nameInput).toHaveValue(preselectedInsurancePayer.name);
    });

    await user.click(archiveButton);
    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(INSURANCE_DASHBOARD_ROUTES.PAYERS);
    });
  });

  it('should render view only form', () => {
    setup({}, true);
    const nameInput = getInputNameElement();
    const notesInput = getNotesElement();
    const groupSelect = getGroupSelect();
    const activeStatusRadioButton = getActiveRadioButton();
    const inactiveStatusRadioButton = getInactiveRadioButton();
    const cancelButton = queryCancelButton();
    const submitButton = querySubmitButton();

    expect(nameInput).toBeVisible();
    expect(nameInput).toBeDisabled();

    expect(notesInput).toBeVisible();
    expect(notesInput).toBeDisabled();

    expect(groupSelect).toBeVisible();
    expect(groupSelect).toHaveAttribute('aria-disabled', 'true');

    expect(activeStatusRadioButton).toBeInTheDocument();
    expect(activeStatusRadioButton).toBeDisabled();

    expect(inactiveStatusRadioButton).toBeInTheDocument();
    expect(inactiveStatusRadioButton).toBeDisabled();

    expect(cancelButton).not.toBeInTheDocument();
    expect(submitButton).not.toBeInTheDocument();
  });
});
