import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiQuery,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  RiskStratificationProtocolSearchParam,
  RiskStratificationProtocol,
  ProtocolWithQuestions,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import RiskStratificationProtocolsService from './risk-stratification-protocols.service';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import RiskStratificationProtocolQueryDto from './dto/risk-stratification-protocol-query.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';
import { AuthGuard } from '@nestjs/passport';

@Controller('risk-stratification-protocols')
@UseGuards(AuthGuard('aob'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.RiskStratificationProtocols)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class RiskStratificationProtocolsController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: RiskStratificationProtocolsService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve Risk Stratification Protocol',
  })
  @ApiQuery({
    type: RiskStratificationProtocolQueryDto,
    description: 'The data needed to get risk stratification',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAll(
    @Query()
    riskStratificationProtocolSearchParam: RiskStratificationProtocolSearchParam
  ) {
    try {
      const data: RiskStratificationProtocol = await this.service.fetchAll(
        riskStratificationProtocolSearchParam
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `RiskStratificationProtocolsController error: ${error?.message}`,
        riskStratificationProtocolSearchParam
      );

      return ErrorResponse(error);
    }
  }

  @Get(':protocolId')
  @ApiParam({
    name: 'protocolId',
    description: 'id of the risk stratification protocol',
  })
  @ApiQuery({
    type: RiskStratificationProtocolQueryDto,
    description: 'The data needed to get risk stratification',
  })
  @ApiOperation({
    summary: 'Retrieve Risk Stratification Protocol by id',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetch(
    @Query()
    riskStratificationProtocolSearchParam: RiskStratificationProtocolSearchParam,
    @Param('protocolId') protocolId: string
  ) {
    try {
      const data: ProtocolWithQuestions = await this.service.fetch(
        riskStratificationProtocolSearchParam,
        protocolId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `RiskStratificationProtocolsController error: ${error?.message}`,
        [protocolId, riskStratificationProtocolSearchParam]
      );

      return ErrorResponse(error);
    }
  }
}
