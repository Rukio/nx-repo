import { rest } from 'msw';
import {
  render,
  screen,
  waitFor,
  within,
  renderForReadOnlyRole,
} from '../../testUtils';
import { mswServer } from '../../testUtils/server';
import { ToastNotifications } from '../ToastNotifications';
import NetworksBillingCities, {
  getStateAbbreviationByBillingCityId,
} from './NetworksBillingCities';
import {
  FORM_CONTROLS_TEST_IDS,
  NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS,
  NETWORKS_BILLING_CITIES_STATES_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import {
  MODALITIES_API_PATH,
  MODALITY_CONFIGS_API_FRAGMENT,
  NETWORKS_API_PATH,
  NETWORK_STATES_API_FRAGMENT,
  SERVICE_LINES_API_PATH,
  STATES_API_PATH,
  environment,
  mockedModalitiesList,
  mockedNetworkModalityConfig,
  mockedPayerData,
  mockedServiceLinesList,
  mockedStatePA,
  mockedStates,
  mockedServiceLine,
} from '@*company-data-covered*/insurance/data-access';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
} from '../constants';
import { TOAST_NOTIFICATIONS_TEST_IDS } from '../ToastNotifications/testIds';
import { Provider } from 'react-redux';

const getFiltersRoot = () =>
  screen.getByTestId(NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.ROOT);
const getStatesRoot = () =>
  screen.getByTestId(NETWORKS_BILLING_CITIES_STATES_TEST_IDS.ROOT);
const getFormControlsRoot = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.ROOT);
const findNotificationRoot = () =>
  screen.findByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ROOT);
const getFormControlsSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const queryFormControlsSubmitButton = () =>
  screen.queryByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const getSnackBar = () =>
  screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR);
const getAlert = () => screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);
const getFormControlsCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const queryFormControlsCancelButton = () =>
  screen.queryByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const getStatesSelect = () => {
  const containerComponent = screen.getByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_SELECT_CONTAINER
  );

  return within(containerComponent).getByRole('button', {
    ...screen.getByTestId(
      NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.STATES_SELECT
    ),
    expanded: false,
  });
};
const getServiceLinesSelect = () => {
  const containerComponent = screen.getByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.SERVICE_LINES_SELECT_CONTAINER
  );

  return within(containerComponent).getByRole('button', {
    ...screen.getByTestId(
      NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.SERVICE_LINES_SELECT
    ),
    expanded: false,
  });
};
const findStatesSelectOption = async (optionId: string) => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getStatesSelectOptionTestId(
      optionId
    )
  );
};

const findServiceLinesSelectOption = async (optionId: string) => {
  const presentation = await screen.findByRole('presentation');

  return within(presentation).findByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.getServiceLinesSelectOptionTestId(
      optionId
    )
  );
};

const findResetFiltersButton = () =>
  screen.findByTestId(
    NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.RESET_FILTERS_BUTTON
  );

const findStateIsActiveChip = (stateId: string) =>
  screen.findByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateActiveChip(stateId)
  );

const getModality = (
  stateId: string,
  billingCityId: string,
  serviceLineId: string,
  modalityId: string
) =>
  screen.getByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getModalityTestId(
      stateId,
      billingCityId,
      serviceLineId,
      modalityId
    )
  );
const findState = (stateId: string) =>
  screen.findByTestId(
    NETWORKS_BILLING_CITIES_STATES_TEST_IDS.getStateTestId(stateId)
  );

const setup = (readOnly = false) => {
  const renderFN = readOnly ? renderForReadOnlyRole : render;

  return renderFN(
    <>
      <NetworksBillingCities />
      <ToastNotifications />
    </>,
    {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getNetworkBillingCitiesTabPath(
            mockedPayerData.id,
            mockedNetworkModalityConfig.networkId
          ),
        ],
      },
      preloadedState: {
        notifications: {
          notifications: [],
        },
      },
    }
  );
};

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
    useParams: vi.fn(() => ({
      payerId: mockedPayerData.id,
      networkId: mockedNetworkModalityConfig.networkId,
    })),
  };
});

const mockedErrorMessage = 'Internal Error';

