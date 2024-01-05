import { LogsInitConfiguration, datadogLogs } from '@datadog/browser-logs';
import {
  initDatadogLogs,
  logDebug,
  logError,
  logInfo,
  logWarn,
} from './datadogLogs';
import {
  generateFuncFailMessage,
  generateServiceInitFailMessage,
  ServiceName,
} from '../util/messageFactory';
import { InitConfiguration } from '@datadog/browser-core';

const mockedConsoleError = vi.mocked(console.error);

vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    init: vi.fn(),
    logger: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
    getInitConfiguration: vi.fn(),
  },
}));

const mockedLoggerInit = vi.mocked(datadogLogs.init);
const mockedLoggerError = vi.mocked(datadogLogs.logger.error);
const mockedLoggerInfo = vi.mocked(datadogLogs.logger.info);
const mockedLoggerWarn = vi.mocked(datadogLogs.logger.warn);
const mockedLoggerDebug = vi.mocked(datadogLogs.logger.debug);
const mockedGetInitConfiguration = vi.mocked(datadogLogs.getInitConfiguration);

const datadogLogsParams: LogsInitConfiguration = {
  site: 'mock site',
  service: 'mock service',
  env: 'mock env',
  forwardErrorsToLogs: true,
  clientToken: 'mock clientToken',
  sampleRate: 100,
};

const overrideGetInitConfigurationReturn = (
  value: Partial<InitConfiguration> = {}
) => {
  mockedGetInitConfiguration.mockReturnValue({
    ...datadogLogsParams,
    ...value,
  });
};

describe('Data logs service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default params the browser logs service', () => {
      initDatadogLogs(datadogLogsParams);
      expect(datadogLogs.init).toBeCalledWith(datadogLogsParams);
      expect(datadogLogs.init).toBeCalledTimes(1);
    });

    it('should call console error if init failed', () => {
      mockedLoggerInit.mockImplementation(() => {
        throw new Error('Mocked error');
      });
      initDatadogLogs(datadogLogsParams);
      expect(mockedConsoleError).toBeCalledWith(
        generateServiceInitFailMessage(ServiceName.DATADOG_LOGS),
        new Error('Mocked error')
      );
    });

    it('should not init in development', () => {
      initDatadogLogs({ ...datadogLogsParams, env: 'development' });
      expect(mockedLoggerInit).toHaveBeenCalledTimes(0);
    });
  });

  describe('logError', () => {
    it('should track error', () => {
      logError('Mock error message', { mock: 'message' });
      expect(datadogLogs.logger.error).toBeCalledTimes(1);
      expect(datadogLogs.logger.error).toBeCalledWith('Mock error message', {
        mock: 'message',
      });
    });

    it('should call console error if failed', () => {
      mockedLoggerError.mockImplementation(() => {
        throw new Error('Mocked error');
      });
      logError('Mock error message', { mock: 'message' });
      expect(mockedConsoleError).toBeCalledWith(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logError'),
        new Error('Mocked error')
      );
    });

    it('should not be called in development', () => {
      overrideGetInitConfigurationReturn({
        ...datadogLogsParams,
        env: 'development',
      });
      logError('Mock error message', { mock: 'message' });
      expect(datadogLogs.logger.error).toHaveBeenCalledTimes(0);
      expect(mockedConsoleError).toHaveBeenCalledTimes(0);
    });
  });

  describe('logInfo', () => {
    it('should track info', () => {
      logInfo('Mock info message', { mock: 'message' });
      expect(datadogLogs.logger.info).toBeCalledTimes(1);
      expect(datadogLogs.logger.info).toBeCalledWith('Mock info message', {
        mock: 'message',
      });
    });

    it('should call console error if failed', () => {
      mockedLoggerInfo.mockImplementation(() => {
        throw new Error('Mocked error');
      });
      logInfo('Mock info message', { mock: 'message' });

      expect(mockedConsoleError).toBeCalledWith(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logInfo'),
        new Error('Mocked error')
      );
    });

    it('should not be called in development', () => {
      overrideGetInitConfigurationReturn({
        ...datadogLogsParams,
        env: 'development',
      });
      logInfo('Mock info message', { mock: 'message' });
      expect(datadogLogs.logger.info).toHaveBeenCalledTimes(0);
      expect(mockedConsoleError).toHaveBeenCalledTimes(0);
    });
  });

  describe('logDebug', () => {
    it('should track debug', () => {
      logDebug('Mock debug message', { mock: 'message' });
      expect(datadogLogs.logger.debug).toBeCalledTimes(1);
      expect(datadogLogs.logger.debug).toBeCalledWith('Mock debug message', {
        mock: 'message',
      });
    });

    it('should call console error if failed', () => {
      mockedLoggerDebug.mockImplementation(() => {
        throw new Error('Mocked error');
      });
      logDebug('Mock debug message', { mock: 'message' });
      expect(mockedConsoleError).toBeCalledWith(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logDebug'),
        new Error('Mocked error')
      );
    });

    it('should not be called in development', () => {
      overrideGetInitConfigurationReturn({
        ...datadogLogsParams,
        env: 'development',
      });
      logDebug('Mock debug message', { mock: 'message' });
      expect(datadogLogs.logger.debug).toHaveBeenCalledTimes(0);
      expect(mockedConsoleError).toHaveBeenCalledTimes(0);
    });
  });

  describe('logWarn', () => {
    it('should track warn', () => {
      logWarn('Mock warn message', { mock: 'message' });
      expect(datadogLogs.logger.warn).toBeCalledTimes(1);
      expect(datadogLogs.logger.warn).toBeCalledWith('Mock warn message', {
        mock: 'message',
      });
    });

    it('should call console error if failed', () => {
      mockedLoggerWarn.mockImplementation(() => {
        throw new Error('Mocked error');
      });
      logWarn('Mock warn message', { mock: 'message' });
      expect(mockedConsoleError).toBeCalledWith(
        generateFuncFailMessage(ServiceName.DATADOG_LOGS, 'logWarn'),
        new Error('Mocked error')
      );
    });

    it('should not be called in development', () => {
      overrideGetInitConfigurationReturn({
        ...datadogLogsParams,
        env: 'development',
      });
      logWarn('Mock warn message', { mock: 'message' });
      expect(datadogLogs.logger.warn).toHaveBeenCalledTimes(0);
      expect(mockedConsoleError).toHaveBeenCalledTimes(0);
    });
  });
});
