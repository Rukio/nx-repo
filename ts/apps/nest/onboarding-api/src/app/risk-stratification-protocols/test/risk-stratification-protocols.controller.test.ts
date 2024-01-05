import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import { CacheConfigService } from '../../common/cache.config.service';

import RiskStratificationProtocolsController from '../risk-stratification-protocols.controller';
import RiskStratificationProtocolsService from '../risk-stratification-protocols.service';
import LoggerModule from '../../logger/logger.module';
import {
  RISK_STRATIFICATION_PROTOCOL_QUERY_MOCK,
  RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK,
} from './mocks/risk-stratification-protocols.mock';
import {
  PROTOCOL_ID,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
} from '../../station/test/mocks/station.service.mock';

describe('RiskStratificationProtocolsController', () => {
  let controller: RiskStratificationProtocolsController;
  const mockRiskStratificationProtocolService =
    mockDeep<RiskStratificationProtocolsService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [RiskStratificationProtocolsController],
      providers: [RiskStratificationProtocolsService],
    })
      .overrideProvider(RiskStratificationProtocolsService)
      .useValue(mockRiskStratificationProtocolService)
      .compile();

    controller = app.get<RiskStratificationProtocolsController>(
      RiskStratificationProtocolsController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${RiskStratificationProtocolsService.prototype.fetchAll.name}`, () => {
    it('fetch list of Risk Stratification Protocols from station', async () => {
      mockRiskStratificationProtocolService.fetchAll.mockResolvedValue(
        RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK
      );
      expect(
        await controller.fetchAll(RISK_STRATIFICATION_PROTOCOL_QUERY_MOCK)
      ).toEqual({
        success: true,
        data: RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK,
      });
    });

    it('throw error on fetchAll', async () => {
      mockRiskStratificationProtocolService.fetchAll.mockImplementation(() => {
        throw new Error('error');
      });

      await expect(async () => {
        await controller.fetchAll(
          RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${RiskStratificationProtocolsService.prototype.fetch.name}`, () => {
    it('fetch Risk Stratification Protocol from station by id', async () => {
      mockRiskStratificationProtocolService.fetch.mockResolvedValue(
        RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK
      );
      expect(
        await controller.fetch(
          RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
          PROTOCOL_ID
        )
      ).toEqual({
        success: true,
        data: RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
      });
    });

    it('throw error on fetch', async () => {
      mockRiskStratificationProtocolService.fetch.mockImplementation(() => {
        throw new Error('error');
      });

      await expect(async () => {
        await controller.fetch(
          RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
          PROTOCOL_ID
        );
      }).rejects.toThrow(HttpException);
    });
  });
});
