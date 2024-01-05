import { RumInitConfiguration, datadogRum } from '@datadog/browser-rum';
import { initDatadogRum, setUser } from './datadogRum';
import {
  generateFuncFailMessage,
  generateServiceInitFailMessage,
  ServiceName,
} from '../util/messageFactory';
import { User as DatadogUser, InitConfiguration } from '@datadog/browser-core';

const mockedConsoleError = vi.mocked(console.error);

vi.mock('@datadog/browser-rum', () => ({
  datadogRum: {
    init: vi.fn(),
    startSessionReplayRecording: vi.fn(),
    setUser: vi.fn(),
    getInitConfiguration: vi.fn(),
  },
}));

const mockedInit = vi.mocked(datadogRum.init);
const mockedSetUser = vi.mocked(datadogRum.setUser);
const mockedGetInitConfiguration = vi.mocked(datadogRum.getInitConfiguration);

const datadogRumParams: RumInitConfiguration = {
  site: 'mock site',
  service: 'mock service',
  env: 'mock env',
  applicationId: 'mock applicationId',
  clientToken: 'mock clientToken',
  sampleRate: 100,
  trackInteractions: true,
};

const overrideGetInitConfigurationReturn = (
  value: Partial<InitConfiguration> = {}
) => {
  mockedGetInitConfiguration.mockReturnValue({
    ...datadogRumParams,
    ...value,
  });
};

const setUserParams: DatadogUser = {
  id: 'mock id',
  email: 'mock@email.com',
  name: 'Mock NAme',
};

describe('DataRum service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default params the browser rum service', () => {
      initDatadogRum(datadogRumParams);
      expect(datadogRum.init).toBeCalledWith(datadogRumParams);
      expect(datadogRum.init).toBeCalledTimes(1);
      expect(datadogRum.startSessionReplayRecording).toBeCalledTimes(1);
    });

    it('should call console.error when error is caught', () => {
      mockedInit.mockImplementation(() => {
        throw new Error('Mocked error');
      });
      initDatadogRum(datadogRumParams);
      expect(mockedConsoleError).toBeCalledWith(
        generateServiceInitFailMessage(ServiceName.DATADOG_RUM),
        new Error('Mocked error')
      );
      expect(datadogRum.startSessionReplayRecording).not.toBeCalled();
    });

    it('should not init in development', () => {
      initDatadogRum({ ...datadogRumParams, env: 'development' });
      expect(mockedInit).toHaveBeenCalledTimes(0);
    });
  });

  describe('setUser', () => {
    it('should set user', () => {
      setUser(setUserParams);
      expect(datadogRum.setUser).toBeCalledWith(setUserParams);
      expect(datadogRum.setUser).toBeCalledTimes(1);
    });

    it('should call console error if failed', () => {
      mockedSetUser.mockImplementation(() => {
        throw new Error('Mocked error');
      });
      setUser(setUserParams);
      expect(mockedConsoleError).toBeCalledWith(
        generateFuncFailMessage(ServiceName.DATADOG_RUM, 'setUser'),
        new Error('Mocked error')
      );
    });

    it('should not be called in development', () => {
      overrideGetInitConfigurationReturn({
        env: 'development',
      });
      setUser(setUserParams);
      expect(datadogRum.setUser).toHaveBeenCalledTimes(0);
      expect(mockedConsoleError).toHaveBeenCalledTimes(0);
    });
  });
});
