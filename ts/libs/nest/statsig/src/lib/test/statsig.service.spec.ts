import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StatsigService } from '../statsig.service';
import { StatsigModule } from '../statsig.module';
import * as statsig from 'statsig-node';
import { mockDeep } from 'jest-mock-extended';

const mockDynamicConfig = { value: {} };

const initializeSpy = jest
  .spyOn(statsig, 'initialize')
  .mockImplementation(jest.fn());
const checkGateSpy = jest
  .spyOn(statsig, 'checkGate')
  .mockImplementation(jest.fn().mockResolvedValue(false));

const getConfigSpy = jest
  .spyOn(statsig, 'getConfig')
  .mockImplementation(jest.fn().mockResolvedValue(mockDynamicConfig));

const mockExperiment = mockDeep<statsig.DynamicConfig>({
  get: jest.fn().mockResolvedValue(true),
  value: {},
});

const getExperimentSpy = jest
  .spyOn(statsig, 'getExperiment')
  .mockResolvedValue(mockExperiment);

const shutdownSpy = jest
  .spyOn(statsig, 'shutdown')
  .mockImplementation(jest.fn());

describe(`${StatsigService.name}`, () => {
  let app: INestApplication;
  let statsigService: StatsigService;
  const user: statsig.StatsigUser = {
    userID: 'user-12345678',
  };

  beforeEach(() => {
    initializeSpy.mockClear();
    checkGateSpy.mockClear();
    getConfigSpy.mockClear();
    getExperimentSpy.mockClear();
    shutdownSpy.mockClear();
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        StatsigModule.forRoot({
          secretApiKey: 'secret-12345678',
          options: {},
          isGlobal: true,
        }),
      ],
    }).compile();

    statsigService = moduleRef.get<StatsigService>(StatsigService);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${StatsigService.prototype.checkGate.name}`, () => {
    it('returns false due the gate is off', async () => {
      const gateName = 'test_gate';
      const isGateOff = await statsigService.checkGate(user, gateName);
      expect(isGateOff).toBeFalsy();
      expect(statsig.checkGate).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.getConfig.name}`, () => {
    it('should return an empty gate configuration', async () => {
      const configName = 'test_config';
      const config = await statsigService.getConfig(user, configName);
      expect(config.value).toEqual({} as statsig.DynamicConfig);
      expect(statsig.getConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.getExperiment.name}`, () => {
    it('should return an empty experiment', async () => {
      const experimentName = 'test_experiment';
      const experiment = await statsigService.getExperiment(
        user,
        experimentName
      );
      expect(experiment.value).toMatchObject({});
      expect(statsig.getExperiment).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.shutdown.name}`, () => {
    it('should shutdown statsig server client', async () => {
      expect(statsigService.shutdown()).toBeUndefined();
      expect(statsig.shutdown).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.logEvent.name}`, () => {
    it('should log a statsig event', async () => {
      const eventValue = 100;
      const metadata = {
        completed_task_count: '1',
        total_task_count: '2',
      };
      await statsigService.logEvent(user, 'Event Name', eventValue, metadata);
      expect(statsig.logEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.experimentIsEnabled.name}`, () => {
    it('should check if experiment is enabled', async () => {
      const experimentName = 'experiment';
      const isEnabled = await statsigService.experimentIsEnabled(
        user,
        experimentName
      );
      expect(isEnabled).toEqual(true);
      expect(statsig.getExperiment).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.getExperimentParameter.name}`, () => {
    it('should get an experiment param value by param key', async () => {
      const experimentName = 'experiment';
      const paramKey = 'enabled';
      const experimentParamValue = await statsigService.getExperimentParameter(
        user,
        experimentName,
        paramKey
      );
      expect(experimentParamValue).toEqual(true);
      expect(statsig.getExperiment).toHaveBeenCalledTimes(1);
    });
  });
});
