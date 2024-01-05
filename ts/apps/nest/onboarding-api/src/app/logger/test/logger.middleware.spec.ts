import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import {
  Controller,
  Module,
  MiddlewareConsumer,
  INestApplication,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import LoggerModule from '../logger.module';
import LoggerMiddleware from '../logger.middleware';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { mockLogger } from '../mocks/logger.mock';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ConfigGetWithOneArg,
  mockConfigService,
} from '../../common/mocks/config.service.mock';
import loggerConfiguration, {
  LoggingConfiguration,
} from '../logger.configuration';

const RETURN_VALUE = 'test';
const TEST_PATH = '/test';
const TEST_CODE = HttpStatus.OK;

@Controller()
class TestController {
  @Post(TEST_PATH)
  @HttpCode(TEST_CODE)
  test() {
    return RETURN_VALUE;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loggerConfiguration],
      isGlobal: true,
    }),
    LoggerModule,
  ],
  controllers: [TestController],
})
class TestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

describe(`${LoggerMiddleware.name}`, () => {
  let app: INestApplication;

  const init = async (mockLoggingConfig: LoggingConfiguration) => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    })
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    (mockConfigService.get as unknown as ConfigGetWithOneArg)
      .calledWith('logging')
      .mockReturnValue(mockLoggingConfig);

    app = moduleRef.createNestApplication();
    await app.init();
  };

  afterAll(async () => {
    await app.close();
  });

  const mockDevLoggingConfiguration: LoggingConfiguration = {
    level: 'debug',
    logExtendedRequestData: false,
    useProductionLogFormat: false,
  };
  const mockProdLoggingConfiguration: LoggingConfiguration = {
    level: 'debug',
    logExtendedRequestData: false,
    useProductionLogFormat: true,
  };
  const mockExtendedLoggingConfiguration: LoggingConfiguration = {
    level: 'debug',
    logExtendedRequestData: true,
    useProductionLogFormat: true,
  };

  describe('Dev Logging', () => {
    beforeEach(async () => {
      await init(mockDevLoggingConfiguration);
    });

    it('should log request info', () => {
      return request(app.getHttpServer())
        .post(`${TEST_PATH}`)
        .send()
        .expect(() => {
          expect(mockLogger.info).toBeCalledTimes(1);
          expect(mockLogger.info).toBeCalledWith(
            expect.stringContaining(`POST ${TEST_PATH} ${TEST_CODE}`),
            undefined
          );
        });
    });
  });

  describe('Prod Logging', () => {
    beforeEach(async () => {
      await init(mockProdLoggingConfiguration);
    });

    it('should log request info', () => {
      return request(app.getHttpServer())
        .post(`${TEST_PATH}`)
        .send()
        .expect(() => {
          expect(mockLogger.info).toBeCalledTimes(1);
          expect(mockLogger.info).toBeCalledWith(
            expect.stringContaining(`POST ${TEST_PATH} ${TEST_CODE}`),
            undefined
          );
        });
    });
  });

  describe('Extended Prod Logging', () => {
    beforeEach(async () => {
      await init(mockExtendedLoggingConfiguration);
    });

    it('should log request info', () => {
      return request(app.getHttpServer())
        .post(`${TEST_PATH}`)
        .send()
        .expect(() => {
          expect(mockLogger.info).toBeCalledTimes(1);
          expect(mockLogger.info).toBeCalledWith(
            expect.stringContaining(`POST ${TEST_PATH} ${TEST_CODE}`),
            expect.objectContaining({
              req: expect.any(Object),
              res: expect.any(Object),
            })
          );
        });
    });
  });
});
