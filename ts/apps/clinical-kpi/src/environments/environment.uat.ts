import { ClinicalKPIEnvironment } from './environment.base';

export const environment: ClinicalKPIEnvironment = {
  production: true,
  stationURL: 'https://uat.*company-data-covered*.com/',
  auth0Domain: 'dispatch-uat.us.auth0.com',
  auth0Audience: 'internal.*company-data-covered*.com',
  auth0ClientId: 'TcD4VBbip7zUtZrBeCgKnFjQjkZZ2mbW',
  statsigClientKey: 'client-FWJJtvtaJ5Pkki0v9x4U5gsURDiTDodYUEAuXhLEKu2',
  statsigTier: 'uat',
  datadogApplicationId: 'dacc30dd-49bf-441a-b633-2771f801d618',
  datadogClientToken: 'pub1f5e0ea7cae0554165ac74a3ce93b1d2',
  datadogEnvironment: 'uat',
};