describe('<NetworksBillingCities />', () => {
  describe('utils', () => {
    describe('getStateAbbreviationByBillingCityId', () => {
      it.each([
        {
          billingCityId: mockedStatePA.billingCities[0].id,
          expected: mockedStatePA.abbreviation,
          message: 'should return state abbreviation for billingCity',
        },
        {
          billingCityId: mockedStatePA.billingCities[0].id + '999',
          expected: null,
          message:
            'should return null if there is no billing city in the states with the corresponding ID',
        },
      ])('$message', ({ expected, billingCityId }) => {
        const result = getStateAbbreviationByBillingCityId(
          mockedStates,
          billingCityId
        );
        expect(result).toEqual(expected);
      });
    });
  });

  it('should render properly', () => {
    setup();
    const filtersRoot = getFiltersRoot();
    const statesRoot = getStatesRoot();
    const formControlsRoot = getFormControlsRoot();

    const submitButton = getFormControlsSubmitButton();
    const cancelButton = getFormControlsCancelButton();

    expect(filtersRoot).toBeVisible();
    expect(statesRoot).toBeVisible();
    expect(formControlsRoot).toBeVisible();

    expect(submitButton).toBeVisible();
    expect(cancelButton).toBeVisible();
  });

  it('should show success message if states and modality configs patch requests were successful', async () => {
    const { user } = setup();

    const submitButton = getFormControlsSubmitButton();

    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    const notificationsRoot = await findNotificationRoot();

    const snackbar = getSnackBar();
    const alert = getAlert();

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.BILLING_CITY_EDIT_SUCCESS
    );
  });

  it('should show fallback error message if modality configs patch requests is unsuccessful and no error messages returned', async () => {
    mswServer.use(
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${MODALITY_CONFIGS_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: undefined,
            })
          );
        }
      )
    );
    const { user } = setup();

    const submitButton = getFormControlsSubmitButton();

    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    const notificationsRoot = await findNotificationRoot();

    const snackbar = getSnackBar();
    const alert = getAlert();

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.BILLING_CITY_EDIT_ERROR
    );
  });

  it('should show fallback error message if states and modality configs patch requests were unsuccessful and no error messages returned', async () => {
    mswServer.use(
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${NETWORK_STATES_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: undefined,
            })
          );
        }
      ),
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${MODALITY_CONFIGS_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: undefined,
            })
          );
        }
      )
    );
    const { user } = setup();

    const submitButton = getFormControlsSubmitButton();

    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    const notificationsRoot = await findNotificationRoot();

    const snackbar = getSnackBar();
    const alert = getAlert();

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.BILLING_CITY_EDIT_ERROR
    );
  });

  it('should show modality configs error message if states and modality configs patch requests were unsuccessful and both returned error message', async () => {
    const patchModalityConfigsError = 'patchModalityConfigsError';
    const patchStatesError = 'patchStatesError';

    mswServer.use(
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${MODALITY_CONFIGS_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: patchModalityConfigsError,
            })
          );
        }
      ),
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${NETWORK_STATES_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: patchStatesError,
            })
          );
        }
      )
    );
    const { user } = setup();

    const submitButton = getFormControlsSubmitButton();

    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    const notificationsRoot = await findNotificationRoot();

    const snackbar = getSnackBar();
    const alert = getAlert();

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(patchModalityConfigsError);
  });

  it('should show error message if both states and modality configs patch requests were unsuccessful', async () => {
    mswServer.use(
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${NETWORK_STATES_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: mockedErrorMessage,
            })
          );
        }
      ),
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${MODALITY_CONFIGS_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: mockedErrorMessage,
            })
          );
        }
      )
    );
    const { user } = setup();

    const submitButton = getFormControlsSubmitButton();

    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    const notificationsRoot = await findNotificationRoot();

    const snackbar = getSnackBar();
    const alert = getAlert();

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(mockedErrorMessage);
  });

  it('should show error message if states patch requests is unsuccessful', async () => {
    mswServer.use(
      rest.patch(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${NETWORK_STATES_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(400),
            ctx.json({
              message: mockedErrorMessage,
            })
          );
        }
      )
    );
    const { user } = setup();

    const submitButton = getFormControlsSubmitButton();

    await waitFor(() => expect(submitButton).toBeEnabled());

    await user.click(submitButton);

    const notificationsRoot = await findNotificationRoot();

    const snackbar = getSnackBar();
    const alert = getAlert();

    expect(notificationsRoot).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(mockedErrorMessage);
  });

  it('should select state filter option', async () => {
    const { user } = setup();

    const statesSelect = getStatesSelect();

    await user.click(statesSelect);
    const stateOption = await findStatesSelectOption(mockedStatePA.id);
    await user.click(stateOption);

    const updatedStateSelect = getStatesSelect();
    expect(updatedStateSelect).toHaveTextContent(mockedStatePA.name);
  });

  it('should select serviceLine filter option', async () => {
    const { user } = setup();

    const statesSelect = getServiceLinesSelect();

    await user.click(statesSelect);
    const serviceLineOption = await findServiceLinesSelectOption(
      mockedServiceLine.id
    );
    await user.click(serviceLineOption);

    const updatedServiceLineSelect = getServiceLinesSelect();
    expect(updatedServiceLineSelect).toHaveTextContent(mockedServiceLine.name);
  });

  it('should redirect to Payer Networks Tab after clicking on cancel button', async () => {
    const { user } = setup();

    const cancelButton = getFormControlsCancelButton();

    await waitFor(() => expect(cancelButton).toBeEnabled());

    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(
        INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(mockedPayerData.id)
      );
    });
  });

  it('should render Reset Filters button if any filter option is selected', async () => {
    const { user } = setup();

    const statesSelect = getStatesSelect();
    await user.click(statesSelect);

    const stateOption = await findStatesSelectOption(mockedStatePA.id);
    await user.click(stateOption);

    expect(statesSelect).toHaveTextContent(mockedStatePA.name);

    const resetFiltersButton = await findResetFiltersButton();
    expect(resetFiltersButton).toBeVisible();
  });

  it('should reset selected filter options and hide Reset Filters button', async () => {
    const { user } = setup();

    const statesSelect = getStatesSelect();
    await user.click(statesSelect);
    const stateOption = await findStatesSelectOption(mockedStatePA.id);
    await user.click(stateOption);
    expect(statesSelect).toHaveTextContent(mockedStatePA.name);

    const serviceLineSelect = getServiceLinesSelect();
    await user.click(serviceLineSelect);
    const serviceLineOption = await findServiceLinesSelectOption(
      mockedServiceLine.id
    );
    await user.click(serviceLineOption);
    expect(serviceLineSelect).toHaveTextContent(mockedServiceLine.name);

    const resetFiltersButton = await findResetFiltersButton();
    await user.click(resetFiltersButton);

    await waitFor(() => expect(statesSelect).toHaveTextContent(new RegExp('')));
    expect(serviceLineSelect).toHaveTextContent(new RegExp(''));
    expect(resetFiltersButton).not.toBeInTheDocument();
  });

  it('should have same states options on remount', async () => {
    mswServer.use(
      rest.get(
        `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId/${MODALITY_CONFIGS_API_FRAGMENT}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({
              configs: [],
            })
          );
        }
      )
    );

    const { rerender, store } = setup();

    for (const state of mockedStates) {
      const stateComponent = await findStateIsActiveChip(state.id);
      expect(stateComponent).toHaveTextContent('Inactive');
    }

    rerender(
      <Provider store={store}>
        <NetworksBillingCities />
        <ToastNotifications />
      </Provider>
    );

    for (const state of mockedStates) {
      const stateComponent = await findStateIsActiveChip(state.id);
      expect(stateComponent).toHaveTextContent('Inactive');
    }
  });

  it('should reset filters options on unmount', async () => {
    const { user, rerender, store } = setup();

    const statesSelect = getServiceLinesSelect();

    await user.click(statesSelect);
    const serviceLineOption = await findServiceLinesSelectOption(
      mockedServiceLine.id
    );
    await user.click(serviceLineOption);

    const updatedServiceLineSelect = getServiceLinesSelect();
    expect(updatedServiceLineSelect).toHaveTextContent(mockedServiceLine.name);

    rerender(
      <Provider store={store}>
        <NetworksBillingCities />
        <ToastNotifications />
      </Provider>
    );

    const resetedServiceLineSelect = getServiceLinesSelect();
    expect(resetedServiceLineSelect).not.toHaveTextContent(
      mockedServiceLine.name
    );
  });

  it('should reset new checked modalities after clicking on cancel button', async () => {
    mswServer.use(
      rest.get(
        `${environment.serviceURL}${STATES_API_PATH}`,
        (_req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ states: mockedStates }));
        }
      ),
      rest.get(
        `${environment.serviceURL}${SERVICE_LINES_API_PATH}`,
        (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ serviceLines: mockedServiceLinesList })
          );
        }
      ),
      rest.get(
        `${environment.serviceURL}${MODALITIES_API_PATH}`,
        (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ modalities: mockedModalitiesList })
          );
        }
      )
    );
    const mockedState = mockedStates[0];
    const mockedStateBillingCity = mockedState.billingCities[0];
    const mockedServiceLine = mockedServiceLinesList[0];
    const mockedModality = mockedModalitiesList[0];

    const { user } = setup();

    const stateComponent = await findState(mockedState.id);
    await user.click(stateComponent);
    const modalityComponent = getModality(
      mockedState.id,
      mockedStateBillingCity.id,
      mockedServiceLine.id,
      mockedModality.id
    );
    const modalityCheckbox = within(modalityComponent).getByRole('checkbox');
    await user.click(modalityCheckbox);
    expect(modalityCheckbox).toBeChecked();

    const cancelButton = getFormControlsCancelButton();
    await user.click(cancelButton);

    expect(modalityCheckbox).not.toBeChecked();
  });

  it('should render for read only role', async () => {
    const mockedState = mockedStates[0];
    const mockedStateBillingCity = mockedState.billingCities[0];
    const mockedServiceLine = mockedServiceLinesList[0];
    const mockedModality = mockedModalitiesList[0];

    const { user } = setup(true);

    const stateComponent = await findState(mockedState.id);
    await user.click(stateComponent);
    const modalityComponent = getModality(
      mockedState.id,
      mockedStateBillingCity.id,
      mockedServiceLine.id,
      mockedModality.id
    );
    const modalityCheckbox = within(modalityComponent).getByRole('checkbox');

    expect(modalityCheckbox).toBeInTheDocument();
    expect(modalityCheckbox).toBeDisabled();

    expect(queryFormControlsSubmitButton()).not.toBeInTheDocument();
    expect(queryFormControlsCancelButton()).not.toBeInTheDocument();
  });
});
