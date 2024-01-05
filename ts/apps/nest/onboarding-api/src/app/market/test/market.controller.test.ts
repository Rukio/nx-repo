import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import { CacheConfigService } from '../../common/cache.config.service';
import MarketController from '../market.controller';
import MarketService from '../market.service';
import LoggerModule from '../../logger/logger.module';
import { MOCK_MARKET_FETCH_RESPONSE } from './mocks/market.mock';

describe('MarketController', () => {
  let controller: MarketController;
  const mockMarketService = mockDeep<MarketService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [MarketController],
      providers: [MarketService],
    })
      .overrideProvider(MarketService)
      .useValue(mockMarketService)
      .compile();

    controller = app.get<MarketController>(MarketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${MarketService.prototype.fetchAll.name}`, () => {
    it('fetch all market from station', async () => {
      mockMarketService.fetchAll.mockResolvedValue([
        MOCK_MARKET_FETCH_RESPONSE,
      ]);
      expect(await controller.fetchAll()).toEqual({
        success: true,
        data: [MOCK_MARKET_FETCH_RESPONSE],
      });
    });

    it('throw error on fetch all market from station', async () => {
      jest.spyOn(mockMarketService, 'fetchAll').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchAll();
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${MarketService.prototype.fetchAllTelepresentation.name}`, () => {
    it('retrieve all market details', async () => {
      mockMarketService.fetchAllTelepresentation.mockResolvedValue([
        MOCK_MARKET_FETCH_RESPONSE,
      ]);
      expect(await controller.fetchAllTelepresentation()).toEqual({
        success: true,
        data: [MOCK_MARKET_FETCH_RESPONSE],
      });
    });

    it('throw error on retrieve all market details', async () => {
      jest
        .spyOn(mockMarketService, 'fetchAllTelepresentation')
        .mockImplementation(() => {
          throw new Error('error');
        });
      await expect(async () => {
        await controller.fetchAllTelepresentation();
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${MarketService.prototype.fetch.name}`, () => {
    it('fetch market from station', async () => {
      mockMarketService.fetch.mockResolvedValue(MOCK_MARKET_FETCH_RESPONSE);
      expect(await controller.fetch('marketId')).toEqual({
        success: true,
        data: MOCK_MARKET_FETCH_RESPONSE,
      });
    });

    it('throw error on fetch market from station', async () => {
      jest.spyOn(mockMarketService, 'fetch').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetch('marketId');
      }).rejects.toThrow(HttpException);
    });
  });
});
