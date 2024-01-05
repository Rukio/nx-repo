import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import { CacheConfigService } from '../../common/cache.config.service';
import PartnerLinesService from '../partner-lines.service';
import PartnerLinesController from '../partner-lines.controller';
import {
  PARTNER_LINE_MOCK,
  PARTNER_LINES_QUERY_MOCK,
} from './mocks/partner-lines.common.mock';
import LoggerModule from '../../logger/logger.module';

describe(`${PartnerLinesController.name}`, () => {
  let controller: PartnerLinesController;
  const mockPartnerLinesService = mockDeep<PartnerLinesService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PartnerLinesController],
      providers: [PartnerLinesService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(PartnerLinesService)
      .useValue(mockPartnerLinesService)
      .compile();

    controller = app.get<PartnerLinesController>(PartnerLinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${PartnerLinesService.prototype.fetchAll.name}`, () => {
    it('get list of partner lists', async () => {
      mockPartnerLinesService.fetchAll.mockResolvedValue([PARTNER_LINE_MOCK]);
      expect(await controller.fetchAll()).toEqual({
        success: true,
        data: [PARTNER_LINE_MOCK],
      });
    });

    it('throw error on get list of partner lists', async () => {
      jest.spyOn(mockPartnerLinesService, 'fetchAll').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchAll();
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PartnerLinesService.prototype.fetch.name}`, () => {
    it('search partner list by phone number', async () => {
      mockPartnerLinesService.fetch.mockResolvedValue(PARTNER_LINE_MOCK);
      expect(await controller.fetch(PARTNER_LINES_QUERY_MOCK)).toEqual({
        success: true,
        data: PARTNER_LINE_MOCK,
      });
    });

    it('throw error on search partner list by phone number', async () => {
      jest.spyOn(mockPartnerLinesService, 'fetch').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetch(PARTNER_LINES_QUERY_MOCK);
      }).rejects.toThrow(HttpException);
    });
  });
});
