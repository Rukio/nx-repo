import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  Market,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import ResponseDto from '../common/response.dto';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import MarketService from './market.service';
import { ApiTagsText } from '../swagger';
import MarketDto from './dto/market.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('markets')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.Markets)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class MarketController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: MarketService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve all market details',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAll(): Promise<CareRequestAPIResponse<Market[]>> {
    try {
      const data: Market[] = await this.service.fetchAll();

      return { success: true, data };
    } catch (error) {
      this.logger.error(`MarketsController error: ${error.message}`);

      return ErrorResponse(error);
    }
  }

  @Get('telepresentation')
  @ApiOperation({
    summary: 'Retrieve all telepresentation eligible market details',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAllTelepresentation(): Promise<CareRequestAPIResponse<Market[]>> {
    try {
      const data: Market[] = await this.service.fetchAllTelepresentation();

      return { success: true, data };
    } catch (error) {
      this.logger.error(`MarketsController error: ${error.message}`);

      return ErrorResponse(error);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve market details',
  })
  @ApiOperation({
    summary: 'get market details',
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
              $ref: getSchemaPath(MarketDto),
            },
          },
        },
      ],
    },
  })
  async fetch(
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<Market>> {
    try {
      const data: Market = await this.service.fetch(id);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`MarketsController error: ${error.message}`, id);

      return ErrorResponse(error);
    }
  }
}
