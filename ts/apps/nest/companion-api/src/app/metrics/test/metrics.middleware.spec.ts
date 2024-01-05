import { Test } from '@nestjs/testing';
import { MetricsInterceptor } from '../metrics.interceptor';
import request from 'supertest';
import {
  Controller,
  Get,
  Module,
  INestApplication,
  UseInterceptors,
  ServiceUnavailableException,
  Post,
} from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { mockDatadogService } from '../../common/mocks/datadog.service.mock';

const RETURN_VALUE = 'test';
const TEST_PATH = '/test';
const ERROR_PATH = '/error';
const ERROR = ServiceUnavailableException;

@Controller()
@UseInterceptors(MetricsInterceptor)
class TestController {
  @Get(TEST_PATH)
  test() {
    return RETURN_VALUE;
  }

  @Post(ERROR_PATH)
  error() {
    throw new ERROR();
  }
}

@Module({
  imports: [],
  controllers: [TestController],
})
class TestModule {}

describe(`${MetricsInterceptor.name}`, () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule, CommonModule],
    })
      .overrideProvider(DatadogService)
      .useValue(mockDatadogService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should log latency', () => {
    return request(app.getHttpServer())
      .get(TEST_PATH)
      .send()
      .expect(() => {
        expect(mockDatadogService.histogram).toHaveBeenCalledTimes(1);
      });
  });

  it('should log exception', () => {
    return request(app.getHttpServer())
      .post(ERROR_PATH)
      .send()
      .expect(() => {
        expect(mockDatadogService.histogram).toHaveBeenCalledTimes(1);
      });
  });
});
