export const NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS = {
  ROOT: 'networks-billing-cities-filters-root',
  STATES_SELECT_CONTAINER:
    'networks-billing-cities-filters-states-select-container',
  STATES_SELECT: 'networks-billing-cities-filters-states-select',
  SERVICE_LINES_SELECT_CONTAINER:
    'networks-billing-cities-filters-service-lines-select-container',
  SERVICE_LINES_SELECT: 'networks-billing-cities-filters-service-lines-select',
  STATES_STATUS_SELECT_CONTAINER:
    'networks-billing-cities-filters-states-status-select',
  STATES_STATUS_SELECT: 'networks-billing-cities-filters-states-status',
  RESET_FILTERS_BUTTON: 'networks-billing-cities-filters-reset-filters-button',
  getStatesSelectOptionTestId: (optionId: string) =>
    `networks-billing-cities-filters-states-select-option-${optionId}`,
  getStatesStatusSelectOptionTestId: (statusType: string) =>
    `networks-billing-cities-filters-states-status-select-option-${statusType}`,
  getServiceLinesSelectOptionTestId: (optionId: string) =>
    `networks-billing-cities-filters-service-lines-select-option-${optionId}`,
};
