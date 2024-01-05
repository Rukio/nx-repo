export enum SessionStorageKeys {
  PreferredEtaStart = 'preferredEtaStart',
}

export enum QueryParamKeys {
  UtmCampaign = 'utm_campaign',
}

export const WEB_REQUEST_ROUTES = {
  requestContact: '/request-contact-info',
  requestAddress: '/request-address',
  requestCareFor: '/request-care-for',
  requestPersonalInfo: '/request-personal-info',
  requestHelp: '/request-help',
  requestDetails: '/request-details',
  requestPreferredTime: '/request-preferred-time',
  howItWorks: '/how-it-works',
};

export const SYMPTOMS_DIVIDER = ' | ';

export const SYMPTOMS_COMMA_DIVIDER_REGEX = /, /g;
