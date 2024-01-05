import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiGoneResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UseValidationPipe } from '../decorators/api-use-validation-pipe.decorator';
import { ApiTagsText } from '../swagger';
import { CompanionAuthGuard } from './companion-auth.guard';
import { CompanionLinkStatusInterceptor } from './companion-link-status.interceptor';
import { CompanionService } from './companion.service';
import { CompanionAuthenticationRequestBody } from './companion.strategy';
import { CompanionInfoDto } from './dto/companion-info.dto';
import { DashboardWebhookDtoV1 } from './dto/dashboard-webhook-v1.dto';
import {
  WebhookResponseDto,
  WebhookOnSceneResponseDto,
  WebhookOnRouteResponseDto,
  WebhookCreateLinkResponseDto,
  WebhookResponseType,
} from './dto/webhook-response.dto';
import { CareRequestStatusText } from '../care-request/enums/care-request-status.enum';
import { Request } from 'express';
import {
  COMPANION_LINK_EXPIRED_ERROR_TEXT,
  COMPANION_LINK_NOT_FOUND_ERROR_TEXT,
  COMPANION_LINK_VALID_TEXT,
  ApiCompanionLinkIdParam,
  Link,
} from './common';
import { ThrottleWithConfig } from '../decorators/throttle-with-config.decorator';
import { DashboardWebhookCareRequest } from '../dashboard/types/dashboard-care-request';
import { CompanionLinkAnalytics } from './dto/companion-link-analytics.dto';
import { CompanionLinkWithTasks } from './interfaces/companion-link.interface';
import { Mutex } from 'redis-semaphore';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { InjectLogger } from '../logger/logger.decorator';
import { DashboardWebhookDtoV2 } from './dto/dashboard-webhook-v2.dto';
import { CareTeamEtaDto } from './dto/care-team-eta-dto';
import { InjectRedis } from '../redis';

