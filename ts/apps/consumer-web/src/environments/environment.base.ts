export type ConsumerWebEnvironment = {
  production: boolean;
  statsigClientKey: string;
  statsigTier: string;
  datadogApplicationId: string;
  datadogClientToken: string;
  datadogEnvironment: 'development' | 'qa' | 'uat' | 'production';
  googleMapsKey: string;
  googleTagManagerId: string;
  googleRecaptchaKey: string;
  mainSiteURL: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  segmentWriteKey: string;
  dispatcherLinePhoneNumber: string;
};
