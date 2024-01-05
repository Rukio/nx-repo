import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as statsig from 'statsig-node';
import StatsigService from '../statsig.service';
import StatsigModule from '../statsig.module';
import { STATSIG_TOKEN } from '../common';

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
const getExperimentSpy = jest
  .spyOn(statsig, 'getExperiment')
  .mockImplementation(jest.fn().mockResolvedValue(mockDynamicConfig));
const shutdownSpy = jest
  .spyOn(statsig, 'shutdown')
  .mockImplementation(jest.fn());

describe(`${StatsigService.name}`, () => {
  let app: INestApplication;
  let statsigService: StatsigService;
  const user: statsig.StatsigUser = {
    userID: 'user-12345678',
  };
  const userEmail = 'user@test.email';

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
        }),
      ],
    }).compile();

    statsigService = moduleRef.get<StatsigService>(STATSIG_TOKEN);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${StatsigService.prototype.initialize.name}`, () => {
    it('should initialize statsig', async () => {
      expect(await statsigService.initialize()).toBeUndefined();
      expect(statsig.initialize).toHaveBeenCalledTimes(1);
    });
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
      expect(experiment.value).toEqual({} as statsig.DynamicConfig);
      expect(statsig.getExperiment).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.shutdown.name}`, () => {
    it('should shutdown statsig server client', async () => {
      expect(statsigService.shutdown()).toBeUndefined();
      expect(statsig.shutdown).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${StatsigService.prototype.patientServiceToggle.name}`, () => {
    it('should return false when the gate is off', async () => {
      checkGateSpy.mockImplementationOnce(() => Promise.resolve(false));
      expect(await statsigService.patientServiceToggle(userEmail)).toBeFalsy();
      expect(statsig.checkGate).toHaveBeenCalledTimes(1);
    });

    it('should return false when the checkGate method returns null', async () => {
      checkGateSpy.mockImplementationOnce(() => Promise.resolve(null));
      expect(await statsigService.patientServiceToggle(userEmail)).toBeFalsy();
      expect(statsig.checkGate).toHaveBeenCalledTimes(1);
    });

    it('should return true when the gate is on', async () => {
      checkGateSpy.mockImplementationOnce(() => Promise.resolve(true));
      expect(await statsigService.patientServiceToggle(userEmail)).toBeTruthy();
      expect(statsig.checkGate).toHaveBeenCalledTimes(1);
    });

    it('should return false when statsig returns error', async () => {
      checkGateSpy.mockImplementationOnce(() => {
        throw new Error();
      });
      expect(await statsigService.patientServiceToggle(userEmail)).toBeFalsy();
      expect(statsig.checkGate).toHaveBeenCalledTimes(1);
    });
  });
});
