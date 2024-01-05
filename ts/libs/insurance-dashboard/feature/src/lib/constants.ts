export const INSURANCE_DASHBOARD_ROUTES = {
  PAYER_CREATE: '/payers/create',
  PAYERS: '/payers',
  HOME: '/',
  PAYERS_DETAILS: '/payers/:payerId',
  PAYERS_NETWORKS: '/payers/:payerId/networks',
  PAYERS_NETWORKS_CREATE: '/payers/:payerId/networks/create',
  PAYERS_NETWORKS_DETAILS: '/payers/:payerId/networks/:networkId',
  PAYERS_NETWORKS_CREDIT_CARD:
    '/payers/:payerId/networks/:networkId/credit-card',
  PAYERS_NETWORKS_BILLING_CITIES:
    '/payers/:payerId/networks/:networkId/billing-cities',
  PAYERS_NETWORKS_APPOINTMENT_TYPES:
    '/payers/:payerId/networks/:networkId/appointment-types',
  getPayerDetailsTabPath: (payerId: string | number) => `/payers/${payerId}`,
  getPayerNetworksTabPath: (payerId: string | number) =>
    `/payers/${payerId}/networks`,
  getPayerNetworksCreatePath: (payerId: string | number) =>
    `/payers/${payerId}/networks/create`,
  getNetworkDetailsTabPath: (
    payerId: string | number,
    networkId: string | number
  ) => `/payers/${payerId}/networks/${networkId}`,
  getNetworkCreditCardTabPath: (
    payerId: string | number,
    networkId: string | number
  ) => `/payers/${payerId}/networks/${networkId}/credit-card`,
  getNetworkBillingCitiesTabPath: (
    payerId: string | number,
    networkId: string | number
  ) => `/payers/${payerId}/networks/${networkId}/billing-cities`,
  getNetworkAppointmentTypeTabPath: (
    payerId: string | number,
    networkId: string | number
  ) => `/payers/${payerId}/networks/${networkId}/appointment-types`,
};

export type PayerPathParams = 'payerId';

export type PayerNetworkPathParams = 'payerId' | 'networkId';

export const DEFAULT_NOTIFICATION_MESSAGES = {
  PAYER_CREATE_SUCCESS: 'Payer created',
  PAYER_EDIT_SUCCESS: 'Payer details saved',
  PAYER_CREATE_ERROR: 'Unable to save payer. Please try again.',
  PAYER_EDIT_ERROR: 'Unable to save payer details. Please try again.',
  PAYER_NETWORK_CREATE_SUCCESS: 'Network created',
  PAYER_NETWORK_CREATE_ERROR: 'Unable to save network. Please try again.',
  PAYER_NETWORK_UPDATE_SUCCESS: 'Network details saved.',
  PAYER_NETWORK_UPDATE_ERROR:
    'Unable to save network details. Please try again.',
  NETWORK_CREDIT_CARD_RULES_SUCCESS: 'Credit card rules saved.',
  NETWORK_CREDIT_CARD_RULES_ERROR:
    'Unable to save credit card rules. Please try again.',
  BILLING_CITY_EDIT_SUCCESS: 'Billing City configuration saved.',
  BILLING_CITY_EDIT_ERROR:
    'Unable to save billing city configuration. Please try again.',
  NETWORK_APPOINTMENT_TYPES_SUCCESS: 'Appointment Types saved.',
  NETWORK_APPOINTMENT_TYPES_ERROR:
    'Unable to save appointment types. Please try again.',
};

export const MAX_NETWORK_ADDRESSES_AMOUNT = 3;
