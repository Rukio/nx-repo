import InsuranceNetworksController from '../insurance-networks.controller';
import InsuranceNetworksService from '../insurance-networks.service';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import LoggerModule from '../../logger/logger.module';
import { CacheModule, HttpException } from '@nestjs/common';
import { CacheConfigService } from '../../common/cache.config.service';
import {
  MOCK_FETCH_INSURANCE_NETWORK_RESULT,
  MOCK_INSURANCE_NETWORK_ID,
  MOCK_INSURANCE_NETWORK,
  MOCK_INSURANCE_NETWORKS_SERVICE_RESULT,
  MOCK_SEARCH_INSURANCE_NETWORKS_RESULT,
  MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS,
  MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES,
  MOCK_LIST_INSURANCE_NETWORKS_CREDIT_CARD_RULES_RESULT,
} from './mocks/insurance-networks.mock';

describe(`${InsuranceNetworksController.name}`, () => {
  let controller: InsuranceNetworksController;
  const mockInsuranceNetworksService = mockDeep<InsuranceNetworksService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InsuranceNetworksController],
      providers: [InsuranceNetworksService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(InsuranceNetworksService)
      .useValue(mockInsuranceNetworksService)
      .compile();

    controller = app.get<InsuranceNetworksController>(
      InsuranceNetworksController
    );
  });

  beforeEach(async () => {
    mockReset(mockInsuranceNetworksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${InsuranceNetworksController.prototype.fetch.name}`, () => {
    it('get an insurance network by id', async () => {
      mockInsuranceNetworksService.fetch.mockResolvedValue(
        MOCK_INSURANCE_NETWORK
      );

      expect(await controller.fetch(MOCK_INSURANCE_NETWORK_ID)).toEqual(
        MOCK_FETCH_INSURANCE_NETWORK_RESULT
      );
    });

    it('throw exception on get an insurance network by id', async () => {
      mockInsuranceNetworksService.fetch.mockImplementationOnce(() => {
        throw new Error('error');
      });

      await expect(async () => {
        await controller.fetch(MOCK_INSURANCE_NETWORK_ID);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InsuranceNetworksController.prototype.search.name}`, () => {
    it('search insurance networks', async () => {
      mockInsuranceNetworksService.search.mockResolvedValue(
        MOCK_INSURANCE_NETWORKS_SERVICE_RESULT
      );

      expect(
        await controller.search(MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS)
      ).toEqual(MOCK_SEARCH_INSURANCE_NETWORKS_RESULT);
    });

    it('throw exception on search insurance networks', async () => {
      mockInsuranceNetworksService.search.mockImplementationOnce(() => {
        throw new Error('error');
      });

      await expect(async () => {
        await controller.search(MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InsuranceNetworksController.prototype.listNetworkCreditCardRules.name}`, () => {
    it('returns list of insurance network credit card rules', async () => {
      mockInsuranceNetworksService.listNetworkCreditCardRules.mockResolvedValueOnce(
        MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES
      );

      expect(
        await controller.listNetworkCreditCardRules(MOCK_INSURANCE_NETWORK_ID)
      ).toEqual(MOCK_LIST_INSURANCE_NETWORKS_CREDIT_CARD_RULES_RESULT);
    });

    it('throw exception on list insurance network credit card rules', async () => {
      mockInsuranceNetworksService.listNetworkCreditCardRules.mockRejectedValueOnce(
        'error'
      );

      await expect(async () => {
        await controller.listNetworkCreditCardRules(MOCK_INSURANCE_NETWORK_ID);
      }).rejects.toThrow(HttpException);
    });
  });
});
