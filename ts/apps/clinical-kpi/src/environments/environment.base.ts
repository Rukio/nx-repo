export type ClinicalKPIEnvironment = {
  production: boolean;
  stationURL: string;
  auth0Domain: string;
  auth0Audience: string;
  auth0ClientId: string;
  statsigClientKey: string;
  statsigTier: string;
  datadogApplicationId: string;
  datadogClientToken: string;
  datadogEnvironment: 'development' | 'qa' | 'uat' | 'production';
};
