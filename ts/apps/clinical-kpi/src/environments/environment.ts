import { ClinicalKPIEnvironment } from './environment.base';

export const environment: ClinicalKPIEnvironment = {
  production: false,
  stationURL: 'https://qa.*company-data-covered*.com/',
  auth0Domain: 'staging-auth.*company-data-covered*.com',
  auth0Audience: 'internal.*company-data-covered*.com',
  auth0ClientId: 'jwdBIvE9iZj9ODuSBd8kbqjcXb9S1gQ4',
  statsigClientKey: 'client-wQHgyJwKCkbJVxVItgwrQGfaxk7hglbFBSB7YuhZl5z',
  statsigTier: 'development',
  datadogApplicationId: 'dacc30dd-49bf-441a-b633-2771f801d618',
  datadogClientToken: 'pub1f5e0ea7cae0554165ac74a3ce93b1d2',
  datadogEnvironment: 'development',
};
