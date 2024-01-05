import {
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  CheckMarketAvailability,
  MarketsAvailabilityZipcode,
  MarketAvailabilities,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import MarketAvailabilityService from './market-availability.service';
import { ApiTagsText } from '../swagger';
import MarketsAvailabilityZipcodeDto from './dto/markets-availability-zipcode.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import CheckMarketAvailabilityBodyDto from './dto/markets-availability-check.dto';
import MarketAvailabilityBodyDto from './dto/market-availability.dto';
import ErrorResponse from '../common/error-response';

@Controller('markets-availability')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.MarketAvailability)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class MarketAvailabilityController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: MarketAvailabilityService
  ) {}

  @Get('zipcode')
  @ApiQuery({
    type: MarketsAvailabilityZipcodeDto,
    description: 'The data needed to get zipcode details',
  })
  @ApiOperation({
    summary: 'Retrieve market availability zipcode details for Care Request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetch(
    @Query('zipcode') zipcode: number | string,
    // using string instead of boolean due to boolean query param convertions problems in Nest
    @Query('shortName') shortName?: string
  ): Promise<CareRequestAPIResponse<MarketsAvailabilityZipcode>> {
    try {
      const data: MarketsAvailabilityZipcode =
        await this.service.fetchMarketByZipcode(zipcode, shortName);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `MarketsAvailabilityController error: ${error?.message}`,
        zipcode
      );

      return ErrorResponse(error);
    }
  }

  @Post('check')
  @ApiBody({
    type: CheckMarketAvailabilityBodyDto,
    description: 'The data needed to check Market Feasibility State',
  })
  @ApiOperation({
    summary: 'Retrieve Market feasibility state',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async check(
    @Body() payload: CheckMarketAvailabilityBodyDto
  ): Promise<CareRequestAPIResponse<CheckMarketAvailability>> {
    try {
      const data: CheckMarketAvailability =
        await this.service.checkMarketAvailability(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `MarketsAvailabilityController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Post('availability')
  @ApiBody({
    type: MarketAvailabilityBodyDto,
    description:
      'The service date, market and requested service line to get the market availability',
  })
  @ApiOperation({
    summary: 'Get market availability',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async availability(
    @Body() payload: MarketAvailabilityBodyDto
  ): Promise<CareRequestAPIResponse<MarketAvailabilities>> {
    try {
      const data: MarketAvailabilities = await this.service.marketAvailability(
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `MarketsAvailabilityController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }
}
