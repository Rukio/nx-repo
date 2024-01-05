import { render, screen, waitFor, within } from '../../../testUtils';
import NetworksCreditCardRulesForm, {
  NetworksCreditCardRulesFormProps,
  ServiceLineCreditCardRule,
  CreditCardRuleOption,
} from './NetworksCreditCardRulesForm';
import { NETWORKS_CREDIT_CARD_RULES_TEST_IDS } from './testIds';

const mockedRuleValues = {
  optional: 'OPTIONAL',
  required: 'REQUIRED',
  disabled: 'DISABLED',
};

const mockedCreditCardRules: CreditCardRuleOption[] = [
  {
    label: 'Credit card is',
    displayedValue: 'optional',
    value: mockedRuleValues.optional,
  },
  {
    label: 'Credit card is',
    displayedValue: 'required',
    value: mockedRuleValues.required,
  },
  {
    label: 'Do not ask',
    value: mockedRuleValues.disabled,
  },
];

const mockedServiceLineRules: ServiceLineCreditCardRule[] = [
  {
    serviceLineId: '1',
    serviceLineName: 'Acute Care',
    creditCardRule: mockedRuleValues.optional,
  },
  {
    serviceLineId: '2',
    serviceLineName: 'Advanced Care',
    creditCardRule: mockedRuleValues.required,
  },
  {
    serviceLineId: '3',
    serviceLineName: '911',
    creditCardRule: mockedRuleValues.disabled,
  },
  {
    serviceLineId: '4',
    serviceLineName: 'Bridge Care',
    disabled: true,
  },
];

const mockedNetworksCreditCardRulesProps: NetworksCreditCardRulesFormProps = {
  serviceLineRules: mockedServiceLineRules,
  creditCardRules: mockedCreditCardRules,
  onChangeCreditCardRule: vi.fn(),
  isDisabled: false,
};

const getServiceLineRule = (serviceLineId: string) =>
  screen.getByTestId(
    NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineTestId(serviceLineId)
  );

const getServiceLineRuleOptions = (serviceLineId: string) => {
  const serviceLineOptionOptional = within(
    screen.getByTestId(
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineOptionTestId(
        serviceLineId,
        mockedRuleValues.optional
      )
    )
  ).getByRole('radio');

  const serviceLineOptionRequired = within(
    screen.getByTestId(
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineOptionTestId(
        serviceLineId,
        mockedRuleValues.required
      )
    )
  ).getByRole('radio');

  const serviceLineOptionDoNotAsk = within(
    screen.getByTestId(
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineOptionTestId(
        serviceLineId,
        mockedRuleValues.disabled
      )
    )
  ).getByRole('radio');

  return {
    optional: serviceLineOptionOptional,
    required: serviceLineOptionRequired,
    doNotAsk: serviceLineOptionDoNotAsk,
  };
};

const setup = (
  overrideProps: Partial<NetworksCreditCardRulesFormProps> = {}
) => {
  return render(
    <NetworksCreditCardRulesForm
      {...mockedNetworksCreditCardRulesProps}
      {...overrideProps}
    />
  );
};

describe('<NetworksCreditCardRulesForm />', () => {
  it('should render credit card rules form', () => {
    setup();

    expect(
      screen.getByTestId(NETWORKS_CREDIT_CARD_RULES_TEST_IDS.ROOT)
    ).toBeVisible();
  });

  it('should render credit card rules service line', () => {
    setup();
    const serviceLineRule =
      mockedNetworksCreditCardRulesProps.serviceLineRules[0];
    const serviceLineRuleComponent = getServiceLineRule(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleComponent).toBeVisible();
  });

  it('should render credit card rules service line options properly (optional is selected)', () => {
    setup();
    const serviceLineRule =
      mockedNetworksCreditCardRulesProps.serviceLineRules[0];
    const serviceLineRuleComponent = getServiceLineRule(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleComponent).toBeVisible();

    const serviceLineRuleOptions = getServiceLineRuleOptions(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleOptions.optional).toBeChecked();
    expect(serviceLineRuleOptions.required).not.toBeChecked();
    expect(serviceLineRuleOptions.doNotAsk).not.toBeChecked();
  });

  it('should render credit card rules service line options properly (required is selected)', () => {
    setup();
    const serviceLineRule =
      mockedNetworksCreditCardRulesProps.serviceLineRules[1];
    const serviceLineRuleComponent = getServiceLineRule(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleComponent).toBeVisible();

    const serviceLineRuleOptions = getServiceLineRuleOptions(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleOptions.optional).not.toBeChecked();
    expect(serviceLineRuleOptions.required).toBeChecked();
    expect(serviceLineRuleOptions.doNotAsk).not.toBeChecked();
  });

  it('should render credit card rules service line options properly (do not ask is selected)', () => {
    setup();
    const serviceLineRule =
      mockedNetworksCreditCardRulesProps.serviceLineRules[2];
    const serviceLineRuleComponent = getServiceLineRule(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleComponent).toBeVisible();

    const serviceLineRuleOptions = getServiceLineRuleOptions(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleOptions.optional).not.toBeChecked();
    expect(serviceLineRuleOptions.required).not.toBeChecked();
    expect(serviceLineRuleOptions.doNotAsk).toBeChecked();
  });

  it('should not render credit card rules service line option alert', () => {
    setup();
    const serviceLineRule =
      mockedNetworksCreditCardRulesProps.serviceLineRules[3];
    const serviceLineRuleComponent = getServiceLineRule(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleComponent).toBeVisible();

    const serviceLineRuleOptionAlertComponent = within(
      serviceLineRuleComponent
    ).getByTestId(
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineAlertTestId(
        serviceLineRule.serviceLineId
      )
    );

    expect(serviceLineRuleOptionAlertComponent).toBeVisible();
  });

  it('should change credit card rule for service line', async () => {
    const { user } = setup();

    const serviceLineRule =
      mockedNetworksCreditCardRulesProps.serviceLineRules[0];

    const serviceLineRuleOptions = getServiceLineRuleOptions(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleOptions.optional).toBeChecked();

    await user.click(serviceLineRuleOptions.required);

    await waitFor(() => {
      expect(
        mockedNetworksCreditCardRulesProps.onChangeCreditCardRule
      ).toBeCalledWith(
        serviceLineRule.serviceLineId,
        mockedRuleValues.required
      );
    });
  });

  it('should render credit card rules disabled state', () => {
    setup({ isDisabled: true });
    const serviceLineRule =
      mockedNetworksCreditCardRulesProps.serviceLineRules[0];
    const serviceLineRuleComponent = getServiceLineRule(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleComponent).toBeVisible();

    const serviceLineRuleOptions = getServiceLineRuleOptions(
      serviceLineRule.serviceLineId
    );

    expect(serviceLineRuleOptions.optional).toBeChecked();
    expect(serviceLineRuleOptions.optional).toBeDisabled();

    expect(serviceLineRuleOptions.required).not.toBeChecked();
    expect(serviceLineRuleOptions.required).toBeDisabled();

    expect(serviceLineRuleOptions.doNotAsk).not.toBeChecked();
    expect(serviceLineRuleOptions.doNotAsk).toBeDisabled();
  });
});
