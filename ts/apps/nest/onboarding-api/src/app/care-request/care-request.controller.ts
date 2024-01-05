import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import {
  CareRequest,
  CareRequestAPIResponse,
  TimeWindowsAvailability,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import CareRequestService from './care-request.service';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import CareRequestDto from './dto/care-request.dto';
import AcceptCareRequestIfFeasibleDto from './dto/accept-care-request-if-feasible.dto';
import UpdateCareRequestStatusDto from './dto/update-care-request-status.dto';
import ResponseDto from '../common/response.dto';
import AssignChannelItem from './dto/assign-channel-item.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import CareRequestBodyDto from './dto/care-request-body.dto';
import errorMapper from '../common/error-response-mapper';
import ErrorResponse from '../common/error-response';
import status from '../common/http-status-codes';

@Controller('care-requests')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.CareRequest)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class CareRequestController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: CareRequestService
  ) {}

  @Post()
  @ApiBody({
    type: CareRequestBodyDto,
    description: 'The data needed to create care request',
  })
  @ApiOperation({
    summary: 'create care request',
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
              $ref: getSchemaPath(CareRequestDto),
            },
          },
        },
      ],
    },
  })
  async create(
    @Body() payload: Omit<CareRequest, 'id'>
  ): Promise<CareRequestAPIResponse<CareRequest>> {
    try {
      const data: CareRequest = await this.service.create(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `CareRequestController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve care request',
  })
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
  async fetch(
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<CareRequest>> {
    try {
      const data: CareRequest = await this.service.fetch(id);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, id);

      return ErrorResponse(error);
    }
  }

  @Put(':id')
  @ApiParam({
    name: 'id',
    description: 'id of care request',
  })
  @ApiBody({
    type: CareRequestDto,
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
  async update(
    @Param('id') id: string,
    @Body() payload: Omit<CareRequest, 'id'>
  ): Promise<CareRequestAPIResponse<CareRequest>> {
    try {
      const data: CareRequest = await this.service.update(id, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, [
        id,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    description: 'id of care request',
  })
  @ApiBody({
    type: CareRequestDto,
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
  async patch(
    @Param('id') id: string,
    @Body() payload: Partial<CareRequest>
  ): Promise<CareRequestAPIResponse<CareRequest>> {
    try {
      const data: CareRequest = await this.service.patch(id, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, [
        id,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Patch(':id/status')
  @ApiParam({
    name: 'id',
    description: 'id of care request',
  })
  @ApiBody({
    type: UpdateCareRequestStatusDto,
    description: 'The data needed to update care request status',
  })
  @ApiOperation({
    summary: 'Update care request status',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() payload: UpdateCareRequestStatusDto
  ): Promise<CareRequestAPIResponse<boolean>> {
    try {
      const data: boolean = await this.service.updateStatus(id, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, [
        id,
        payload,
      ]);
      throw new HttpException(
        {
          message: error.message,
          errors: errorMapper.TransformErrors(error?.response?.data),
        },
        error?.response?.status || 500
      );
    }
  }

  @Patch(':id/accept-if-feasible')
  @ApiParam({
    name: 'id',
    description: 'id of care request',
  })
  @ApiBody({
    type: AcceptCareRequestIfFeasibleDto,
    description: 'The data needed to accept the care request',
  })
  @ApiOperation({
    summary: 'Accept care request if feasible',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async acceptIfFeasible(
    @Param('id') id: string,
    @Body() payload: Omit<AcceptCareRequestIfFeasibleDto, 'status'>
  ): Promise<CareRequestAPIResponse<boolean>> {
    try {
      const data: boolean = await this.service.acceptIfFeasible(id, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, [
        id,
        payload,
      ]);

      throw new HttpException(
        {
          message: error.message,
          errors: error?.response?.data?.errors,
        },
        error?.status || error?.response?.status || status.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/time-windows-availability')
  @ApiParam({
    name: 'id',
    description: 'id of care request',
  })
  @ApiOperation({
    summary: 'Get care request available/unavailable time windows',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getTimeWindowsAvailability(
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<TimeWindowsAvailability[]>> {
    try {
      const data = await this.service.getTimeWindowsAvailability(id);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, [id]);

      throw new HttpException(
        {
          message: error.message,
          errors: error?.response?.data?.errors,
        },
        error?.status || error?.response?.status || status.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/assign-channel-item')
  @ApiParam({
    name: 'id',
    description: 'id of care request',
  })
  @ApiBody({
    type: AssignChannelItem,
    description: 'The data needed to update care request status',
  })
  @ApiOperation({
    summary: "Update care request's channel item",
  })
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
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async assignChannelItem(
    @Param('id') id: string,
    @Body() payload: AssignChannelItem
  ): Promise<CareRequestAPIResponse<CareRequest>> {
    try {
      const data: CareRequest = await this.service.assignChannelItem(
        id,
        payload.channelItemId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, id);

      return ErrorResponse(error);
    }
  }
}
