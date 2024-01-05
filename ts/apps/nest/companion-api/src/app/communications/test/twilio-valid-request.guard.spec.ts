import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { mockDeep } from 'jest-mock-extended';
import { CommunicationsModule } from '../communications.module';
import { TwilioValidRequestGuard } from '../twilio-valid-request.guard';
import * as TwilioWebhooks from 'twilio/lib/webhooks/webhooks';
import { mockConfigService } from '../../common/mocks/config.service.mock';
import { ConfigService } from '@nestjs/config';
import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import { CommonModule } from '../../common/common.module';

const validateIncomingRequest = jest.spyOn(
  TwilioWebhooks,
  'validateIncomingRequest'
);

describe(`${TwilioValidRequestGuard.name}`, () => {
  let guard: TwilioValidRequestGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommunicationsModule, CommonModule],
    }).compile();

    guard = module.get<TwilioValidRequestGuard>(TwilioValidRequestGuard);
  });

  const mockAuthenticationSuccessfulContext = mockDeep<ExecutionContext>({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(
        mockDeep<Request>({
          headers: {
            'i-twilio-idempotency-token': 'idempotency-token-goes-here',
            'x-twilio-signature': 'correct-signature-goes-here',
            'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          },
          body: {
            AccountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxx',
            Level: 'ERROR',
            ParentAccountSid: '',
            Payload:
              '{"resource_sid":"CAxxxxxxxx","service_sid":null,"error_code":"11200","more_info":{"msg":"An attempt to retrieve content from https://yyy.zzz returned the HTTP status code 404","Msg":"An attempt to retrieve content from https://yyy.zzz returned the HTTP status code 404","sourceComponent":"12000","ErrorCode":"11200","httpResponse":"404","url":"https://yyy.zzz","LogLevel":"ERROR"},"webhook":{"type":"application/json","request":{}}}',
            PayloadType: 'application/json',
            Sid: 'NOxxxxx',
            Timestamp: '2020-01-01T23:28:54Z',
          },
        })
      ),
      getNext: jest.fn(),
      getResponse: jest.fn(),
    }),
  });

  const mockAuthenticationUnsuccessfulContext = mockDeep<ExecutionContext>({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(
        mockDeep<Request>({
          headers: {},
          body: {},
        })
      ),
      getNext: jest.fn(),
      getResponse: jest.fn(),
    }),
  });

  describe(`${TwilioValidRequestGuard.prototype.canActivate.name}`, () => {
    describe('Authentication Successful', () => {
      beforeEach(() => {
        validateIncomingRequest.mockReturnValue(true);
      });

      test('returns true', async () => {
        const result = await guard.canActivate(
          mockAuthenticationSuccessfulContext
        );

        expect(result).toStrictEqual(true);
      });
    });

    describe('Authentication Unsuccessful', () => {
      beforeEach(() => {
        validateIncomingRequest.mockReturnValue(false);
      });

      test('canActivate rejects - throws error', async () => {
        const result = guard.canActivate(mockAuthenticationUnsuccessfulContext);

        await expect(result).toStrictEqual(false);
      });
    });
  });
});

describe(`${TwilioValidRequestGuard.name} - Missing TWILIO_AUTH_TOKEN`, () => {
  test('Throws error', async () => {
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'TWILIO_AUTH_TOKEN') {
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
      `Missing required environment variable: TWILIO_AUTH_TOKEN`
    );
  });
});
