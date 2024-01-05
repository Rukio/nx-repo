const selectServiceLineOptionPrefixText =
  'markets-configuration-service-line-select-option';

export const MARKETS_CONFIGURATION_TEST_IDS = {
  SERVICE_LINE_SELECT: 'markets-configuration-service-line-select',
  SELECT_SERVICE_LINE_OPTION_PREFIX: selectServiceLineOptionPrefixText,
  getServiceLineOptionTestId: (serviceLineId: number) =>
    `${selectServiceLineOptionPrefixText}-${serviceLineId}`,
};
