import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Post,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RiskAssessment } from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import RiskAssessmentDto from './dto/risk-assessment.dto';
import RiskAssessmentService from './risk-assessment.service';
import RiskAssessmentBodyDto from './dto/risk-assessment-body.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('risk-assessments')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.RiskAssessments)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export class RiskAssessmentController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly riskAssessmentService: RiskAssessmentService
  ) {}

  @Get()
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiOperation({
    summary: 'Retrieve risk assessment for Care Request',
  })
  async fetchAll(
    @Query('careRequestId') careRequestId: number
  ): Promise<{ success: boolean; data: RiskAssessment } | unknown> {
    try {
      const riskAssessment: RiskAssessment =
        await this.riskAssessmentService.fetch(careRequestId);

      return { success: true, data: riskAssessment };
    } catch (error) {
      this.logger.error(
        `RiskAssessmentController error: ${error?.message}`,
        careRequestId
      );

      return ErrorResponse(error);
    }
  }

  @Get(':riskAssessmentId')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiParam({
    name: 'riskAssessmentId',
    description: 'id of Risk Assessment',
  })
  @ApiOperation({
    summary: 'Retrieve risk assessment for Care Request',
  })
  @ApiResponse({
    type: RiskAssessmentDto,
  })
  async fetch(
    @Query('careRequestId') careRequestId: number,
    @Param('riskAssessmentId') riskAssessmentId: number
  ): Promise<{ success: boolean; data: RiskAssessment } | unknown> {
    try {
      const riskAssessment: RiskAssessment =
        await this.riskAssessmentService.fetch(careRequestId, riskAssessmentId);

      return { success: true, data: riskAssessment };
    } catch (error) {
      this.logger.error(
        `RiskAssessmentController error: ${error?.message}`,
        careRequestId,
        riskAssessmentId
      );

      return ErrorResponse(error);
    }
  }

  @Post()
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiBody({
    type: RiskAssessmentBodyDto,
    description: 'The data needed to create risk assessment',
  })
  @ApiOperation({
    summary: 'create risk assessment for Care Request',
  })
  @ApiResponse({
    type: RiskAssessmentDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async create(
    @Query('careRequestId') careRequestId: number,
    @Body() payload: RiskAssessmentBodyDto
  ): Promise<{ success: boolean; data: RiskAssessment } | unknown> {
    try {
      const riskAssessment: RiskAssessment =
        await this.riskAssessmentService.create(careRequestId, payload);

      return { success: true, data: riskAssessment };
    } catch (error) {
      this.logger.error(
        `RiskAssessmentController error: ${error?.message}`,
        careRequestId,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Patch(':riskAssessmentId')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiParam({
    name: 'riskAssessmentId',
    description: 'id of Risk Assessment',
  })
  @ApiOperation({
    summary: 'Updates risk assessment for Care Request',
  })
  @ApiBody({
    type: RiskAssessmentBodyDto,
    description: 'The data needed to create risk assessment',
  })
  @ApiResponse({
    type: RiskAssessmentDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(
    @Query('careRequestId') careRequestId: number,
    @Param('riskAssessmentId') riskAssessmentId: number,
    @Body() payload: RiskAssessmentBodyDto
  ): Promise<{ success: boolean; data: RiskAssessment } | unknown> {
    try {
      const riskAssessment: RiskAssessment =
        await this.riskAssessmentService.update(
          careRequestId,
          riskAssessmentId,
          payload
        );

      return { success: true, data: riskAssessment };
    } catch (error) {
      this.logger.error(
        `RiskAssessmentController error: ${error?.message}`,
        careRequestId,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Delete(':riskAssessmentId')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiParam({
    name: 'riskAssessmentId',
    description: 'id of Risk Assessment',
  })
  @ApiOperation({
    summary: 'Delete risk assessment of Care Request',
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async delete(
    @Query('careRequestId') careRequestId: number,
    @Param('riskAssessmentId') riskAssessmentId: number
  ): Promise<{ success: boolean } | unknown> {
    try {
      return await this.riskAssessmentService.delete(
        careRequestId,
        riskAssessmentId
      );
    } catch (error) {
      this.logger.error(
        `RiskAssessmentController error: ${error?.message}`,
        careRequestId,
        riskAssessmentId
      );

      return ErrorResponse(error);
    }
  }
}
