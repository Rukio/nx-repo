import { Test } from '@nestjs/testing';
import { CommonModule } from '../common.module';
import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { ConfigService } from '@nestjs/config';
import { mockConfigService } from '../../common/mocks/config.service.mock';
import { mockDatadogService } from '../../common/mocks/datadog.service.mock';
import {
  Controller,
  Get,
  INestApplication,
  Module,
  Post,
  ServiceUnavailableException,
  UseInterceptors,
} from '@nestjs/common';
import { MetricsInterceptor } from '../../metrics/metrics.interceptor';

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

describe(`${CommonModule.name}`, () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [CommonModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should send metrics on app bootstrap', async () => {
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'NODE_ENV') {
        return 'development';
      } else if (key === 'GIT_SHA') {
        return 'v1';
      }

      return process.env[key];
    });

    const moduleRef = await Test.createTestingModule({
      imports: [TestModule, CommonModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(DatadogService)
      .useValue(mockDatadogService)
      .compile();

    const app: INestApplication = moduleRef.createNestApplication();

    await app.init();

    expect(mockDatadogService.histogram).toHaveBeenCalledWith(
      'app_version',
      1,
      { version: 'v1' }
    );

    await app.close();
  });
});
