import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mockDatadogService } from '../../common/mocks/datadog.service.mock';
import { TwilioController } from '../twilio.controller';
import { CommunicationsModule } from '../communications.module';
import { TwilioWebhookBodyDto } from '../dto/twilio-webhook-body.dto';
import { CommonModule } from '../../common/common.module';

describe(`${TwilioController.name}`, () => {
  let app: INestApplication;
  let controller: TwilioController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommunicationsModule, CommonModule],
    })
      .overrideProvider(DatadogService)
      .useValue(mockDatadogService)
      .compile();

    controller = moduleRef.get<TwilioController>(TwilioController);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetModules();
  });

  const body: TwilioWebhookBodyDto = {
    AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxx',
    Level: 'ERROR',
    ParentAccountSid: '',
    Payload:
      '{"resource_sid":"CAxxxxxxxx","service_sid":null,"error_code":"11200","more_info":{"msg":"An attempt to retrieve content from https://yyy.zzz returned the HTTP status code 404","Msg":"An attempt to retrieve content from https://yyy.zzz returned the HTTP status code 404","sourceComponent":"12000","ErrorCode":"11200","httpResponse":"404","url":"https://yyy.zzz","LogLevel":"ERROR"},"webhook":{"type":"application/json","body":{}}}',
    PayloadType: 'application/json',
    Sid: 'NOxxxxx',
    Timestamp: '2020-01-01T23:28:54Z',
  };

  describe(`${TwilioController.name}`, () => {
    describe(`${TwilioController.prototype.handleTwilioErrorWebhook.name}`, () => {
      test(`Calls ${DatadogService.name}`, async () => {
        mockDatadogService.histogram.mockReturnValue();

        await controller.handleTwilioErrorWebhook(body);

        expect(mockDatadogService.histogram).toHaveBeenCalledTimes(1);
      });
    });
  });
});
