import { Test, TestingModule } from '@nestjs/testing';
import InsuranceNetworksController from '../insurance-networks.controller';
import InsuranceNetworksService from '../insurance-networks.service';
import InsuranceNetworksModule from '../insurance-networks.module';
import LoggerModule from '../../logger/logger.module';

describe('InsuranceNetworksModule', () => {
  let module: TestingModule;
  const OLD_ENV = process.env;

  beforeAll(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
    process.env.M2M_INSURANCE_SERVICE_AUDIENCE = 'test';

    module = await Test.createTestingModule({
      imports: [InsuranceNetworksModule, LoggerModule],
    }).compile();
  });

  it('should be defined', () => {
    const controller: InsuranceNetworksController =
      module.get<InsuranceNetworksController>(InsuranceNetworksController);
    const service: InsuranceNetworksService =
      module.get<InsuranceNetworksService>(InsuranceNetworksService);
    expect(controller).toBeDefined();
    expect(module).toBeDefined();
    expect(service).toBeDefined();
  });
});
