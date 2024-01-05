import { RumInitConfiguration, datadogRum } from '@datadog/browser-rum';

const RUM_SERVICE_NAME = 'caremanager';

export const initDatadogRum = (
  options: Pick<
    RumInitConfiguration,
    'applicationId' | 'clientToken' | 'sessionSampleRate' | 'env'
  >
) => {
  try {
    datadogRum.init({
      applicationId: options.applicationId,
      clientToken: options.clientToken,
      site: 'datadoghq.com',
      service: RUM_SERVICE_NAME,
      sessionSampleRate: options.sessionSampleRate,
      sessionReplaySampleRate: 20,
      trackInteractions: true,
      env: options.env,
    });
    datadogRum.startSessionReplayRecording();
  } catch (err) {
    console.error("Datadog RUM wasn't initialised because of error: ", err);
  }
};
