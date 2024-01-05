import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import SelfScheduleService from './self-schedule.service';
import { InjectLogger } from '../decorators/logger.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import ResponseDto from '../common/response.dto';
import ErrorResponse from '../common/error-response';
import { BaseCheckMarketAvailabilityBodyDto } from '../market-availability/dto/markets-availability-check.dto';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import {
  BillingCityPlaceOfService,
  CareRequestAPIResponse,
  CheckMarketAvailability,
  OssCareRequest,
  EtaRange,
  ProtocolWithQuestions,
  RiskStratificationProtocolSearchParam,
  InsurancePayer,
  OSSUserCache,
  OssCareRequestStatusPayload,
  InsuranceNetwork,
  InsuranceClassification,
  CareRequest,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import errorMapper from '../common/error-response-mapper';
import UpdateCareRequestStatusDto from './dto/update-care-request-status.dto';
import { AuthGuard } from '@nestjs/passport';
import EtaRangeQueryDTO from './dto/create-eta-range.dto';
import CreateNotificationDto from './dto/create-notification.dto';
import RiskStratificationProtocolQueryDto from '../risk-stratification-protocols/dto/risk-stratification-protocol-query.dto';
import GetInsurancePayerDto from './dto/insurance-payer.dto';
import { OSSUserId } from '../decorators/oss-user-id.decorator';
import OSSUserCacheDto from './dto/oss-cache.dto';
import SearchInsuranceNetworksDto from '../insurance-networks/dto/insurance-networks-body.dto';
import InsuranceClassificationDto from '../insurance/dto/insurance-classification.dto';
import { CacheByUserIdPipe } from './pipes/cache-by-user-id.pipe';
import { CareRequestIdFromCachePipe } from './pipes/care-request-id-from-cache.pipe';
import CreateOssCareRequestBodyDto from './dto/care-request.dto';
import CareRequestDto from '../care-request/dto/care-request.dto';
import UpdateCareRequestDto from './dto/update-care-request.dto';
import OssChannelItemDto from './dto/oss-channel-item.dto';

@Controller('self-schedule')
@UseGuards(AuthGuard('oss'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.SelfSchedule)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class SelfScheduleController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: SelfScheduleService
  ) {}

  @Delete('notification/:jobId')
  @ApiOperation({
    summary: 'Cancel notification job for dispatcher',
  })
  @ApiParam({
    name: 'jobId',
    description: 'ID of notification job',
  })
  @ApiResponse({
    status: 200,
    type: ResponseDto,
  })
  async cancelNotification(
    @Param('jobId') jobId: string
  ): Promise<{ success: boolean }> {
    try {
      await this.service.cancelNotification(jobId);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `SelfScheduleController error: ${error?.message}`,
        jobId
      );

      return ErrorResponse(error);
    }
  }

  @Post('notification')
  @ApiOperation({
    summary: 'Create notification job for dispatcher',
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'The data that contains Care Request ID',
  })
  @ApiResponse({
    status: 200,
    type: ResponseDto,
  })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto
  ): Promise<{ success: boolean; jobId: string }> {
    const { careRequestId } = createNotificationDto;
    try {
      const data = await this.service.createNotification(careRequestId);

      return { success: true, jobId: data.jobId };
    } catch (error) {
      this.logger.error(
        `SelfScheduleController error: ${error?.message}`,
        careRequestId
      );

      return ErrorResponse(error);
    }
  }

  @Post('check-market-feasibility')
  @ApiBody({
    type: BaseCheckMarketAvailabilityBodyDto,
    description: 'The data needed to check Market Feasibility State',
  })
  @ApiOperation({
    summary: 'Retrieve Market feasibility state',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async checkMarketFeasibility(
    @Body() payload: BaseCheckMarketAvailabilityBodyDto
  ): Promise<CareRequestAPIResponse<CheckMarketAvailability>> {
    try {
      const data: CheckMarketAvailability =
        await this.service.checkMarketFeasibility(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`SelfSchedule error: ${error?.message}`, payload);

      return ErrorResponse(error);
    }
  }

  @Get('places-of-service/:billingCityId')
  @ApiParam({
    name: 'billingCityId',
    description: 'id of billing city',
  })
  @ApiOperation({
    summary: 'Retrieve places of service for billing city',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchPlacesOfService(
    @Param('billingCityId') billingCityId: string
  ): Promise<CareRequestAPIResponse<BillingCityPlaceOfService[]>> {
    try {
      const result: BillingCityPlaceOfService[] =
        await this.service.fetchPlacesOfService(billingCityId);

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(
        `SelfSchedule places of service error: ${error?.message}`,
        billingCityId
      );

      return ErrorResponse(error);
    }
  }

  @Post('care-request')
  @ApiBody({
    type: CreateOssCareRequestBodyDto,
    description: 'The data needed to create oss care request',
  })
  @ApiOperation({
    summary: 'create oss care request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiResponse({
    status: 201,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(CreateOssCareRequestBodyDto),
            },
          },
        },
      ],
    },
  })
  async createCareRequest(
    @Body()
    payload: OssCareRequest
  ): Promise<{ data: OssCareRequest; success: boolean }> {
    try {
      const data: OssCareRequest = await this.service.createCareRequest(
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `SelfScheduleController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Post('eta-ranges')
  @ApiOperation({
    summary: 'Set ETA range of the care team for Care Request',
  })
  @ApiBody({
    type: EtaRangeQueryDTO,
    description: 'The data needed to set eta of team',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async createEta(
    @Body() payload: EtaRangeQueryDTO
  ): Promise<CareRequestAPIResponse<EtaRange>> {
    try {
      const data: EtaRange = await this.service.createEta(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`SelfSchedule error: ${error?.message}`, payload);

      return ErrorResponse(error);
    }
  }

  @Get('insurance-payers')
  @ApiOperation({
    summary: 'Get insurance payers',
  })
  @UseValidationPipe()
  async getInsurancePayers(
    @Body() payload: GetInsurancePayerDto
  ): Promise<CareRequestAPIResponse<InsurancePayer[]>> {
    try {
      this.logger.info('getInsurancePayers');

      const data = await this.service.getInsurancePayers(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `SelfScheduleController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Get('risk-stratification-protocols/:protocolId')
  @ApiParam({
    name: 'protocolId',
    description: 'id of the risk stratification protocol',
  })
  @ApiQuery({
    type: RiskStratificationProtocolQueryDto,
    description: 'The data needed to get risk stratification',
  })
  @ApiOperation({
    summary: 'Get risk stratification protocol by id',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchRiskStratificationProtocol(
    @Query()
    riskStratificationProtocolSearchParam: RiskStratificationProtocolSearchParam,
    @Param('protocolId') protocolId: string
  ): Promise<CareRequestAPIResponse<ProtocolWithQuestions>> {
    try {
      const data: ProtocolWithQuestions =
        await this.service.fetchRiskStratificationProtocol(
          riskStratificationProtocolSearchParam,
          protocolId
        );

      return { success: true, data };
    } catch (error) {
      this.logger.error(`SelfScheduleController error: ${error?.message}`, [
        protocolId,
        riskStratificationProtocolSearchParam,
      ]);

      return ErrorResponse(error);
    }
  }

  @Get('cache')
  @ApiOperation({
    summary: 'Retrieve user OSS cache',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchCache(
    @OSSUserId() userId: string
  ): Promise<CareRequestAPIResponse<OSSUserCache>> {
    try {
      const result = await this.service.fetchCache(userId);

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`SelfSchedule get user cache error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }

  @Post('cache')
  @ApiOperation({
    summary: 'Save user OSS cache',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async saveCache(
    @OSSUserId() userId: string,
    @Body() payload: OSSUserCacheDto
  ): Promise<CareRequestAPIResponse<null>> {
    try {
      await this.service.setCache(userId, payload);

      return { success: true, data: null };
    } catch (error) {
      this.logger.error(
        `SelfSchedule save user cache error: ${error?.message}`
      );

      return ErrorResponse(error);
    }
  }

  @Patch('care-request-status')
  @ApiBody({
    type: UpdateCareRequestStatusDto,
    description: 'The data needed to update care request status',
  })
  @ApiOperation({
    summary: 'Update care request status',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async updateCareRequestStatus(
    @Body() payload: OssCareRequestStatusPayload
  ): Promise<CareRequestAPIResponse<boolean>> {
    try {
      const data = await this.service.updateCareRequestStatus(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `SelfScheduleController update care request status error: ${error?.message}`,
        [payload]
      );
      throw new HttpException(
        {
          message: error.message,
          errors: errorMapper.TransformErrors(error?.response?.data),
        },
        error?.response?.status || 500
      );
    }
  }

  @Post('insurance-networks')
  @ApiOperation({
    summary: 'Search insurance networks',
  })
  @UseValidationPipe()
  async searchInsuranceNetworks(
    @Body() payload: SearchInsuranceNetworksDto
  ): Promise<CareRequestAPIResponse<InsuranceNetwork[]>> {
    try {
      const data = await this.service.searchInsuranceNetworks(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `SelfScheduleController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Get('insurance-classifications')
  @ApiOperation({
    summary: 'Get all insurance classification data',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InsuranceClassificationDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getInsuranceClassifications(): Promise<
    CareRequestAPIResponse<InsuranceClassification[]>
  > {
    try {
      const insuranceClassifications = await this.service.getClassifications();

      return { success: true, data: insuranceClassifications };
    } catch (error) {
      this.logger.error(`SelfScheduleController error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }

  @Get('care-request')
  @ApiOperation({
    summary: 'Get care request',
  })
  @UseValidationPipe()
  async getCareRequest(
    @OSSUserId(CacheByUserIdPipe, CareRequestIdFromCachePipe)
    careRequestId: string
  ): Promise<CareRequestAPIResponse<CareRequest>> {
    try {
      const data: CareRequest = await this.service.getCareRequest(
        careRequestId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(`SelfScheduleController error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }

  @Put('care-request')
  @ApiBody({
    type: UpdateCareRequestDto,
    description: 'The data needed to update care request',
  })
  @ApiOperation({
    summary: 'Update care request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(CareRequestDto),
            },
          },
        },
      ],
    },
  })
  async updateCareRequest(
    @OSSUserId(CacheByUserIdPipe, CareRequestIdFromCachePipe) id: string,
    @Body() payload: Omit<CareRequest, 'id'>
  ): Promise<CareRequestAPIResponse<CareRequest>> {
    try {
      const data: CareRequest = await this.service.updateCareRequest(
        id,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(`SelfScheduleController error: ${error?.message}`, [
        id,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Get('channel-items/:id')
  @ApiParam({
    name: 'id',
    description: 'id of the channel item',
  })
  @ApiOperation({
    summary: 'Get channel item by id',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiExtraModels(ResponseDto, OssChannelItemDto)
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(OssChannelItemDto),
            },
          },
        },
      ],
    },
  })
  async fetchChannelItem(
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<Pick<ChannelItem, 'id' | 'name'>>> {
    try {
      const data: ChannelItem = await this.service.fetchChannelItem(id);

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
        },
      };
    } catch (error) {
      this.logger.error(
        `SelfScheduleController fetchChannelItem error: ${error?.message}`,
        id
      );

      return ErrorResponse(error);
    }
  }
}
