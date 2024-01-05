import {
  CompanionEnvironment,
  COMPANION_DATADOG_APPLICATION_ID,
  COMPANION_DATADOG_CLIENT_TOKEN,
} from './environment.base';

export const environment: CompanionEnvironment = {
  production: false,
  companionApiUrl: 'https://companion-api-prod.*company-data-covered*.com',
  datadogAppId: COMPANION_DATADOG_APPLICATION_ID,
  datadogClientToken: COMPANION_DATADOG_CLIENT_TOKEN,
  datadogEnv: 'production',
  statsigClientId: 'client-8J2i38QvEF89kwyySxxaW3Z6Scy8bdGdmWNH07yLFLa',
  statsigTier: 'production',
};
