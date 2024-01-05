import { rest } from 'msw';
import {
  render,
  renderForReadOnlyRole,
  screen,
  waitFor,
  within,
} from '../../testUtils';
import NetworksCreditCardRules from './NetworksCreditCardRules';
import {
  NETWORKS_CREDIT_CARD_RULES_TEST_IDS,
  FORM_CONTROLS_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import {
  mockedNetworkServiceLines,
  SERVICE_LINES_API_PATH,
  environment,
  selectNetworkCreditCardRules,
  mockedInsuranceNetwork,
  mockedInsurancePayer,
  buildNetworkCreditCardRulesPath,
  NetworkCreditCardRules,
  ServiceLine,
} from '@*company-data-covered*/insurance/data-access';
import { ToastNotifications } from '../ToastNotifications';
import { DEFAULT_NOTIFICATION_MESSAGES } from '../constants';
import { TOAST_NOTIFICATIONS_TEST_IDS } from '../ToastNotifications/testIds';
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
      networkId: mockedInsuranceNetwork.id,
      payerId: mockedInsurancePayer.id,
    })),
  };
});

const mockedServiceLineWithDisabledRules: ServiceLine = {
  ...mockedNetworkServiceLines[0],
  id: '9999',
  name: 'Disabled ',
};

const mockedAllServiceLines = [
  ...mockedNetworkServiceLines,
  mockedServiceLineWithDisabledRules,
];

const mockErrorMessage = 'something went wrong';

const findAllServiceLineCreditCardRules = () =>
  screen.findAllByTestId(
    new RegExp(NETWORKS_CREDIT_CARD_RULES_TEST_IDS.SERVICE_LINE_PREFIX)
  );
const getServiceLineCreditCardRulesAlert = (serviceLineId: string) =>
  screen.getByTestId(
    NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineAlertTestId(serviceLineId)
  );
const getServiceLineCreditCardRulesOptionRadioInput = (
  serviceLineId: string,
  option: string
) => {
  return within(
    screen.getByTestId(
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineOptionTestId(
        serviceLineId,
        option
      )
    )
  ).getByRole('radio');
};
const getCancelButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.CANCEL_BUTTON);
const getSubmitButton = () =>
  screen.getByTestId(FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON);
const findNotificationAlert = () =>
  screen.findByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

const setup = (readOnly = false) => {
  const renderFN = readOnly ? renderForReadOnlyRole : render;

  return renderFN(
    <>
      <NetworksCreditCardRules />
      <ToastNotifications />
    </>,
    {
      withRouter: true,
    }
  );
};

