const networksCreditCardRulesPrefixText = 'networks-credit-card-rules';
const networksCreditCardRulesServiceLinesPrefixText = `${networksCreditCardRulesPrefixText}-service-lines`;

export const NETWORKS_CREDIT_CARD_RULES_TEST_IDS = {
  ROOT: `${networksCreditCardRulesPrefixText}-root`,
  SERVICE_LINE_PREFIX: networksCreditCardRulesServiceLinesPrefixText,
  getServiceLineTestId: (serviceLineId: string) =>
    `${networksCreditCardRulesServiceLinesPrefixText}-${serviceLineId}`,
  getServiceLineAlertTestId: (serviceLineId: string) =>
    `${networksCreditCardRulesServiceLinesPrefixText}-${serviceLineId}-alert`,
  getServiceLineOptionTestId: (serviceLineId: string, optionValue: string) =>
    `${networksCreditCardRulesServiceLinesPrefixText}-${serviceLineId}-option-${optionValue}`,
};
