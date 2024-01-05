import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
  Query,
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
import {
  CareRequestAPIResponse,
  EdRefusalQuestionnaire,
  StationEdRefusalQuestionnaire,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import EdRefusalQuestionnairesQueryDto from './dto/ed-refusal-questionnaires-query.dto';
import EdRefusalQuestionnariesDto from './dto/ed-refusal-questionnaries.dto';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import EdRefusalQuestionnairesService from './ed-refusal-questionnaires.service';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import EdRefusalQuestionnariesResponseDto from './dto/ed-refusal-questionnaires-response.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('ed-refusal-questionnaires')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.EdRefusalQuestionnaires)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class EdRefusalQuestionnairesController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: EdRefusalQuestionnairesService
  ) {}

  @Post()
  @ApiQuery({
    type: EdRefusalQuestionnairesQueryDto,
    description: 'The query needed to create ED refusal questionnaire',
  })
  @ApiBody({
    type: EdRefusalQuestionnariesDto,
    description: 'The data needed to create ED refusal questionnaire',
  })
  @ApiOperation({
    summary: 'Create ED refusal questionnaire for Care Request',
  })
  @ApiResponse({
    type: EdRefusalQuestionnariesResponseDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async create(
    @Body() payload: EdRefusalQuestionnariesDto,
    @Query() query: EdRefusalQuestionnairesQueryDto
  ): Promise<CareRequestAPIResponse<EdRefusalQuestionnaire>> {
    try {
      const data: StationEdRefusalQuestionnaire = await this.service.create(
        query.careRequestId,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `EdRefusalQuestionnairesController error: ${error?.message}`,
        [query, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Get()
  @ApiQuery({
    type: EdRefusalQuestionnairesQueryDto,
    description: 'The query needed to get ED refusal questionnaire',
  })
  @ApiOperation({
    summary: 'Retrieve ED refusal questionnaires for Care Request',
  })
  @ApiResponse({
    type: [EdRefusalQuestionnariesResponseDto],
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAll(
    @Query() query: EdRefusalQuestionnairesQueryDto
  ): Promise<CareRequestAPIResponse<EdRefusalQuestionnaire[]>> {
    try {
      const data: EdRefusalQuestionnaire[] = await this.service.fetchAll(
        query.careRequestId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `EdRefusalQuestionnairesController error: ${error?.message}`
      );

      return ErrorResponse(error);
    }
  }

  @Put(':id')
  @ApiParam({
    name: 'id',
    description: 'id of ED refusal questionnaire',
  })
  @ApiQuery({
    type: EdRefusalQuestionnairesQueryDto,
    description: 'The query needed to update ED refusal questionnaire',
  })
  @ApiBody({
    type: EdRefusalQuestionnariesDto,
    description: 'The data needed to update ED refusal questionnaire',
  })
  @ApiResponse({
    type: EdRefusalQuestionnariesResponseDto,
  })
  @ApiOperation({
    summary: 'Update ED refusal questionnaire for Care Request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(
    @Body() payload: EdRefusalQuestionnariesDto,
    @Query() query: EdRefusalQuestionnairesQueryDto,
    @Param('id') id: number | string
  ): Promise<CareRequestAPIResponse<EdRefusalQuestionnaire>> {
    try {
      const data: EdRefusalQuestionnaire = await this.service.update(
        query.careRequestId,
        id,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `EdRefusalQuestionnairesController error: ${error?.message}`,
        [id, query, payload]
      );

      return ErrorResponse(error);
    }
  }
}
