import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommunicationsModule } from '../communications.module';
import { SmsService } from '../sms.service';
import {
  mockExecutionListInstance,
  mockTwilioService,
} from '../mocks/twilio.client.mock';
import { ConfigService } from '@nestjs/config';
import { mockConfigService } from '../../common/mocks/config.service.mock';
import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import { DH_HQ_PHONE_NUMBER } from '../../common/constants';
import { TwilioService } from 'nestjs-twilio';
import { CommonModule } from '../../common/common.module';
import { mockDeep } from 'jest-mock-extended';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe(`${SmsService.name}`, () => {
  let app: INestApplication;
  let smsService: SmsService;
  const mockLogger = mockDeep<Logger>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommunicationsModule, CommonModule],
    })
      .overrideProvider(TwilioService)
      .useValue(mockTwilioService)
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .compile();

    smsService = moduleRef.get<SmsService>(SmsService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /* Cant find a way to mock the twilio client */
  describe(`${SmsService.prototype.executeFlow.name}`, () => {
    describe('Valid "to" number', () => {
      const toNumber = '+13036425577';
      const flowSid = 'fake';

      test('should call logger', async () => {
        mockExecutionListInstance.create.mockResolvedValueOnce({
          accountSid: 'fakeSID',
          sid: 'fakeMessageSID',
        });
        await smsService.executeFlow(flowSid, toNumber, {
          messageType: 'fakeMessageType',
        });

        expect(mockLogger.debug).toBeCalledWith(
          'Twilio Flow executed successfully.',
          expect.objectContaining({
            messageType: 'fakeMessageType',
            accountSID: 'fakeSID',
            messageSID: 'fakeMessageSID',
          })
        );
      });

      test('should call Twilio', async () => {
        mockExecutionListInstance.create.mockResolvedValueOnce({
          accountSid: 'fakeSID',
          sid: 'fakeMessageSID',
        });
        await smsService.executeFlow(flowSid, toNumber, {
          messageType: 'fakeMessageType',
        });

        expect(
          mockTwilioService.client.studio.v2.flows(flowSid).executions.create
        ).toHaveBeenCalledTimes(1);
      });

      describe('Twilio throws error', () => {
        test('should throw error', async () => {
          const mockError = new Error();
          mockTwilioService.client.studio.v2
            .flows(flowSid)
            .executions.create.mockRejectedValue(mockError);

          await expect(() =>
            smsService.executeFlow(flowSid, toNumber, {})
          ).rejects.toBeInstanceOf(Error);
        });
      });
    });

    describe('Invalid "to" number', () => {
      const flowSid = 'fake';

      describe('DH Headquarters phone number', () => {
        test('should not call Twilio', async () => {
          const toNumber = DH_HQ_PHONE_NUMBER;

          await smsService.executeFlow(flowSid, toNumber, {});

          expect(
            mockTwilioService.client.studio.v2.flows(flowSid).executions.create
          ).toHaveBeenCalledTimes(0);
        });
      });

      describe('Invalid phone number', () => {
        test('should throw error', async () => {
          const toNumber = '1234';

          await expect(
            smsService.executeFlow(flowSid, toNumber, {})
          ).rejects.toBeInstanceOf(Error);
        });
      });
    });
  });
});

describe(`${SmsService.name} - Missing TWILIO_FROM_NUMBER`, () => {
  test('Throws error', async () => {
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'TWILIO_FROM_NUMBER') {
        return undefined;
      }

      return process.env[key];
    });

    const moduleRef = Test.createTestingModule({
      imports: [CommunicationsModule, CommonModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService);

    await expect(moduleRef.compile()).rejects.toBeInstanceOf(
      MissingEnvironmentVariableException
    );
    await expect(moduleRef.compile()).rejects.toThrow(
      `Missing required environment variable: TWILIO_FROM_NUMBER`
    );
  });
});
