import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { getQueueToken } from '@nestjs/bull';
import { mockRunningLateSmsQueue } from './jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from './jobs/common/jobs.constants';

describe(`${AppModule.name}`, () => {
  let app: INestApplication;

  const init = async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  };

  afterEach(async () => {
    await app.close();
  });

  it('initializes', async () => {
    await init();
    expect(app).toBeDefined();
  });
});
