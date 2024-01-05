export const COMPANION_DATADOG_APPLICATION_ID =
  '8f7d38ee-728f-4c3a-819f-0d72f8839e94';
export const COMPANION_DATADOG_CLIENT_TOKEN =
  'pub49e704c9d136417498813ab8b2afb333';

export type CompanionEnvironment = {
  production: boolean;
  companionApiUrl: string;
  datadogAppId: string;
  datadogClientToken: string;
  datadogEnv: string;
  statsigClientId: string;
  statsigTier: string;
};
