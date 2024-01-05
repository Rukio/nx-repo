import { Controller, Get, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  State,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import StateService from './state.service';
import { ApiTagsText } from '../swagger';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('states')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.States)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class StateController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: StateService
  ) {}

  @Get('active')
  @ApiOperation({
    summary: 'Retrieve all active states details',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAllActive(): Promise<CareRequestAPIResponse<State[]>> {
    try {
      const data: State[] = await this.service.fetchAllActive();

      return { success: true, data };
    } catch (error) {
      this.logger.error(`StatesController error: ${error.message}`);

      return ErrorResponse(error);
    }
  }
}
