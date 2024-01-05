import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import { CacheConfigService } from '../../common/cache.config.service';
import StateController from '../state.controller';
import StateService from '../state.service';
import LoggerModule from '../../logger/logger.module';
import { MOCK_STATE_FETCH_RESPONSE } from './mocks/state.mock';

describe('StateController', () => {
  let controller: StateController;
  const mockStateService = mockDeep<StateService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [StateController],
      providers: [StateService],
    })
      .overrideProvider(StateService)
      .useValue(mockStateService)
      .compile();

    controller = app.get<StateController>(StateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${StateService.prototype.fetchAllActive.name}`, () => {
    it('fetch all active states from station', async () => {
      mockStateService.fetchAllActive.mockResolvedValue([
        MOCK_STATE_FETCH_RESPONSE,
      ]);
      expect(await controller.fetchAllActive()).toEqual({
        success: true,
        data: [MOCK_STATE_FETCH_RESPONSE],
      });
    });

    it('throw error on fetch all active states from station', async () => {
      jest.spyOn(mockStateService, 'fetchAllActive').mockImplementation(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchAllActive();
      }).rejects.toThrow(HttpException);
    });
  });
});
