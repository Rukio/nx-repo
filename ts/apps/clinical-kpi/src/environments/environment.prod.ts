import { ClinicalKPIEnvironment } from './environment.base';

export const environment: ClinicalKPIEnvironment = {
  production: true,
  stationURL: 'https://admin.*company-data-covered*.com/',
  auth0Domain: 'auth.*company-data-covered*.com',
  auth0Audience: 'internal.*company-data-covered*.com',
  auth0ClientId: 'onOW70ihQJ3JOKPKx5MSY7aSTznithTg',
  statsigClientKey: 'client-heX0sQN8B3HKxmUUkInqqdtYEy8cENb38GlCFVjF6Cn',
  statsigTier: 'production',
  datadogApplicationId: 'dacc30dd-49bf-441a-b633-2771f801d618',
  datadogClientToken: 'pub1f5e0ea7cae0554165ac74a3ce93b1d2',
  datadogEnvironment: 'production',
};
