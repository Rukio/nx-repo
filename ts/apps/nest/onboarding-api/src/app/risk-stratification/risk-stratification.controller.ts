import {
  Body,
  Controller,
  HttpException,
  Param,
  Post,
  Get,
  UseInterceptors,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiResponse,
  getSchemaPath,
  ApiParam,
} from '@nestjs/swagger';
import { Logger } from 'winston';

import {
  CareRequestAPIResponse,
  TimeSensitiveAnswerEvent,
  TimeSensitiveQuestion,
  TimeSensitiveScreeningResultResponse,
  SearchSymptomAliasesResponse,
} from '@*company-data-covered*/consumer-web-types';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { InjectLogger } from '../decorators/logger.decorator';

import RiskStratificationService from './risk-stratification.service';
import TimeSensitiveAnswerEventBodyDTO from './dto/time-sensitive-answer-event-body.dto';
import TimeSensitiveAnswerEventDTO from './dto/time-sensitive-answer-event.dto';
import TimeSensitiveScreeningResultBodyDTO from './dto/time-sensitive-screening-result-body.dto';
import TimeSensitiveQuestionsDTO from './dto/time-sensitive-questions.dto';
import SearchSymptomAliasesResponseDTO from './dto/search-symptom-aliases-response.dto';
import CareRequestSymptomsBodyDTO from './dto/care-request-symptoms.dto';
import SearchSymptomAliasesQueryDTO from './dto/search-symptom-aliases.dto';

import errorMapper from '../common/error-response-mapper';
import ResponseDto from '../common/response.dto';
import TimeSensitiveScreeningResultResponseDTO from './dto/time-sensitive-screening-result-response.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('risk-stratification')
@UseGuards(AuthGuard('aob'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.RiskStratification)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class RiskStratificationController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: RiskStratificationService
  ) {}

  @Post('time-sensitive-questions/:questionId/answer')
  @ApiOperation({
    summary: 'Publish an event with answer to Time Sensitive question',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(TimeSensitiveAnswerEventDTO),
            },
          },
        },
      ],
    },
  })
  @ApiParam({
    name: 'questionId',
    description: 'id of time sensitive question',
  })
  @ApiBody({
    type: TimeSensitiveAnswerEventBodyDTO,
    description: 'The data needed to publish time sensitive answer event',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async publishTimeSensitiveAnswerEvent(
    @Param('questionId') questionId: string,
    @Body() payload: TimeSensitiveAnswerEventBodyDTO
  ): Promise<CareRequestAPIResponse<TimeSensitiveAnswerEventDTO>> {
    try {
      const data: TimeSensitiveAnswerEvent =
        await this.service.publishTimeSensitiveAnswerEvent(questionId, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `RiskStratificationController error: ${error?.message}`,
        payload
      );
      throw new HttpException(
        {
          message: error?.message,
          errors: errorMapper.TransformErrors(error?.response?.data?.errors),
          statusCode: error?.response?.status,
        },
        error?.response?.status || 500
      );
    }
  }

  @Post('time-sensitive-questions/screening-result')
  @ApiOperation({
    summary: 'Creates or updates the result of screening',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [{ $ref: getSchemaPath(ResponseDto) }],
    },
  })
  @ApiBody({
    type: TimeSensitiveScreeningResultBodyDTO,
    description: 'The data needed to publish time sensitive answer event',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async upsertTimeSensitiveScreeningResult(
    @Body() payload: TimeSensitiveScreeningResultBodyDTO
  ): Promise<CareRequestAPIResponse<TimeSensitiveScreeningResultBodyDTO>> {
    try {
      return await this.service.upsertTimeSensitiveScreeningResult(payload);
    } catch (error) {
      this.logger.error(
        `RiskStratificationController error: ${error?.message}`,
        payload
      );
      throw new HttpException(
        {
          message: error?.message,
          errors: errorMapper.TransformErrors(error?.response?.data?.errors),
          statusCode: error?.response?.status,
        },
        error?.response?.status || 500
      );
    }
  }

  @Get('time-sensitive-questions')
  @ApiOperation({
    summary:
      'Retrieves the time sensitive questions for secondary screening intended for a registered nurse.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(TimeSensitiveQuestionsDTO),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getListTimeSensitiveQuestions(): Promise<{
    data: TimeSensitiveQuestion[];
    success: boolean;
  }> {
    try {
      const data = await this.service.getListTimeSensitiveQuestions();

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `RiskStratificationController error: ${error?.message}`
      );
      throw new HttpException(
        {
          message: error?.message,
          errors: errorMapper.TransformErrors(error?.response?.data?.errors),
          statusCode: error?.response?.status,
        },
        error?.response?.status || 500
      );
    }
  }

  @Get('time-sensitive-questions/screening-result/:careRequestId')
  @ApiOperation({
    summary:
      'Retrieves information about the Time Sensitive Screening survey for a given care request id',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(TimeSensitiveScreeningResultResponseDTO),
            },
          },
        },
      ],
    },
  })
  @ApiParam({
    name: 'careRequestId',
    description:
      'id of the CareRequest that has a time sensitive screening result recorded.',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getTimeSensitiveScreeningResult(
    @Param('careRequestId') careRequestId: string
  ): Promise<{
    data: TimeSensitiveScreeningResultResponse[];
    success: boolean;
  }> {
    try {
      const data: TimeSensitiveScreeningResultResponse[] =
        await this.service.getTimeSensitiveScreeningResult(careRequestId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `RiskStratificationController error: ${error?.message}`
      );
      throw new HttpException(
        {
          message: error?.message,
          errors: errorMapper.TransformErrors(error?.response?.data?.errors),
          statusCode: error?.response?.status,
        },
        error?.response?.status || 500
      );
    }
  }

  @Get('search-symptom-aliases')
  @ApiOperation({
    summary: 'Search for symptom aliases',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful retrieval of symptom aliases',
    type: SearchSymptomAliasesResponseDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async searchSymptomAliases(
    @Query() query: SearchSymptomAliasesQueryDTO
  ): Promise<{
    data: SearchSymptomAliasesResponse;
    success: boolean;
  }> {
    try {
      const data = await this.service.searchSymptomAliases(query);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `RiskStratificationController error: ${error?.message}`
      );
      throw new HttpException(
        {
          message: error?.message,
          errors: errorMapper.TransformErrors(error?.response?.data?.errors),
          statusCode: error?.response?.status,
        },
        error?.response?.status || 500
      );
    }
  }

  @Post('care-request-symptoms')
  @ApiOperation({
    summary:
      'Creates or updates the list of symptoms associated to a Care Request',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [{ $ref: getSchemaPath(ResponseDto) }],
    },
  })
  @ApiBody({
    type: CareRequestSymptomsBodyDTO,
    description:
      'The data needed to upsert a list of symptoms for a care request id',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async upsertCareRequestSymptoms(
    @Body() payload: CareRequestSymptomsBodyDTO
  ): Promise<CareRequestAPIResponse<CareRequestSymptomsBodyDTO>> {
    try {
      return await this.service.upsertCareRequestSymptoms(payload);
    } catch (error) {
      this.logger.error(
        `RiskStratificationController error: ${error?.message}`,
        payload
      );
      throw new HttpException(
        {
          message: error?.message,
          errors: errorMapper.TransformErrors(error?.response?.data?.errors),
          statusCode: error?.response?.status,
        },
        error?.response?.status || 500
      );
    }
  }
}