describe('<NetworksCreditCardRules />', () => {
  beforeEach(() => {
    mswServer.use(
      rest.get(
        `${environment.serviceURL}${SERVICE_LINES_API_PATH}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({ serviceLines: mockedAllServiceLines })
          );
        }
      )
    );
  });

  it('should render properly', async () => {
    const { store } = setup();

    await findAllServiceLineCreditCardRules();

    const disabledAlert = getServiceLineCreditCardRulesAlert(
      mockedServiceLineWithDisabledRules.id
    );
    expect(disabledAlert).toBeVisible();

    const networkCreditCardRules = selectNetworkCreditCardRules(
      store.getState()
    );
    networkCreditCardRules.forEach((rule) => {
      const radioOption = getServiceLineCreditCardRulesOptionRadioInput(
        rule.serviceLineId,
        rule.creditCardRule
      );

      // toBeInTheDocument is used because input is hidden
      expect(radioOption).toBeInTheDocument();
      expect(radioOption).toBeChecked();
    });

    expect(
      screen.getByTestId(NETWORKS_CREDIT_CARD_RULES_TEST_IDS.ROOT)
    ).toBeVisible();
  });

  it('should change credit card rule', async () => {
    const { user } = setup();

    const serviceLine = mockedNetworkServiceLines[0];
    await findAllServiceLineCreditCardRules();

    const networkServiceLineRuleOptional =
      getServiceLineCreditCardRulesOptionRadioInput(
        serviceLine.id,
        NetworkCreditCardRules.optional
      );
    const networkServiceLineRuleRequired =
      getServiceLineCreditCardRulesOptionRadioInput(
        serviceLine.id,
        NetworkCreditCardRules.required
      );
    const networkServiceLineRuleDisabled =
      getServiceLineCreditCardRulesOptionRadioInput(
        serviceLine.id,
        NetworkCreditCardRules.disabled
      );

    await user.click(networkServiceLineRuleDisabled);
    await waitFor(() => {
      expect(networkServiceLineRuleDisabled).toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleRequired).not.toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleOptional).not.toBeChecked();
    });

    await user.click(networkServiceLineRuleRequired);
    await waitFor(() => {
      expect(networkServiceLineRuleRequired).toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleDisabled).not.toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleOptional).not.toBeChecked();
    });

    await user.click(networkServiceLineRuleOptional);
    await waitFor(() => {
      expect(networkServiceLineRuleOptional).toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleRequired).not.toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleDisabled).not.toBeChecked();
    });
  });

  it('should reset credit card rules changes', async () => {
    const { user } = setup();

    const cancelButton = getCancelButton();
    const serviceLine = mockedNetworkServiceLines[0];
    await findAllServiceLineCreditCardRules();

    const networkServiceLineRuleOptional =
      getServiceLineCreditCardRulesOptionRadioInput(
        serviceLine.id,
        NetworkCreditCardRules.optional
      );
    const networkServiceLineRuleRequired =
      getServiceLineCreditCardRulesOptionRadioInput(
        serviceLine.id,
        NetworkCreditCardRules.required
      );
    const networkServiceLineRuleDisabled =
      getServiceLineCreditCardRulesOptionRadioInput(
        serviceLine.id,
        NetworkCreditCardRules.disabled
      );

    expect(networkServiceLineRuleOptional).toBeChecked();
    expect(networkServiceLineRuleRequired).not.toBeChecked();
    expect(networkServiceLineRuleDisabled).not.toBeChecked();

    await user.click(networkServiceLineRuleDisabled);

    await waitFor(() => {
      expect(networkServiceLineRuleDisabled).toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleOptional).not.toBeChecked();
    });

    await user.click(cancelButton);

    await waitFor(() => {
      expect(networkServiceLineRuleDisabled).not.toBeChecked();
    });
    await waitFor(() => {
      expect(networkServiceLineRuleOptional).toBeChecked();
    });
  });

  it('should submit credit card rules', async () => {
    const { user } = setup();

    const submitButton = getSubmitButton();
    const serviceLine = mockedNetworkServiceLines[0];
    await findAllServiceLineCreditCardRules();

    const networkServiceLineRuleRequired =
      getServiceLineCreditCardRulesOptionRadioInput(
        serviceLine.id,
        NetworkCreditCardRules.required
      );

    expect(networkServiceLineRuleRequired).not.toBeChecked();

    await user.click(networkServiceLineRuleRequired);

    await waitFor(() => {
      expect(networkServiceLineRuleRequired).toBeChecked();
    });

    await user.click(submitButton);

    const alert = await findNotificationAlert();
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent(
      DEFAULT_NOTIFICATION_MESSAGES.NETWORK_CREDIT_CARD_RULES_SUCCESS
    );
  });

  it.each([
    {
      errorResponse: { message: mockErrorMessage },
      expectedAlertMessage: mockErrorMessage,
    },
    {
      errorResponse: {},
      expectedAlertMessage:
        DEFAULT_NOTIFICATION_MESSAGES.NETWORK_CREDIT_CARD_RULES_ERROR,
    },
  ])(
    'should fail to update credit card rules and will display error message',
    async ({ errorResponse, expectedAlertMessage }) => {
      mswServer.use(
        rest.patch(
          `${environment.serviceURL}${buildNetworkCreditCardRulesPath(
            ':networkId'
          )}`,
          (_req, res, ctx) => {
            return res.once(ctx.status(400), ctx.json(errorResponse));
          }
        )
      );
      const { user } = setup();

      const submitButton = getSubmitButton();
      const serviceLine = mockedNetworkServiceLines[0];
      await findAllServiceLineCreditCardRules();

      const networkServiceLineRuleRequired =
        getServiceLineCreditCardRulesOptionRadioInput(
          serviceLine.id,
          NetworkCreditCardRules.required
        );

      expect(networkServiceLineRuleRequired).not.toBeChecked();

      await user.click(networkServiceLineRuleRequired);

      await waitFor(() => {
        expect(networkServiceLineRuleRequired).toBeChecked();
      });

      await user.click(submitButton);

      const alert = await findNotificationAlert();
      expect(alert).toBeVisible();
      expect(alert).toHaveTextContent(expectedAlertMessage);
    }
  );

  it('should render properly for real only state', async () => {
    const { store } = setup(true);

    await findAllServiceLineCreditCardRules();

    const disabledAlert = getServiceLineCreditCardRulesAlert(
      mockedServiceLineWithDisabledRules.id
    );
    expect(disabledAlert).toBeVisible();

    const networkCreditCardRules = selectNetworkCreditCardRules(
      store.getState()
    );
    networkCreditCardRules.forEach((rule) => {
      const radioOption = getServiceLineCreditCardRulesOptionRadioInput(
        rule.serviceLineId,
        rule.creditCardRule
      );

      expect(radioOption).toBeInTheDocument();
      expect(radioOption).toBeDisabled();
    });
  });
});
