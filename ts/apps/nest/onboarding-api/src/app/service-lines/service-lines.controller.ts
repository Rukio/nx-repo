import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ServiceLine,
  ServiceLineQuestionResponse,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { ApiTagsText } from '../swagger';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import ServiceLineQuestionResponseDto, {
  CreateServiceLineQuestionResponseDto,
  UpdateServiceLineQuestionResponseDto,
} from './dto/service-line-question.dto';
import ServiceLinesService from './service-lines.service';
import ServiceLineDto from './dto/service-lines.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('service-lines')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.ServiceLines)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export class ServiceLinesController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly serviceLinesService: ServiceLinesService
  ) {}

  @Get('possible-service-lines')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiOperation({
    summary: 'Retrieve all possible service lines for Care Request',
  })
  @ApiOkResponse({
    type: ServiceLineDto,
    isArray: true,
  })
  async fetchAll(
    @Query('careRequestId') careRequestId: number
  ): Promise<{ success: boolean; data: ServiceLine[] } | unknown> {
    try {
      const possibleServiceLines = await this.serviceLinesService.fetchAll(
        careRequestId
      );

      if (!possibleServiceLines) {
        return { success: false, data: [] };
      }

      return { success: true, data: possibleServiceLines };
    } catch (error) {
      this.logger.error(
        `ServiceLinesController error: ${error?.message}`,
        careRequestId
      );

      return ErrorResponse(error);
    }
  }

  @Get('service-line-911')
  @ApiOperation({
    summary: 'Retrieve 911 service line for Care Request',
  })
  @ApiOkResponse({
    type: ServiceLineDto,
    isArray: false,
  })
  async fetch911ServiceLine(): Promise<
    { success: boolean; data: ServiceLine } | unknown
  > {
    try {
      const nineOneOneServiceLine =
        await this.serviceLinesService.get911ServiceLine();

      return { success: true, data: nineOneOneServiceLine };
    } catch (error) {
      this.logger.error(`ServiceLinesController error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }

  @Get('service-lines-question-response')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiOperation({
    summary: 'Retrieve service line question response for Care Request',
  })
  @ApiOkResponse({
    type: ServiceLineQuestionResponseDto,
    isArray: false,
  })
  async fetch(
    @Query('careRequestId') careRequestId: number
  ): Promise<
    { success: boolean; data: ServiceLineQuestionResponse } | unknown
  > {
    try {
      const serviceLineQuestionResponse = await this.serviceLinesService.fetch(
        careRequestId
      );

      return { success: true, data: serviceLineQuestionResponse };
    } catch (error) {
      this.logger.error(
        `ServiceLinesController error: ${error?.message}`,
        careRequestId
      );

      return ErrorResponse(error);
    }
  }

  @Post('service-lines-question-response')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiBody({
    type: CreateServiceLineQuestionResponseDto,
    description: 'The data needed to create service line question response',
  })
  @ApiOperation({
    summary: 'Create service line question response for Care Request',
  })
  @ApiOkResponse({
    type: ServiceLineQuestionResponseDto,
    isArray: false,
  })
  async create(
    @Query('careRequestId') careRequestId: number,
    @Body()
    payload: CreateServiceLineQuestionResponseDto
  ): Promise<
    { success: boolean; data: ServiceLineQuestionResponse } | unknown
  > {
    try {
      const serviceLineQuestionResponse = await this.serviceLinesService.create(
        careRequestId,
        payload
      );

      return { success: true, data: serviceLineQuestionResponse };
    } catch (error) {
      this.logger.error(
        `ServiceLinesController error: ${error?.message}`,
        careRequestId,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Put('service-lines-question-response')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiBody({
    type: UpdateServiceLineQuestionResponseDto,
    description: 'The data needed to update service line question response',
  })
  @ApiOperation({
    summary: 'update service line question response for Care Request',
  })
  @ApiOkResponse({
    type: ServiceLineQuestionResponseDto,
    isArray: false,
  })
  async update(
    @Query('careRequestId') careRequestId: number,
    @Body()
    payload: UpdateServiceLineQuestionResponseDto
  ): Promise<
    { success: boolean; data: ServiceLineQuestionResponse } | unknown
  > {
    try {
      const serviceLineQuestionResponse = await this.serviceLinesService.update(
        careRequestId,
        payload
      );

      return { success: true, data: serviceLineQuestionResponse };
    } catch (error) {
      this.logger.error(
        `ServiceLinesController error: ${error?.message}`,
        careRequestId,
        payload
      );

      return ErrorResponse(error);
    }
  }
}
