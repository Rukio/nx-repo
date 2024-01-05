import {
  Controller,
  UseInterceptors,
  HttpException,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  getSchemaPath,
  ApiResponse,
} from '@nestjs/swagger';
import { Logger } from 'winston';
import { CareRequestAPIResponse } from '@*company-data-covered*/consumer-web-types';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { InjectLogger } from '../decorators/logger.decorator';
import errorMapper from '../common/error-response-mapper';
import AdvancedCareService from './advanced-care.service';
import ResponseDto from '../common/response.dto';
import AdvancedCarePatientDto from './dto/advanced-care-patient.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('care-manager')
@UseGuards(AuthGuard('aob'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.CareManager)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class AdvancedCareController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: AdvancedCareService
  ) {}

  @Get('active-patients/:athenaId')
  @ApiOperation({
    summary: 'Retrieve active patient',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(AdvancedCarePatientDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getActivePatient(
    @Param('athenaId') id: string
  ): Promise<CareRequestAPIResponse<AdvancedCarePatientDto[]>> {
    try {
      const data = await this.service.getActivePatients(id);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`AdvancedCareController error: ${error?.message}`, id);
      throw new HttpException(
        {
          message: error?.message,
          errors: errorMapper.TransformErrors(error?.response?.data?.errors),
          statusCode: error?.response?.status,
        },
        error?.response?.status || 500
      );
    }
  }
}
