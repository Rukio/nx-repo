import { Controller, Get, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  Protocol,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';

import SymptomsService from './symptoms.service';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import SymptomsItemsDto from './dto/symptoms-items.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('symptoms')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.Symptoms)
@ApiBearerAuth()
export default class SymptomsController {
  constructor(
    private readonly service: SymptomsService,
    @InjectLogger() private logger: Logger
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of the all symptoms',
  })
  @ApiResponse({
    type: SymptomsItemsDto,
    isArray: true,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAll(): Promise<CareRequestAPIResponse<Protocol[]>> {
    try {
      const data: Protocol[] = await this.service.fetchAll();

      return { success: true, data };
    } catch (error) {
      this.logger.error(`InsuranceController error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }
}
