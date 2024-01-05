import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseInterceptors,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  WebRequestPatient,
  CareRequestAPIResponse,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import StatsigService from '../statsig/statsig.service';
import PatientService from './patient.service';
import PatientSearchParamDto from './dto/patient-search-params.dto';
import PatientDto from './dto/patient.dto';
import CreatePatientDto from './dto/create-patient.dto';
import UpdatePatientDto from './dto/update-patient.dto';
import CreateEhrPatientDto from './dto/create-ehr-patient.dto';
import EhrPatientDto from './dto/ehr-patient.dto';
import WebRequestPatientDto from './dto/web-request-patient.dto';
import ResponseDto from '../common/response.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import { InjectStatsig } from '../statsig/common';
import ErrorResponse from '../common/error-response';
import { AuthGuard } from '@nestjs/passport';

@Controller('patients')
@UseGuards(AuthGuard('aob'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.Patient)
@ApiBearerAuth()
@ApiExtraModels(ResponseDto, PatientDto)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class PatientController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: PatientService,
    @InjectStatsig() private statsig: StatsigService
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create patient',
  })
  @UseValidationPipe()
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(PatientDto),
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async create(
    @Request() req,
    @Body() payload: CreatePatientDto
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const patientServiceToggle = await this.statsig.patientServiceToggle(
        req.user['https://*company-data-covered*.com/email']
      );
      const data: PatientDto = patientServiceToggle
        ? await this.service.createGrpcPatient(payload)
        : await this.service.createStationPatient(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`PatientController error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }

  @Get('health-check')
  @ApiOperation({
    summary: 'Health check of gRPC service',
  })
  async healthCheck(): Promise<CareRequestAPIResponse<string>> {
    try {
      const data: string = await this.service.gRPCHealthCheck();

      return { success: true, data };
    } catch (error) {
      this.logger.error(`PatientController error: ${error?.message}`);

      return ErrorResponse(error);
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search patient by name',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(PatientDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  async search(
    @Request() req,
    @Query() searchParams: PatientSearchParamDto
  ): Promise<CareRequestAPIResponse<PatientDto[]>> {
    try {
      const patientServiceToggle = await this.statsig.patientServiceToggle(
        req.user['https://*company-data-covered*.com/email']
      );
      const data: PatientDto[] = patientServiceToggle
        ? await this.service.searchGrpcPatients(searchParams)
        : await this.service.searchStationPatients(searchParams);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientController error: ${error?.message}`,
        searchParams
      );

      return ErrorResponse(error);
    }
  }

  @Get(':patientId')
  @ApiOperation({
    summary: 'Get patient from gRPC service',
  })
  @UseValidationPipe()
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(PatientDto),
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiParam({
    name: 'patientId',
    description: 'Patient id',
  })
  async show(
    @Request() req,
    @Param('patientId') patientId: number
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const patientServiceToggle = await this.statsig.patientServiceToggle(
        req.user['https://*company-data-covered*.com/email']
      );
      const data: PatientDto = patientServiceToggle
        ? await this.service.getGrpcPatient(patientId)
        : await this.service.getStationPatient(patientId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`PatientController error: ${error?.message}`, [
        patientId,
      ]);

      return ErrorResponse(error);
    }
  }

  @Patch(':patientId')
  @ApiOperation({
    summary: 'Update patient',
  })
  @UseValidationPipe()
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(PatientDto),
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiParam({
    name: 'patientId',
    description: 'Patient id',
  })
  async update(
    @Request() req,
    @Param('patientId') patientId: number,
    @Body() payload: UpdatePatientDto
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const patientServiceToggle = await this.statsig.patientServiceToggle(
        req.user['https://*company-data-covered*.com/email']
      );
      const data: PatientDto = patientServiceToggle
        ? await this.service.updateGrpcPatient(patientId, payload)
        : await this.service.updateStationPatient(patientId, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`PatientController error: ${error?.message}`, [
        patientId,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Get(':patientId/ehr-show')
  @ApiOperation({
    summary: 'get all EHR patients of a patient id',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiParam({
    name: 'patientId',
    description: 'Patient id',
  })
  async showEhr(
    @Param('patientId') patientId: number
  ): Promise<CareRequestAPIResponse<EhrPatientDto[]>> {
    try {
      const data: EhrPatientDto[] = await this.service.getEHRPatient(patientId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientController error: ${error?.message}`,
        patientId
      );

      return ErrorResponse(error);
    }
  }

  @Post(':patientId/ehr-create')
  @ApiOperation({
    summary: 'Create EHR patient',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiParam({
    name: 'patientId',
    description: 'Patient id',
  })
  async createEhr(
    @Param('patientId') patientId: number,
    @Body() payload: CreateEhrPatientDto
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const data: PatientDto = await this.service.createEHR(patientId, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`PatientController error: ${error?.message}`, [
        patientId,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Get(':careRequestId/web-request-patient')
  @ApiOperation({
    summary: 'Retrieve web request patient from care request',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(WebRequestPatientDto),
            },
          },
        },
      ],
    },
  })
  async fetchPatients(
    @Param('careRequestId') id: number
  ): Promise<{ success: boolean; data?: WebRequestPatient }> {
    try {
      const data: WebRequestPatient = await this.service.fetchWebRequestPatient(
        id
      );

      if (!data) {
        return { success: false, data: undefined };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error(`CareRequestController error: ${error?.message}`, id);

      return ErrorResponse(error);
    }
  }
}
