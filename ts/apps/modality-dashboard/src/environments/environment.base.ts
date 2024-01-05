type StatsigTier = 'development' | 'qa' | 'uat' | 'production';

export type ModalityDashboardEnvironment = {
  production: boolean;
  stationURL: string;
  auth0ClientId: string;
  auth0Domain: string;
  auth0Audience: string;
  statsigClientKey: string;
  statsigTier: StatsigTier;
};
