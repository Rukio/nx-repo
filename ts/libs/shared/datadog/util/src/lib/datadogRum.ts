import { datadogRum, RumInitConfiguration } from '@datadog/browser-rum';
import { User } from '@datadog/browser-core';
import {
  generateFuncFailMessage,
  generateServiceInitFailMessage,
  ServiceName,
} from '../util/messageFactory';
import { withDatadogEnabledCheck } from './configuration';

export const initDatadogRum = (params: RumInitConfiguration) => {
  const { env } = params;
  withDatadogEnabledCheck({ env }, () => {
    try {
      datadogRum.init(params);
      datadogRum.startSessionReplayRecording();
    } catch (error) {
      console.error(
        generateServiceInitFailMessage(ServiceName.DATADOG_RUM),
        error
      );
    }
  });
};

export const setUser = (params: User) => {
  const { env } = datadogRum.getInitConfiguration() ?? {};
  withDatadogEnabledCheck({ env }, () => {
    try {
      datadogRum.setUser(params);
    } catch (error) {
      console.error(
        generateFuncFailMessage(ServiceName.DATADOG_RUM, 'setUser'),
        error
      );
    }
  });
};
