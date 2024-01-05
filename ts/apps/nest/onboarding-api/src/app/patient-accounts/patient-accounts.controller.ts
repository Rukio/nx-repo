import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Query,
  Get,
  UseInterceptors,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiTagsText } from '../swagger';
import ResponseDto from '../common/response.dto';
import AccountDto from './dto/patient-account.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import { Logger } from 'winston';
import PatientAccountsService from './patient-accounts.service';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import {
  Account,
  AccountPatient,
  CareRequestAPIResponse,
  Insurance,
  InsuranceParams,
  UnverifiedPatient,
  Patient,
  OssInsurance,
  OssAccountAddress,
  OssAddress,
} from '@*company-data-covered*/consumer-web-types';
import ErrorResponse from '../common/error-response';
import AddressDto from './dto/address.dto';
import PatientAccountsInsuranceQueryDto from '../patient-accounts/dto/patient-insurance-query.dto';
import PatientDto from '../patient/dto/patient.dto';
import UpdatePatientDto from '../patient/dto/update-patient.dto';
import { AuthGuard } from '@nestjs/passport';
import PatientAssociationDto from './dto/patient-association.dto';
import InsuranceBodyDto, {
  InsuranceParamsDto,
} from '../insurance/dto/insurance-body.dto';
import CreateEhrRecordDto from './dto/create-ehr-record.dto';
import UnverifiedPatientDto from './dto/unverified-patient.dto';

const ApiAccountIdParam = () =>
  ApiParam({
    name: 'accountId',
    description: 'Account id',
  });

