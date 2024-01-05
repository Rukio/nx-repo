import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import {
  CareRequestAPIResponse,
  LogDNAConfig,
} from '@*company-data-covered*/consumer-web-types';
import ClientConfigController from '../client-config.controller';
import ClientConfigService from '../client-config.service';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import { mockLogDNAConfig } from '../mocks/client-config.mock';

describe('ClientConfigController tests', () => {
  let controller: ClientConfigController;
  let clientConfigService: ClientConfigService;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ClientConfigController],
      providers: [ClientConfigService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();
    controller = app.get<ClientConfigController>(ClientConfigController);
    clientConfigService = app.get<ClientConfigService>(ClientConfigService);
  });

  it('should get log DNA config', async () => {
    const response: CareRequestAPIResponse<LogDNAConfig> = {
      data: mockLogDNAConfig,
      success: true,
    };
    jest
      .spyOn(clientConfigService, 'getLogDNA')
      .mockImplementation(() => Promise.resolve(mockLogDNAConfig));

    expect(await controller.getLogDNA()).toStrictEqual(response);
  });
});
