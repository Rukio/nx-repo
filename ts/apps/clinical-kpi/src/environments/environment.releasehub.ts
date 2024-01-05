import { ClinicalKPIEnvironment } from './environment.base';

export const environment: ClinicalKPIEnvironment = {
  production: false,
  stationURL: process.env['NX_CLINICALKPI_DASHBOARD_STATION_URL'] ?? '',
  auth0Domain:
    process.env['NX_CLINICALKPI_DASHBOARD_AUTH0_DOMAIN'] ??
    'staging-auth.*company-data-covered*.com',
  auth0Audience:
    process.env['NX_CLINICALKPI_DASHBOARD_AUTH0_AUDIENCE'] ??
    'internal.*company-data-covered*.com',
  auth0ClientId:
    process.env['NX_CLINICALKPI_DASHBOARD_AUTH0_CLIENT_ID'] ??
    'jwdBIvE9iZj9ODuSBd8kbqjcXb9S1gQ4',
  statsigClientKey:
    process.env['NX_CLINICALKPI_DASHBOARD_STATSIG_CLIENT_KEY'] ??
    'client-wQHgyJwKCkbJVxVItgwrQGfaxk7hglbFBSB7YuhZl5z',
  statsigTier:
    process.env['NX_CLINICALKPI_DASHBOARD_AUTH0_STATSIG_TIER'] ?? 'development',
  datadogApplicationId: 'dacc30dd-49bf-441a-b633-2771f801d618',
  datadogClientToken: 'pub1f5e0ea7cae0554165ac74a3ce93b1d2',
  datadogEnvironment: 'development',
};
