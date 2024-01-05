import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { mockDeep, mockReset } from 'jest-mock-extended';
import { CacheConfigService } from '../../common/cache.config.service';
import InformedRequestorsController from '../informed-requestor.controller';
import InformedRequestorsService from '../informed-requestor.service';
import {
  MOCK_INFORMED_REQUESTOR_RESPONSE,
  MOCK_INFORMED_REQUESTOR_PAYLOAD,
} from './mocks/informed-requestor.mock';
import LoggerModule from '../../logger/logger.module';

describe(`${InformedRequestorsController.name}`, () => {
  let controller: InformedRequestorsController;
  const mockInformedRequestorService = mockDeep<InformedRequestorsService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [InformedRequestorsController],
      providers: [InformedRequestorsService],
    })
      .overrideProvider(InformedRequestorsService)
      .useValue(mockInformedRequestorService)
      .compile();

    controller = app.get<InformedRequestorsController>(
      InformedRequestorsController
    );
  });

  beforeEach(async () => {
    mockReset(mockInformedRequestorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${InformedRequestorsService.prototype.create.name}`, () => {
    it('create informed requesters', async () => {
      mockInformedRequestorService.create.mockResolvedValue(
        MOCK_INFORMED_REQUESTOR_RESPONSE
      );
      expect(await controller.create(MOCK_INFORMED_REQUESTOR_PAYLOAD)).toEqual({
        success: true,
        data: MOCK_INFORMED_REQUESTOR_RESPONSE,
      });
    });

    it(`throw error on create informed requester`, async () => {
      jest
        .spyOn(mockInformedRequestorService, 'create')
        .mockImplementation(() => {
          throw new Error('error');
        });

      await expect(async () => {
        await controller.create(MOCK_INFORMED_REQUESTOR_PAYLOAD);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InformedRequestorsService.prototype.update.name}`, () => {
    it('update informed requesters', async () => {
      mockInformedRequestorService.update.mockResolvedValue(
        MOCK_INFORMED_REQUESTOR_RESPONSE
      );
      expect(await controller.update(MOCK_INFORMED_REQUESTOR_PAYLOAD)).toEqual({
        success: true,
        data: MOCK_INFORMED_REQUESTOR_RESPONSE,
      });
    });

    it(`throw error on update informed requester`, async () => {
      jest
        .spyOn(mockInformedRequestorService, 'update')
        .mockImplementation(() => {
          throw new Error('error');
        });

      await expect(async () => {
        await controller.update(MOCK_INFORMED_REQUESTOR_PAYLOAD);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InformedRequestorsService.prototype.fetch.name}`, () => {
    it('fetch informed requesters', async () => {
      mockInformedRequestorService.fetch.mockResolvedValue(
        MOCK_INFORMED_REQUESTOR_RESPONSE
      );
      expect(await controller.fetch(123)).toEqual({
        success: true,
        data: MOCK_INFORMED_REQUESTOR_RESPONSE,
      });
    });

    it(`throw error on fetch informed requester`, async () => {
      jest
        .spyOn(mockInformedRequestorService, 'fetch')
        .mockImplementation(() => {
          throw new Error('error');
        });

      await expect(async () => {
        await controller.fetch(123);
      }).rejects.toThrow(HttpException);
    });
  });
});
