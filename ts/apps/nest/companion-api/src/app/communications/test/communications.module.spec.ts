import { Test } from '@nestjs/testing';
import { CommunicationsModule } from '../communications.module';
import { ConfigService } from '@nestjs/config';
import { mockConfigService } from '../../common/mocks/config.service.mock';
import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import { CommonModule } from '../../common/common.module';

describe(`${CommunicationsModule.name}`, () => {
  test('Missing TWILIO_ACCOUNT_SID - Throws error', async () => {
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'TWILIO_ACCOUNT_SID') {
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
      `Missing required environment variable: TWILIO_ACCOUNT_SID`
    );
  });

  test('Missing TWILIO_AUTH_TOKEN - Throws error', async () => {
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
