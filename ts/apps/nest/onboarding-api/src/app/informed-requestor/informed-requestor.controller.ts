import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  InformedRequestor,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import InformedRequestorsDto from './dto/informer-requestor.dto';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import InformedRequestorsService from './informed-requestor.service';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('informed-requestors')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.InformedRequestors)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class InformedRequestorsController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: InformedRequestorsService
  ) {}

  @Post()
  @ApiBody({
    type: InformedRequestorsDto,
    description: 'The data needed to save informed requestor answers',
  })
  @ApiOperation({
    summary: 'Save informed requestor answers for Care Request',
  })
  @ApiResponse({
    type: InformedRequestorsDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async create(
    @Body() payload: InformedRequestorsDto
  ): Promise<CareRequestAPIResponse<InformedRequestor>> {
    try {
      const data: InformedRequestor = await this.service.create(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InformedRequestorsController error: ${error?.message}`,
        [payload]
      );

      return ErrorResponse(error);
    }
  }

  @Patch()
  @ApiBody({
    type: InformedRequestorsDto,
    description: 'The data needed to update informed requestor answers',
  })
  @ApiOperation({
    summary: 'Update informed requestor answers for Care Request',
  })
  @ApiResponse({
    type: InformedRequestorsDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(
    @Body() payload: InformedRequestorsDto
  ): Promise<CareRequestAPIResponse<InformedRequestor>> {
    try {
      const data: InformedRequestor = await this.service.update(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InformedRequestorsController error: ${error?.message}`,
        [payload]
      );

      return ErrorResponse(error);
    }
  }

  @Get(':careRequestId')
  @ApiOperation({
    summary: 'Fetch informed requestor answers for Care Request',
  })
  @ApiParam({
    name: 'careRequestId',
    description: 'id of care request',
  })
  @ApiResponse({
    type: InformedRequestorsDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetch(
    @Param('careRequestId') careRequestId: number
  ): Promise<CareRequestAPIResponse<InformedRequestor>> {
    try {
      const data: InformedRequestor = await this.service.fetch(careRequestId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InformedRequestorsController error: ${error?.message}`,
        [careRequestId]
      );

      return ErrorResponse(error);
    }
  }
}
