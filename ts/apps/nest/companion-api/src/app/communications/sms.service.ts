import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from 'nestjs-twilio';
import { Logger } from 'winston';
import { InjectLogger } from '../logger/logger.decorator';
import { parsePhoneNumberWithError, PhoneNumber } from 'libphonenumber-js';
import { MissingEnvironmentVariableException } from '../common/exceptions/missing-environment-variable.exception';
import { DH_HQ_PHONE_NUMBER } from '../common/constants';
import StudioBase = require('twilio/lib/rest/StudioBase');
import { MetricType } from './enums/metric-type.enum';

@Injectable()
export class SmsService {
  private fromNumber: string;

  constructor(
    private readonly service: TwilioService,
    private datadog: DatadogService,
    @InjectLogger() private logger: Logger,
    config: ConfigService
  ) {
    const fromNumberKey = 'TWILIO_FROM_NUMBER';
    const fromNumber = config.get(fromNumberKey);

    if (!fromNumber) {
      throw new MissingEnvironmentVariableException(fromNumberKey);
    }
    this.fromNumber = fromNumber;
  }

  /** Executes a given Twilio Flow. */
  async executeFlow(
    flowSid: string,
    toPhoneNumberString: string,
    parameters: Record<string, string>
  ) {
    try {
      const parsedPhoneNumber = this.parsePhoneNumber(toPhoneNumberString);

      if (this.isSendable(parsedPhoneNumber)) {
        const twilioResponse = await (
          this.service.client.studio as StudioBase
        ).v2
          .flows(flowSid)
          .executions.create({
            from: this.fromNumber,
            to: toPhoneNumberString,
            parameters: parameters,
          });

        this.datadog.increment(MetricType.CompanionTwilioExecutions, 1, {
          flowSid,
          messageType: parameters.messageType,
          status: parameters.status,
          careRequestId: parameters.careRequestId,
        });

        this.logger.debug(`Twilio Flow executed successfully.`, {
          messageType: parameters.messageType,
          accountSID: twilioResponse.accountSid,
          messageSID: twilioResponse.sid,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Error executing Twilio Flow: ${error.message}`;
      }

      throw error;
    }
  }

  private parsePhoneNumber(toPhoneNumberString: string) {
    try {
      return parsePhoneNumberWithError(toPhoneNumberString);
    } catch (error) {
      let message = `Unknown Error`;

      if (error instanceof Error) {
        message = `Unable to parse provided phone number: ${toPhoneNumberString}. Received error: ${error.message}`;
      }

      throw new Error(message);
    }
  }

  private isSendable(phoneNumber: PhoneNumber): boolean {
    const dhPhoneNumber = this.parsePhoneNumber(DH_HQ_PHONE_NUMBER);

    return !phoneNumber.isEqual(dhPhoneNumber);
  }
}
