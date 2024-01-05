import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import SecondaryScreeningController from '../secondary-screening.controller';
import SecondaryScreeningService from '../secondary-screening.service';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import {
  SECONDARY_SCREENING_MOCK,
  SECONDARY_SCREENING_PARAMS_MOCK,
} from './mocks/secondary-screening.common.mock';

describe('SecondaryScreeningController', () => {
  let controller: SecondaryScreeningController;
  const mockSecondaryScreeningService = mockDeep<SecondaryScreeningService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SecondaryScreeningController],
      providers: [SecondaryScreeningService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(SecondaryScreeningService)
      .useValue(mockSecondaryScreeningService)
      .compile();
    controller = app.get<SecondaryScreeningController>(
      SecondaryScreeningController
    );
  });

  describe(`${SecondaryScreeningService.prototype.create.name}`, () => {
    it('create SecondaryScreening', async () => {
      mockSecondaryScreeningService.create.mockResolvedValue(
        SECONDARY_SCREENING_MOCK
      );
      expect(
        await controller.create(
          SECONDARY_SCREENING_PARAMS_MOCK,
          'careRequestId'
        )
      ).toEqual({
        success: true,
        data: SECONDARY_SCREENING_MOCK,
      });
    });

    it('throw error on create', async () => {
      mockSecondaryScreeningService.create.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.create(SECONDARY_SCREENING_MOCK, 'careRequestId');
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${SecondaryScreeningService.prototype.fetchAll.name}`, () => {
    it('fetch all SecondaryScreening', async () => {
      mockSecondaryScreeningService.fetchAll.mockResolvedValue([
        SECONDARY_SCREENING_MOCK,
      ]);
      expect(await controller.fetchAll('careRequestId')).toEqual({
        success: true,
        data: [SECONDARY_SCREENING_MOCK],
      });
    });

    it('throw error on fetchAll', async () => {
      mockSecondaryScreeningService.fetchAll.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchAll('careRequestId');
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${SecondaryScreeningService.prototype.update.name}`, () => {
    it('update SecondaryScreening', async () => {
      mockSecondaryScreeningService.update.mockResolvedValue(
        SECONDARY_SCREENING_MOCK
      );
      expect(
        await controller.update(
          SECONDARY_SCREENING_PARAMS_MOCK,
          'careRequestId',
          'id'
        )
      ).toEqual({
        success: true,
        data: SECONDARY_SCREENING_MOCK,
      });
    });

    it('throw error on update', async () => {
      mockSecondaryScreeningService.update.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.update(
          SECONDARY_SCREENING_MOCK,
          'careRequestId',
          'id'
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${SecondaryScreeningService.prototype.remove.name}`, () => {
    it('remove SecondaryScreening', async () => {
      mockSecondaryScreeningService.remove.mockResolvedValue({ success: true });
      expect(await controller.remove('careRequestId', 'id')).toEqual({
        success: true,
      });
    });

    it('throw error on remove', async () => {
      mockSecondaryScreeningService.remove.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.remove('careRequestId', 'id');
      }).rejects.toThrow(HttpException);
    });
  });
});
