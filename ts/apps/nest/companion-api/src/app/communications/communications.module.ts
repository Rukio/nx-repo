import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import { TwilioController } from './twilio.controller';
import { TwilioModule } from 'nestjs-twilio';
import { MissingEnvironmentVariableException } from '../common/exceptions/missing-environment-variable.exception';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    TwilioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const accountSidKey = 'TWILIO_ACCOUNT_SID';
        const accountSid = config.get(accountSidKey);

        if (!accountSid) {
          throw new MissingEnvironmentVariableException(accountSidKey);
        }

        const authTokenKey = 'TWILIO_AUTH_TOKEN';
        const authToken = config.get(authTokenKey);

        if (!authToken) {
          throw new MissingEnvironmentVariableException(authTokenKey);
        }

        return {
          accountSid,
          authToken,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [TwilioController],
  providers: [SmsService],
  exports: [SmsService],
})
export class CommunicationsModule {}
