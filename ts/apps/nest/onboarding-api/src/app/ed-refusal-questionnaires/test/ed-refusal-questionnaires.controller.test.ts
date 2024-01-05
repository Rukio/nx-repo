import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import { CacheConfigService } from '../../common/cache.config.service';
import EdRefusalQuestionnairesController from '../ed-refusal-questionnaires.controller';
import EdRefusalQuestionnairesService from '../ed-refusal-questionnaires.service';
import {
  REFUSAL_QUESTIONNAIRES_BODY_MOCK,
  REFUSAL_QUESTIONNAIRES_ID_MOCK,
  REFUSAL_QUESTIONNAIRES_MOCK,
  REFUSAL_QUESTIONNAIRES_QUERY_MOCK,
} from './mocks/ed-refusal-questionnaires.common.mock';
import LoggerModule from '../../logger/logger.module';

describe('EdRefusalQuestionnairesController', () => {
  let controller: EdRefusalQuestionnairesController;
  const mockEdRefusalQuestionnairesService =
    mockDeep<EdRefusalQuestionnairesService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [EdRefusalQuestionnairesController],
      providers: [EdRefusalQuestionnairesService],
    })
      .overrideProvider(EdRefusalQuestionnairesService)
      .useValue(mockEdRefusalQuestionnairesService)
      .compile();

    controller = app.get<EdRefusalQuestionnairesController>(
      EdRefusalQuestionnairesController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${EdRefusalQuestionnairesService.prototype.fetchAll.name}`, () => {
    it('fetch all EdRefusalQuestionnaires', async () => {
      mockEdRefusalQuestionnairesService.fetchAll.mockResolvedValue([
        REFUSAL_QUESTIONNAIRES_MOCK,
      ]);
      expect(
        await controller.fetchAll(REFUSAL_QUESTIONNAIRES_QUERY_MOCK)
      ).toEqual({
        success: true,
        data: [REFUSAL_QUESTIONNAIRES_MOCK],
      });
    });

    it('throw error on fetchAll', async () => {
      jest
        .spyOn(mockEdRefusalQuestionnairesService, 'fetchAll')
        .mockImplementation(() => {
          throw new Error('error');
        });
      await expect(async () => {
        await controller.fetchAll(REFUSAL_QUESTIONNAIRES_QUERY_MOCK);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${EdRefusalQuestionnairesService.prototype.create.name}`, () => {
    it('create EdRefusalQuestionnaire', async () => {
      mockEdRefusalQuestionnairesService.create.mockResolvedValue(
        REFUSAL_QUESTIONNAIRES_MOCK
      );
      expect(
        await controller.create(
          REFUSAL_QUESTIONNAIRES_BODY_MOCK,
          REFUSAL_QUESTIONNAIRES_QUERY_MOCK
        )
      ).toEqual({
        success: true,
        data: REFUSAL_QUESTIONNAIRES_MOCK,
      });
    });

    it('throw error on create', async () => {
      jest
        .spyOn(mockEdRefusalQuestionnairesService, 'create')
        .mockImplementation(() => {
          throw new Error('error');
        });
      await expect(async () => {
        await controller.create(
          REFUSAL_QUESTIONNAIRES_BODY_MOCK,
          REFUSAL_QUESTIONNAIRES_QUERY_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${EdRefusalQuestionnairesService.prototype.update.name}`, () => {
    it('update EdRefusalQuestionnaire', async () => {
      mockEdRefusalQuestionnairesService.update.mockResolvedValue(
        REFUSAL_QUESTIONNAIRES_MOCK
      );
      expect(
        await controller.update(
          REFUSAL_QUESTIONNAIRES_BODY_MOCK,
          REFUSAL_QUESTIONNAIRES_QUERY_MOCK,
          REFUSAL_QUESTIONNAIRES_ID_MOCK
        )
      ).toEqual({
        success: true,
        data: REFUSAL_QUESTIONNAIRES_MOCK,
      });
    });

    it('throw error on update', async () => {
      jest
        .spyOn(mockEdRefusalQuestionnairesService, 'update')
        .mockImplementation(() => {
          throw new Error('error');
        });
      await expect(async () => {
        await controller.update(
          REFUSAL_QUESTIONNAIRES_BODY_MOCK,
          REFUSAL_QUESTIONNAIRES_QUERY_MOCK,
          REFUSAL_QUESTIONNAIRES_ID_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });
});
