import {
  CompanionEnvironment,
  COMPANION_DATADOG_APPLICATION_ID,
  COMPANION_DATADOG_CLIENT_TOKEN,
} from './environment.base';

export const environment: CompanionEnvironment = {
  production: false,
  companionApiUrl: 'https://companion-api-uat.*company-data-covered*.com',
  datadogAppId: COMPANION_DATADOG_APPLICATION_ID,
  datadogClientToken: COMPANION_DATADOG_CLIENT_TOKEN,
  datadogEnv: 'uat',
  statsigClientId: 'client-Czfy0bRHxlvRUcHBZ1DRjLMoGMqQr7WimE59SwgD4CJ',
  statsigTier: 'uat',
};
