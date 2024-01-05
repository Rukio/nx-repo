import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import {
  CareRequestAPIResponse,
  Protocol,
} from '@*company-data-covered*/consumer-web-types';
import { CacheConfigService } from '../common/cache.config.service';

import SymptomsController from './symptoms.controller';
import SymptomsService from './symptoms.service';
import LoggerModule from '../logger/logger.module';

describe('SymptomsController', () => {
  let controller: SymptomsController;
  let service: SymptomsService;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [SymptomsController],
      providers: [SymptomsService],
    }).compile();
    controller = app.get<SymptomsController>(SymptomsController);
    service = app.get<SymptomsService>(SymptomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('fetch Symptoms from station', async () => {
    const mockResult: Protocol[] = [
      {
        id: 3,
        name: 'test',
        weight: 0,
      },
      {
        id: 4,
        name: 'Abdominal Pain',
        weight: 0,
      },
      {
        id: 5,
        name: 'Back Pain',
        weight: 0,
      },
    ];
    const response: CareRequestAPIResponse<Protocol[]> = {
      data: mockResult,
      success: true,
    };
    jest
      .spyOn(service, 'fetchAll')
      .mockImplementation(() => Promise.resolve(mockResult));

    expect(await controller.fetchAll()).toStrictEqual(response);
    expect(service.fetchAll).toBeCalled();
  });
});
