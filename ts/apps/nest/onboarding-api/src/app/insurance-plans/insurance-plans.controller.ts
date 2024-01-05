import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  InsurancePlan,
  CareRequestAPIResponse,
  EhrInsurancePlan,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import InsurancePlansService from './insurance-plans.service';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import EhrInsurancePlanQueryDto from './dto/ehr-insurance-plans-query.dto';
import EhrInsurancePlanBodyDto from './dto/ehr-insurance-plans-body.dto';
import InsurancePlanBodyDto from './dto/insurance-plans-body.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('insurance-plans')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.InsurancePlans)
@ApiBearerAuth()
export default class InsurancePlansController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: InsurancePlansService
  ) {}

  @Get('/ehr')
  @ApiOperation({
    summary: 'Get ehr insurance plans',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiOkResponse({
    type: EhrInsurancePlanBodyDto,
    isArray: true,
  })
  async fetchEhr(
    @Query() query: EhrInsurancePlanQueryDto
  ): Promise<CareRequestAPIResponse<EhrInsurancePlan[]>> {
    try {
      const data: EhrInsurancePlan[] = await this.service.fetchEhr(query);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InsurancePlansController error: ${error?.message}`,
        query
      );

      return ErrorResponse(error);
    }
  }

  @Get('/:billingCityId')
  @ApiParam({
    name: 'billingCityId',
    description: 'The ID needed to get plans of insurance',
  })
  @ApiOperation({
    summary: "Get insurance's plans",
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiOkResponse({
    type: InsurancePlanBodyDto,
    isArray: true,
  })
  async fetch(
    @Param('billingCityId') billingCityId: string
  ): Promise<CareRequestAPIResponse<InsurancePlan[]>> {
    try {
      const data: InsurancePlan[] = await this.service.fetch(billingCityId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InsurancePlansController error: ${error?.message}`,
        billingCityId
      );

      return ErrorResponse(error);
    }
  }
}
