export const networksBillingCitiesStatePrefixText =
  'networks-billing-cities-state';
export const networksBillingCitiesStateModalityPrefix = 'modality-item';

export const NETWORKS_BILLING_CITIES_STATES_TEST_IDS = {
  ROOT: 'networks-billing-cities-states-root',
  getStateTestId: (stateId: string) =>
    `${networksBillingCitiesStatePrefixText}-${stateId}`,
  getStateExpandedArrowTestId: (stateId: string) =>
    `${networksBillingCitiesStatePrefixText}-${stateId}-expanded-arrow`,
  getStateActiveChip: (stateId: string) =>
    `${networksBillingCitiesStatePrefixText}-${stateId}-active-chip`,
  getStateCollapsedArrowTestId: (stateId: string) =>
    `${networksBillingCitiesStatePrefixText}-${stateId}-collapsed-arrow`,
  getBillingCityTestId: (stateId: string, billingCityId: string) =>
    `${networksBillingCitiesStatePrefixText}-${stateId}-billing-city-${billingCityId}`,
  getServiceLineTestId: (
    stateId: string,
    billingCityId: string,
    serviceLineId: string
  ) =>
    `${networksBillingCitiesStatePrefixText}-${stateId}-billing-city-${billingCityId}-service-line-${serviceLineId}`,
  getModalityTestId: (
    stateId: string,
    billingCityId: string,
    serviceLineId: string,
    modalityId: string
  ) =>
    `${networksBillingCitiesStatePrefixText}-${networksBillingCitiesStateModalityPrefix}-state-${stateId}-billing-city-${billingCityId}-service-line-${serviceLineId}-modality-${modalityId}`,
};