@Controller()
@ApiTags(ApiTagsText.Companion)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class CompanionController implements OnModuleDestroy {
  constructor(
    private readonly companionService: CompanionService,
    @InjectRedis() private readonly redis: Redis,
    @InjectLogger() private logger: Logger
  ) {}

  onModuleDestroy() {
    this.redis.disconnect();
  }

  @Post('/webhook/eta-range')
  @UseValidationPipe()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Perform actions in response to eta-range webhooks received.`,
    description: `Performs one of the following actions:
      1. If the care request status is "committed", "scheduled", or "accepted" cancel and re-queue running late SMS with new ETA.
      2. If the care request status is "requested", "on scene", "on route", or "complete" move the running late SMS to the completed queue.`,
  })
  @ApiOkResponse({
    description: `The running late SMS has been appropriately updated or archived`,
  })
  @ApiBody({
    schema: {
      oneOf: [
        {
          $ref: `#/components/schemas/${DashboardWebhookDtoV2.name}`,
        },
      ],
    },
  })
  @ApiExtraModels()
  async handleEtaRangeWebhook(
    @Body() webhookEvent: DashboardWebhookDtoV2
  ): Promise<WebhookResponseDto> {
    const loggerMetadata = {
      careRequestId: webhookEvent.care_request_id,
      careRequestStatus: webhookEvent.request_status,
    };

    this.logger.debug(
      'Processing companion eta-range webhook for care request.',
      loggerMetadata
    );
    const careRequestId = webhookEvent.care_request_id;
    const mutex = new Mutex(
      this.redis,
      `CompanionController:Webhook:${careRequestId}`
    );

    await mutex.acquire();
    this.logger.debug(
      'Mutex acquired for care request webhook handler.',
      loggerMetadata
    );

    try {
      this.companionService.handleEtaRangeEvent(webhookEvent);

      return { type: WebhookResponseType.CompanionUpdatedEta };
    } finally {
      await mutex.release();
      this.logger.debug(
        'Mutex released for care request webhook handler.',
        loggerMetadata
      );
    }
  }

  @Post('/webhook')
  @UseValidationPipe()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Perform various actions in response to webhooks received from Dashboard.`,
    description: `Performs one of the following actions:
      1. If the care request is in the "accepted" or "scheduled" status sends the companion link to the care request associated phone number using SMS.
      2. If the care request is in the "on route" status, call the appropriate Twilio Flow and creates a note with the completed tasks.
      3. If the care request is in the "on scene" status, send an SMS notification to the patient about the care team's arrival on-scene.`,
  })
  @ApiOkResponse({
    description: `The map from link to care request has been created successfully.`,
    schema: {
      oneOf: [
        {
          $ref: `#/components/schemas/${WebhookOnSceneResponseDto.name}`,
        },
        {
          $ref: `#/components/schemas/${WebhookCreateLinkResponseDto.name}`,
        },
        {
          $ref: `#/components/schemas/${WebhookOnRouteResponseDto.name}`,
        },
      ],
      discriminator: {
        propertyName: 'type',
      },
    },
  })
  @ApiBody({
    schema: {
      oneOf: [
        {
          $ref: `#/components/schemas/${DashboardWebhookDtoV2.name}`,
        },
        {
          $ref: `#/components/schemas/${DashboardWebhookDtoV1.name}`,
        },
      ],
    },
  })
  @ApiExtraModels(
    WebhookOnSceneResponseDto,
    WebhookCreateLinkResponseDto,
    WebhookOnRouteResponseDto,
    DashboardWebhookDtoV1,
    DashboardWebhookDtoV2
  )
  async handleDashboardWebhook(
    @Body() webhookCareRequest: DashboardWebhookDtoV1 | DashboardWebhookDtoV2
  ): Promise<WebhookResponseDto> {
    const careRequestData: DashboardWebhookCareRequest =
      'care_request' in webhookCareRequest
        ? JSON.parse(webhookCareRequest.care_request)
        : {
            external_id: webhookCareRequest.care_request_id,
            request_status: webhookCareRequest.request_status,
          };
    const loggerMetadata = {
      careRequestId: careRequestData.external_id,
      careRequestStatus: careRequestData.request_status,
    };

    this.logger.debug(
      'Processing companion webhook for care request.',
      loggerMetadata
    );
    const careRequestId = careRequestData.external_id;
    const mutex = new Mutex(
      this.redis,
      `CompanionController:Webhook:${careRequestId}`
    );

    await mutex.acquire();
    this.logger.debug(
      'Mutex acquired for care request webhook handler.',
      loggerMetadata
    );

    try {
      switch (careRequestData.request_status as CareRequestStatusText) {
        case CareRequestStatusText.Requested:
          return { type: WebhookResponseType.CompanionNoOp };
        case CareRequestStatusText.Accepted:
        case CareRequestStatusText.Scheduled: {
          const linkId = await this.companionService.createCompanionLink(
            careRequestData
          );

          return {
            linkId: linkId,
            type: WebhookResponseType.CompanionCreateLink,
          };
        }
        case CareRequestStatusText.OnScene:
          await this.companionService.onCareRequestOnScene(careRequestId);

          return { type: WebhookResponseType.CompanionOnScene };
        case CareRequestStatusText.OnRoute:
          await this.companionService.onCareRequestOnRoute(careRequestId);

          return { type: WebhookResponseType.CompanionOnRoute };
        default:
          throw new BadRequestException({
            message: `No handler for given care request status`,
            careRequestStatus: careRequestData.request_status,
            careRequestId: careRequestId,
          });
      }
    } finally {
      await mutex.release();
      this.logger.debug(
        'Mutex released for care request webhook handler.',
        loggerMetadata
      );
    }
  }

  @Get(':linkId')
  @ThrottleWithConfig({
    ttlKey: 'THROTTLE_TTL_COMPANION_LINK',
    limitKey: 'THROTTLE_LIMIT_COMPANION_LINK',
    ttlDefault: 60,
    limitDefault: 20,
  })
  @UseGuards(CompanionAuthGuard)
  @UseInterceptors(CompanionLinkStatusInterceptor)
  @ApiOperation({
    summary: `Retrieves the data needed to display in the companion experience.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiOkResponse({
    description: `The minimum required info for the companion experience.`,
    type: CompanionInfoDto,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiGoneResponse({ description: COMPANION_LINK_EXPIRED_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getCompanionInfoByLinkId(
    @Req() request: Request
  ): Promise<CompanionInfoDto> {
    return request.body.careRequestInfo;
  }

  @Post(':linkId/auth')
  @HttpCode(HttpStatus.OK)
  @ThrottleWithConfig({
    ttlKey: 'THROTTLE_TTL_AUTH',
    limitKey: 'THROTTLE_LIMIT_AUTH',
    ttlDefault: 60,
    limitDefault: 30,
  })
  @UseGuards(CompanionAuthGuard)
  @ApiOperation({
    summary: `The authentication endpoint for the companion experience.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiBody({
    description: `The authentication info for the companion experience.`,
    type: CompanionAuthenticationRequestBody,
  })
  @ApiOkResponse({ description: 'Authentication successful' })
  @ApiUnauthorizedResponse({ description: 'Authentication unsuccessful.' })
  authenticate(): void {
    return;
  }

  @Get(':linkId/status')
  @UseInterceptors(CompanionLinkStatusInterceptor)
  @ApiOperation({ summary: `Retrieves the current status of the link.` })
  @ApiCompanionLinkIdParam()
  @ApiOkResponse({ description: COMPANION_LINK_VALID_TEXT })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiGoneResponse({ description: COMPANION_LINK_EXPIRED_ERROR_TEXT })
  async getCompanionLinkStatusByLinkId(): Promise<void> {
    return;
  }

  @Get(':linkId/analytics')
  @UseInterceptors(CompanionLinkStatusInterceptor)
  @ApiOperation({ summary: `Retrieves the current status of the link.` })
  @ApiCompanionLinkIdParam()
  @ApiOkResponse({
    description: COMPANION_LINK_VALID_TEXT,
    type: CompanionLinkAnalytics,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiGoneResponse({ description: COMPANION_LINK_EXPIRED_ERROR_TEXT })
  async getCompanionLinkAnalyticsInfo(
    @Link() link: CompanionLinkWithTasks
  ): Promise<CompanionLinkAnalytics> {
    return this.companionService.getAnalyticsInfo(link);
  }

  @Get(':linkId/care-team-eta')
  @UseGuards(CompanionAuthGuard)
  @UseInterceptors(CompanionLinkStatusInterceptor)
  @ApiOperation({ summary: `Retrieves the care team ETA.` })
  @ApiCompanionLinkIdParam()
  @ApiOkResponse({
    description: `The care team ETA in unix time seconds with precision type: (unspecified, coarse, en route realtime)`,
    type: CareTeamEtaDto,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiGoneResponse({ description: COMPANION_LINK_EXPIRED_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getCareTeamEta(
    @Link() link: CompanionLinkWithTasks
  ): Promise<CareTeamEtaDto> {
    return this.companionService.getCareTeamEta(link);
  }
}
