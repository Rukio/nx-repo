import { InitConfiguration } from '@datadog/browser-core';
import { StatsigOptions } from 'statsig-js';
import { SegmentProviderProps } from '@*company-data-covered*/segment/feature';
import { environment } from '../environments/environment';

export const datadogInitConfiguration: Omit<InitConfiguration, 'beforeSend'> = {
  clientToken: environment.datadogClientToken,
  env: environment.datadogEnvironment,
  site: 'datadoghq.com',
  service: 'web-request',
  sessionSampleRate: 100,
  trackResources: true,
  trackLongTasks: true,
};

export const statsigOptions: StatsigOptions = {
  environment: {
    tier: environment.statsigTier,
  },
};

export const segmentLoadOptions: SegmentProviderProps['loadOptions'] = {
  writeKey: environment.segmentWriteKey,
};
