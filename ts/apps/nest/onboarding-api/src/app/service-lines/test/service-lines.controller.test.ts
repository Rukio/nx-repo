import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { HttpException } from '@nestjs/common';
import {
  FETCH_911_RESPONSE_MOCK,
  FETCH_RESPONSE_MOCK,
  FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK,
} from './mocks/service-lines.controller.mock';
import { ServiceLinesController } from '../service-lines.controller';
import ServiceLinesModule from '../service-lines.module';
import ServiceLinesService from '../service-lines.service';

describe(`${ServiceLinesController.name}`, () => {
  let controller: ServiceLinesController;
  const mockServiceLinesService = mockDeep<ServiceLinesService>();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ServiceLinesModule],
    })
      .overrideProvider(ServiceLinesService)
      .useValue(mockServiceLinesService)
      .compile();

    controller = module.get<ServiceLinesController>(ServiceLinesController);
  });

  beforeEach(async () => {
    mockReset(mockServiceLinesService);
  });

  describe(`${ServiceLinesController.prototype.fetchAll.name}`, () => {
    it(`get empty service lines`, async () => {
      mockServiceLinesService.fetchAll.mockResolvedValue(null);

      const result = await controller.fetchAll(17902);
      expect(result).toStrictEqual({ success: false, data: [] });
    });

    it(`gets all possible service lines`, async () => {
      mockServiceLinesService.fetchAll.mockResolvedValue(
        FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK
      );

      const result = await controller.fetchAll(614009);
      expect(result).toStrictEqual({
        success: true,
        data: FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK,
      });
    });
  });

  describe(`${ServiceLinesController.prototype.fetch.name}`, () => {
    it(`gets all possible service lines`, async () => {
      mockServiceLinesService.fetch.mockResolvedValue(FETCH_RESPONSE_MOCK);

      expect(await controller.fetch(123)).toEqual({
        success: true,
        data: FETCH_RESPONSE_MOCK,
      });
    });

    it(`throw httpException on fetch`, async () => {
      jest.spyOn(mockServiceLinesService, 'fetch').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetch(123);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${ServiceLinesController.prototype.fetch911ServiceLine.name}`, () => {
    it(`fetch 911 service lines`, async () => {
      mockServiceLinesService.get911ServiceLine.mockResolvedValue(
        FETCH_911_RESPONSE_MOCK
      );

      expect(await controller.fetch911ServiceLine()).toEqual({
        success: true,
        data: FETCH_911_RESPONSE_MOCK,
      });
    });

    it(`throw httpException on fetch 911 service lines`, async () => {
      jest
        .spyOn(mockServiceLinesService, 'get911ServiceLine')
        .mockImplementation(() => {
          throw new Error('error');
        });
      await expect(async () => {
        await controller.fetch911ServiceLine();
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${ServiceLinesController.prototype.create.name}`, () => {
    it(`create service line`, async () => {
      mockServiceLinesService.create.mockResolvedValue(FETCH_RESPONSE_MOCK);

      expect(await controller.create(123, FETCH_RESPONSE_MOCK)).toEqual({
        success: true,
        data: FETCH_RESPONSE_MOCK,
      });
    });

    it(`throw httpException on create`, async () => {
      jest.spyOn(mockServiceLinesService, 'create').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.create(123, FETCH_RESPONSE_MOCK);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${ServiceLinesController.prototype.update.name}`, () => {
    it(`update service line`, async () => {
      mockServiceLinesService.update.mockResolvedValue(FETCH_RESPONSE_MOCK);

      expect(await controller.update(123, FETCH_RESPONSE_MOCK)).toEqual({
        success: true,
        data: FETCH_RESPONSE_MOCK,
      });
    });

    it(`throw httpException on update`, async () => {
      jest.spyOn(mockServiceLinesService, 'update').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.update(123, FETCH_RESPONSE_MOCK);
      }).rejects.toThrow(HttpException);
    });
  });
});
