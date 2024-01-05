import {
  Controller,
  Get,
  HttpException,
  UseInterceptors,
} from '@nestjs/common';
import {
  LogDNAConfig,
  CareRequestAPIResponse,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { InjectLogger } from '../decorators/logger.decorator';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import ResponseDto from '../common/response.dto';
import ClientConfigService from './client-config.service';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import LogDnaDto from './dto/log-dna.dto';

@Controller('client-config')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.ClientConfig)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class ClientConfigController {
  constructor(
    private readonly service: ClientConfigService,
    @InjectLogger() private logger: Logger
  ) {}

  @Get('log-dna')
  @ApiOperation({
    summary: 'Retrieve log dna config',
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
              $ref: getSchemaPath(LogDnaDto),
            },
          },
        },
      ],
    },
  })
  async getLogDNA(): Promise<CareRequestAPIResponse<LogDNAConfig>> {
    try {
      const data: LogDNAConfig = await this.service.getLogDNA();

      return { success: true, data };
    } catch (error) {
      this.logger.error(`ClientConfigController error: ${error?.message}`);
      throw new HttpException(error.message, error?.response?.status || 500);
    }
  }
}
