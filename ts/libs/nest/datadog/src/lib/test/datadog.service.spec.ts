import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StatsD } from 'hot-shots';
import { DatadogModule } from '../datadog.module';
import { DatadogService } from '../datadog.service';

describe(`${DatadogService.name}`, () => {
  let app: INestApplication;
  let service: DatadogService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DatadogModule.forRoot({
          isGlobal: true,
        }),
      ],
    }).compile();

    service = moduleRef.get<DatadogService>(DatadogService);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`service is instance of StatsD`, async () => {
    expect(service).toBeInstanceOf(DatadogService);
    expect(service).toBeInstanceOf(StatsD);
  });
});
