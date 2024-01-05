import { Test, TestingModule } from '@nestjs/testing';
import RiskStratificationController from '../risk-stratification.controller';
import RiskStratificationService from '../risk-stratification.service';
import RiskStratificationModule from '../risk-stratification.module';
import LoggerModule from '../../logger/logger.module';

describe('RiskStratificationModule', () => {
  let module: TestingModule;
  const OLD_ENV = process.env;

  beforeAll(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
    process.env.M2M_RISK_STRAT_SERVICE_AUDIENCE = 'test';

    module = await Test.createTestingModule({
      imports: [RiskStratificationModule, LoggerModule],
    }).compile();
  });

  it('should be defined', () => {
    const controller: RiskStratificationController =
      module.get<RiskStratificationController>(RiskStratificationController);
    const service: RiskStratificationService =
      module.get<RiskStratificationService>(RiskStratificationService);
    expect(controller).toBeDefined();
    expect(module).toBeDefined();
    expect(service).toBeDefined();
  });
});
