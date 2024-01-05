import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { UseValidationPipe } from '../decorators/api-use-validation-pipe.decorator';
import { ApiTagsText } from '../swagger';
import { Logger } from 'winston';
import { InjectLogger } from '../logger/logger.decorator';
import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { TwilioValidRequestGuard } from './twilio-valid-request.guard';
import { TwilioWebhookBodyDto } from './dto/twilio-webhook-body.dto';

@Controller('twilio')
@ApiTags(ApiTagsText.Twilio)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class TwilioController {
  constructor(
    private datadog: DatadogService,
    @InjectLogger() private logger: Logger
  ) {}

  @Post('/error/webhook')
  @UseValidationPipe()
  @UseGuards(TwilioValidRequestGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Forward events to DataDog in response to Twilio Error webhooks received.`,
  })
  @ApiOkResponse({
    description: `The Twilio Error has successfully been forwarded to DataDog`,
  })
  async handleTwilioErrorWebhook(@Body() body: TwilioWebhookBodyDto) {
    this.logger.info('Received Twilio Error Webhook', body);
    this.datadog.histogram('twilio_error', 1);
  }
}
