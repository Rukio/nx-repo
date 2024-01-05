export const environment = {
  // App
  nodeEnv: import.meta.env.MODE,
  appStationUrl: import.meta.env.VITE_STATION_URL || 'stationurl',
  apiUrl: import.meta.env.VITE_API_URL || window.location.origin,
  statsigApiKey: import.meta.env.VITE_STATSIG_APIKEY,
  statsigEnvName: import.meta.env.VITE_STATSIG_ENV,
  statsigUserId: import.meta.env.VITE_STATSIG_USERID,
  segmentWriteKey: import.meta.env.VITE_SEGMENT_WRITE_KEY,

  // Auth
  auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN,
  auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE,

  // Datadog
  datadogAppId: import.meta.env.VITE_DATADOG_APP_ID,
  datadogClientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
  datadogSampleRate: import.meta.env.VITE_DATADOG_SAMPLE_RATE || '100',
};
