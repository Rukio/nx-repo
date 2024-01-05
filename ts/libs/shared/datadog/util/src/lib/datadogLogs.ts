import { datadogLogs, LogsInitConfiguration } from '@datadog/browser-logs';
import {
  generateFuncFailMessage,
  generateServiceInitFailMessage,
  ServiceName,
} from '../util/messageFactory';
import { withDatadogEnabledCheck } from './configuration';

export const initDatadogLogs = (params: LogsInitConfiguration) => {
  const { env } = params;
  withDatadogEnabledCheck({ env }, () => {
    try {
      datadogLogs.init(params);
    } catch (error) {
      console.error(
        generateServiceInitFailMessage(ServiceName.DATADOG_LOGS),
        error
      );
    }
  });
};

export const logError = (
  message: string,
  messageContext?: Record<string, unknown>
) => {
  const { env } = datadogLogs.getInitConfiguration() ?? {};
  withDatadogEnabledCheck({ env }, () => {
    try {
      datadogLogs.logger.error(message, messageContext);
    } catch (error) {
      console.error(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logError'),
        error
      );
    }
  });
};

export const logInfo = (
  message: string,
  messageContext?: Record<string, unknown>
) => {
  const { env } = datadogLogs.getInitConfiguration() ?? {};
  withDatadogEnabledCheck({ env }, () => {
    try {
      datadogLogs.logger.info(message, messageContext);
    } catch (error) {
      console.error(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logInfo'),
        error
      );
    }
  });
};

export const logWarn = (
  message: string,
  messageContext?: Record<string, unknown>
) => {
  const { env } = datadogLogs.getInitConfiguration() ?? {};
  withDatadogEnabledCheck({ env }, () => {
    try {
      datadogLogs.logger.warn(message, messageContext);
    } catch (error) {
      console.error(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logWarn'),
        error
      );
    }
  });
};

export const logDebug = (
  message: string,
  messageContext?: Record<string, unknown>
) => {
  const { env } = datadogLogs.getInitConfiguration() ?? {};
  withDatadogEnabledCheck({ env }, () => {
    try {
      datadogLogs.logger.debug(message, messageContext);
    } catch (error) {
      console.error(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logDebug'),
        error
      );
    }
  });
};