@Controller('accounts')
@UseGuards(AuthGuard('oss'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.PatientAccounts)
@ApiBearerAuth()
@ApiExtraModels(ResponseDto, AccountDto)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class PatientAccountsController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: PatientAccountsService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get account holder info',
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
              $ref: getSchemaPath(AccountDto),
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async get(): Promise<CareRequestAPIResponse<AccountDto>> {
    try {
      const data: Account = await this.service.get();

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController get account error: ${error?.message}`
      );

      return ErrorResponse(error);
    }
  }

  @Patch(':accountId')
  @ApiOperation({
    summary: 'update account holder info',
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
              $ref: getSchemaPath(AccountDto),
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiAccountIdParam()
  async update(
    @Param('accountId') accountId: number,
    @Body() payload: AccountDto
  ): Promise<CareRequestAPIResponse<AccountDto>> {
    try {
      const data: Account = await this.service.update(payload, accountId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`PatientAccountsController error: ${error?.message}`, [
        accountId,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Post(':accountId/addresses')
  @ApiOperation({
    summary: 'create account address info',
  })
  @UseValidationPipe()
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [{ $ref: getSchemaPath(ResponseDto) }],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiAccountIdParam()
  async createAddress(
    @Param('accountId') accountId: number,
    @Body() payload: AddressDto
  ): Promise<CareRequestAPIResponse<OssAccountAddress>> {
    try {
      const data = await this.service.createAddress(payload, accountId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController create address error: ${error?.message}`,
        [accountId, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Get(':accountId/addresses')
  @ApiOperation({
    summary: 'list all addresses of an account',
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
              $ref: getSchemaPath(AddressDto),
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiAccountIdParam()
  async listAddresses(
    @Param('accountId') accountId: number
  ): Promise<CareRequestAPIResponse<OssAddress[]>> {
    try {
      const data = await this.service.listAddresses(accountId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController list addresses error: ${error?.message}`,
        [accountId]
      );

      return ErrorResponse(error);
    }
  }

  @Patch(':accountId/addresses/:addressId')
  @ApiOperation({
    summary: 'update account address info',
  })
  @UseValidationPipe()
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [{ $ref: getSchemaPath(ResponseDto) }],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiAccountIdParam()
  @ApiParam({
    name: 'addressId',
    description: 'Address id',
  })
  async updateAddress(
    @Param('accountId') _accountId: number, // TODO: add OPA for account verification
    @Param('addressId') addressId: number,
    @Body() payload: AddressDto
  ): Promise<CareRequestAPIResponse<OssAccountAddress>> {
    try {
      const data = await this.service.updateAddress(payload, addressId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController update address error: ${error?.message}`,
        [_accountId, addressId, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Patch(':accountId/patients/:patientId')
  @ApiOperation({
    summary: 'Update patient',
  })
  @UseValidationPipe()
  @ApiResponse({
    status: 200,
    schema: {
      oneOf: [
        {
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
        {
          allOf: [
            { $ref: getSchemaPath(ResponseDto) },
            {
              properties: {
                data: {
                  $ref: getSchemaPath(UnverifiedPatientDto),
                },
              },
            },
          ],
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiAccountIdParam()
  @ApiParam({
    name: 'patientId',
    description: 'Patient id',
  })
  async updatePatient(
    @Param('accountId') _accountId: number, // TODO: add OPA for account verification
    @Param('patientId') patientId: number,
    @Body() payload: UpdatePatientDto | UnverifiedPatientDto
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const data: PatientDto = await this.service.updatePatient(
        patientId,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController update patient error: ${error?.message}`,
        [_accountId, patientId, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Post(':accountId/patients')
  @ApiOperation({
    summary: 'Create unverified patient',
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
              $ref: getSchemaPath(UnverifiedPatientDto),
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async createUnverifiedPatient(
    @Param('accountId') _accountId: number, // TODO: add OPA for account verification
    @Body() payload: UnverifiedPatientDto
  ): Promise<CareRequestAPIResponse<UnverifiedPatientDto>> {
    try {
      const data: UnverifiedPatient =
        await this.service.createUnverifiedPatient(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController create unverified patient error: ${error?.message}`,
        [payload, _accountId]
      );

      return ErrorResponse(error);
    }
  }

  @Get(':accountId/patients')
  @ApiParam({
    name: 'accountId',
    description: 'id of account',
  })
  @ApiOperation({
    summary: 'Retrieve list of patient account',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async listPatients(
    @Param('accountId') accountId: number
  ): Promise<CareRequestAPIResponse<AccountPatient[]>> {
    try {
      const result: AccountPatient[] = await this.service.listPatients(
        accountId
      );

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController list account patient error: ${error?.message}`,
        accountId
      );

      return ErrorResponse(error);
    }
  }

  @Patch(':accountId/associate-patient')
  @ApiOperation({
    summary: 'Associate Patient to Account',
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
  async addUnverifiedAccountPatientLink(
    @Param('accountId') accountId: number, // TODO: add OPA for account verification
    @Body() payload: PatientAssociationDto
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const data: AccountPatient =
        await this.service.addUnverifiedAccountPatientLink(accountId, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController associated patient to account error: ${error?.message}`,
        [payload, accountId]
      );

      return ErrorResponse(error);
    }
  }

  // TODO (ON-1111): Update route paths to scope unverified and DH patients
  @Get(':accountId/patients/:patientId')
  @ApiOperation({
    summary: 'get patient',
  })
  @ApiParam({
    name: 'accountId',
    description: 'id of account',
  })
  @ApiParam({
    name: 'patientId',
    description: 'id of patient',
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
  async getPatient(
    @Param('accountId') accountId: number, // TODO (ON-999): add OPA for account verification
    @Param('patientId') patientId: number
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const data: Patient = await this.service.getPatient(patientId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController get patient error: ${error?.message}`,
        [patientId, accountId]
      );

      return ErrorResponse(error);
    }
  }

  @Post(':accountId/insurances')
  @ApiOperation({
    summary: "Create patient's insurance",
  })
  @ApiQuery({
    type: PatientAccountsInsuranceQueryDto,
    description: 'The data needed to create insurance',
  })
  @ApiBody({
    type: InsuranceParamsDto,
    description: 'The data needed to create insurance',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InsuranceBodyDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async createInsurance(
    @Param('accountId') _accountId: number, // TODO: add OPA for account verification
    @Query() query: PatientAccountsInsuranceQueryDto,
    @Body() payload: InsuranceParams
  ): Promise<CareRequestAPIResponse<Insurance>> {
    try {
      const data: Insurance = await this.service.createInsurance(
        query,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController create insurance error: ${error?.message}`,
        [query, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Put(':accountId/insurances/:insuranceId')
  @ApiParam({
    name: 'insuranceId',
    description: 'id of insurance',
  })
  @ApiQuery({
    type: PatientAccountsInsuranceQueryDto,
    description: 'The data needed to update insurance',
  })
  @ApiOperation({
    summary: "Update patient's insurance",
  })
  @ApiBody({
    type: InsuranceParamsDto,
    description: 'The data needed to update insurance',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InsuranceBodyDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async updateInsurance(
    @Param('accountId') _accountId: number, // TODO: add OPA for account verification
    @Query() query: PatientAccountsInsuranceQueryDto,
    @Param('insuranceId') insuranceId: string,
    @Body() payload: InsuranceParams
  ): Promise<CareRequestAPIResponse<Insurance>> {
    try {
      const data: Insurance = await this.service.updateInsurance(
        query,
        insuranceId,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController update insurance error: ${error?.message}`,
        [insuranceId, query, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Post(':accountId/insurances/:insuranceId/check-eligibility')
  @ApiParam({
    name: 'accountId',
    description: 'id of account',
  })
  @ApiParam({
    name: 'insuranceId',
    description: 'id of insurance',
  })
  @ApiQuery({
    type: PatientAccountsInsuranceQueryDto,
    description: 'The data needed for checking eligibility',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InsuranceBodyDto),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: "Trigger and get insurance's eligibility information for patient",
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async checkEligibility(
    @Param('accountId') _accountId: number, // TODO(ON-999): add OPA for account verification
    @Query() query: PatientAccountsInsuranceQueryDto,
    @Param('insuranceId') insuranceId: string
  ): Promise<CareRequestAPIResponse<Insurance>> {
    try {
      const data: Insurance = await this.service.checkEligibility(
        query,
        insuranceId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController check insurance eligibility error: ${error?.message}`,
        query
      );

      return ErrorResponse(error);
    }
  }

  @Post(':accountId/ehr-record')
  @ApiParam({
    name: 'accountId',
    description: 'id of account',
  })
  @ApiOperation({
    summary: 'Create EHR record',
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
  async createEhrRecord(
    @Param('accountId') _accountId: number, // TODO(ON-999): use OPA for account verification
    @Body() payload: CreateEhrRecordDto
  ): Promise<CareRequestAPIResponse<PatientDto>> {
    try {
      const data: PatientDto = await this.service.createEhrRecord(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController create ehr record error: ${error?.message}`,
        [payload]
      );

      return ErrorResponse(error);
    }
  }

  @Get(':accountId/insurances')
  @ApiParam({
    name: 'accountId',
    description: 'id of account',
  })
  @ApiOperation({
    summary: "Get patient's insurance list",
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InsuranceBodyDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async listInsurances(
    @Param('accountId') _accountId: number, // TODO(ON-999): use OPA for account verification
    @Query('patientId') patientId: string
  ): Promise<CareRequestAPIResponse<OssInsurance[]>> {
    try {
      const data: OssInsurance[] = await this.service.listInsurances(patientId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController get insurance list error: ${error?.message}`,
        [patientId]
      );

      return ErrorResponse(error);
    }
  }

  @Delete(':accountId/insurances/:insuranceId')
  @ApiParam({
    name: 'accountId',
    description: 'id of account',
  })
  @ApiParam({
    name: 'insuranceId',
    description: 'id of insurance',
  })
  @ApiQuery({
    type: PatientAccountsInsuranceQueryDto,
    description: 'The data needed to delete insurance',
  })
  @ApiOperation({
    summary: "Delete patient's insurance",
  })
  @ApiResponse({
    status: 200,
    type: ResponseDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async deleteInsurance(
    @Param('accountId') _accountId: number, // TODO(ON-999): add OPA for account verification
    @Query() query: PatientAccountsInsuranceQueryDto,
    @Param('insuranceId') insuranceId: string
  ): Promise<{ success: boolean }> {
    try {
      await this.service.deleteInsurance(query, insuranceId);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `PatientAccountsController delete insurance error: ${error?.message}`,
        [insuranceId, query.patientId]
      );

      return ErrorResponse(error);
    }
  }
}
