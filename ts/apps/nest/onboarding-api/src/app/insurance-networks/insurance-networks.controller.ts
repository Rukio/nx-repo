import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  InsuranceNetwork,
  InsuranceServiceNetworkCreditCardRule,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import InsuranceNetworksService from './insurance-networks.service';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';
import SearchInsuranceNetworksDto from './dto/insurance-networks-body.dto';

@Controller('insurance-networks')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.InsuranceNetworks)
@ApiBearerAuth()
export default class InsuranceNetworksController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: InsuranceNetworksService
  ) {}

  @Get('/:insuranceNetworkId')
  @ApiParam({
    name: 'insuranceNetworkId',
    description: 'The ID needed to get exact insurance network',
  })
  @ApiOperation({
    summary: "Get insurance's network",
  })
  @UseValidationPipe()
  async fetch(
    @Param('insuranceNetworkId') insuranceNetworkId: number
  ): Promise<CareRequestAPIResponse<InsuranceNetwork>> {
    try {
      const data = await this.service.fetch(insuranceNetworkId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InsuranceNetworksController error: ${error?.message}`,
        insuranceNetworkId
      );

      return ErrorResponse(error);
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Search insurance networks',
  })
  @UseValidationPipe()
  async search(
    @Body() payload: SearchInsuranceNetworksDto
  ): Promise<CareRequestAPIResponse<InsuranceNetwork[]>> {
    try {
      const data = await this.service.search(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InsuranceNetworksController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Get('/:insuranceNetworkId/credit-card-rules')
  @ApiParam({
    name: 'insuranceNetworkId',
    description: 'the ID of insurance network',
  })
  @ApiOperation({
    summary: 'Get insurance network credit card rules',
  })
  @UseValidationPipe()
  async listNetworkCreditCardRules(
    @Param('insuranceNetworkId') insuranceNetworkId: number
  ): Promise<CareRequestAPIResponse<InsuranceServiceNetworkCreditCardRule[]>> {
    try {
      const data = await this.service.listNetworkCreditCardRules(
        insuranceNetworkId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `InsuranceNetworksController list insurance network credit card rules error: ${error?.message}`,
        insuranceNetworkId
      );

      return ErrorResponse(error);
    }
  }
}
