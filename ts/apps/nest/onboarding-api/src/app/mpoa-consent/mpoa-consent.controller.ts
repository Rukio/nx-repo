import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CareRequestAPIResponse } from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import MpoaConsentService from './mpoa-consent.service';
import MpoaConsentDto from './dto/mpoa-consent.dto';
import CreateMpoaConsentDto from './dto/create-mpoa-consent.dto';
import UpdateMpoaConsentDto from './dto/update-mpoa-consent.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('mpoa-consents')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.MPOAConsents)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class MpoaConsentController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: MpoaConsentService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get MPOA consent by care request id',
  })
  @UseValidationPipe()
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  async get(
    @Query('careRequestId') careRequestId: number
  ): Promise<CareRequestAPIResponse<MpoaConsentDto>> {
    try {
      const data: MpoaConsentDto = await this.service.get(careRequestId);
      if (!data) {
        return { success: false, data: undefined };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `MPOAConsentController error: ${error?.message}`,
        careRequestId
      );

      return ErrorResponse(error);
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create MPOA consent',
  })
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiBody({
    type: CreateMpoaConsentDto,
    description: 'The data needed to create MPOA consent',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async create(
    @Query('careRequestId') careRequestId: number,
    @Body() payload: CreateMpoaConsentDto
  ): Promise<CareRequestAPIResponse<MpoaConsentDto>> {
    try {
      const data: MpoaConsentDto = await this.service.create(
        payload,
        careRequestId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(`MPOAConsentController error: ${error?.message}`, [
        careRequestId,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Patch(':mpoaConsentId')
  @ApiOperation({
    summary: 'Update MPOA Consent',
  })
  @ApiParam({
    name: 'mpoaConsentId',
    description: 'id of MPOA Consent',
  })
  @ApiBody({
    type: UpdateMpoaConsentDto,
    description: 'The data needed to update MPOA consent',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(
    @Param('mpoaConsentId') mpoaConsentId: number,
    @Body() payload: UpdateMpoaConsentDto
  ): Promise<CareRequestAPIResponse<MpoaConsentDto>> {
    try {
      const data: MpoaConsentDto = await this.service.update(
        mpoaConsentId,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(`MPOAConsentController error: ${error?.message}`, [
        mpoaConsentId,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }
}
