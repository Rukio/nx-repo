import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  PartnerLine,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import PartnerLinesService from './partner-lines.service';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import PartnerLinesQueryDto from './dto/partner-lines-query.dto';
import PartnerLinesDto from './dto/partner-lines.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('partner-lines')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.PartnerLines)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class PartnerLinesController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: PartnerLinesService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve a list of partner lines',
  })
  @ApiOkResponse({
    type: PartnerLinesDto,
    isArray: true,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAll(): Promise<CareRequestAPIResponse<PartnerLine[]>> {
    try {
      const data: PartnerLine[] = await this.service.fetchAll();

      return { success: true, data };
    } catch (error) {
      this.logger.error(`PartnerLinesController error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }

  @Get('search')
  @ApiQuery({
    type: PartnerLinesQueryDto,
    description: 'The data needed to find partner line by phone number',
  })
  @ApiOperation({
    summary: 'Search partner line by phone number',
  })
  @ApiOkResponse({
    type: PartnerLinesDto,
    isArray: false,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetch(
    @Query() query: PartnerLinesQueryDto
  ): Promise<CareRequestAPIResponse<PartnerLine>> {
    try {
      const { phoneNumber } = query;
      const data: PartnerLine = await this.service.fetch(phoneNumber);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PartnerLinesController error: ${error?.message}`,
        query
      );

      return ErrorResponse(error);
    }
  }
}
