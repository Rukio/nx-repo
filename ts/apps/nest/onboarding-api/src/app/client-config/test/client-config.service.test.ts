import { HttpModule, HttpService } from '@nestjs/axios';
import { INestApplication, InternalServerErrorException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import { mockLogDNAConfig } from '../mocks/client-config.mock';
import LogDNAService from '../client-config.service';

describe(`${LogDNAService.name}`, () => {
  let app: INestApplication;
  let logDNAService: LogDNAService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LogDNAService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    logDNAService = module.get<LogDNAService>(LogDNAService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${LogDNAService.prototype.getLogDNA.name}`, () => {
    it('should return the logDNA config', async () => {
      const response: AxiosResponse = wrapInAxiosResponse(mockLogDNAConfig);

      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));

      const result = await logDNAService.getLogDNA();

      expect(result).toEqual(mockLogDNAConfig);
    });

    it('should throw an error if the logDNA config is not found', async () => {
      jest.spyOn(httpService, 'get').mockImplementationOnce(() => {
        throw new InternalServerErrorException();
      });
      try {
        await logDNAService.getLogDNA();
      } catch (error) {
        expect(error).toHaveProperty('message', 'Internal Server Error');
        expect(error).toHaveProperty('status', 500);
      }
    });
  });
});
