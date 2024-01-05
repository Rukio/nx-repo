import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  BillingCityPlaceOfService,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';
import StationService from '../station/station.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('places-of-service')
@UseGuards(AuthGuard('aob'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.PlacesOfServiceBillingCity)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class PlacesOfServiceController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly stationService: StationService
  ) {}

  @Get(':billingCityId')
  @ApiParam({
    name: 'billingCityId',
    description: 'id of billing city',
  })
  @ApiOperation({
    summary: 'Retrieve places of service for billing city',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAll(
    @Param('billingCityId') billingCityId: string
  ): Promise<CareRequestAPIResponse<BillingCityPlaceOfService[]>> {
    try {
      const result: BillingCityPlaceOfService[] =
        await this.stationService.fetchPlacesOfService(billingCityId);

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(
        `PlacesOfServiceController error: ${error?.message}`,
        billingCityId
      );

      return ErrorResponse(error);
    }
  }
}
