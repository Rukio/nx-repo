import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseInterceptors,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiResponse,
  getSchemaPath,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  Insurance,
  InsuranceClassification,
  InsuranceEligibility,
  InsuranceParams,
  SelfUploadInsurance,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import InsuranceBodyDto, { InsuranceParamsDto } from './dto/insurance-body.dto';
import InsuranceQueryDto from './dto/insurance-query.dto';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';

import InsuranceService from './insurance.service';
import ResponseDto from '../common/response.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';
import InsuranceClassificationDto from './dto/insurance-classification.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('insurances')
@UseGuards(AuthGuard('aob'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.Insurances)
@ApiBearerAuth()
export default class InsuranceController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: InsuranceService
  ) {}

  @Get()
  @ApiQuery({
    type: InsuranceQueryDto,
    description: 'The data needed to get insurances',
  })
  @ApiOperation({
    summary: "Get patient's insurance information",
  })
  @ApiOkResponse({
    type: InsuranceBodyDto,
    isArray: true,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetch(
    @Query() query: InsuranceQueryDto
  ): Promise<CareRequestAPIResponse<Insurance[]>> {
    try {
      const data: Insurance[] = await this.service.fetch(query);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`Insurance get error: ${error?.message}`, query);
      throw new HttpException(error.message, error?.response?.status || 500);
    }
  }

  @Post()
  @ApiOperation({
    summary: "Create patient's insurance",
  })
  @ApiQuery({
    type: InsuranceQueryDto,
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
  async create(
    @Query() query: InsuranceQueryDto,
    @Body() payload: InsuranceParams
  ): Promise<CareRequestAPIResponse<Insurance>> {
    try {
      if (!query.marketId || !query.careRequestId) {
        throw new BadRequestException('Make sure the query sent is correct.');
      }
      const data: Insurance = await this.service.create(query, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`Insurance create error: ${error?.message}`, [
        query,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Put(':id')
  @ApiParam({
    name: 'id',
    description: 'id of insurance',
  })
  @ApiQuery({
    type: InsuranceQueryDto,
    description: 'The data needed to update insurance',
  })
  @ApiOperation({
    summary: "Update patient's insurance",
  })
  @ApiBody({
    type: InsuranceBodyDto,
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
  async update(
    @Query() query: InsuranceQueryDto,
    @Param('id') id: string,
    @Body() payload: Insurance
  ): Promise<CareRequestAPIResponse<Insurance>> {
    try {
      if (!query.marketId || !query.careRequestId) {
        throw new BadRequestException('Make sure the query sent is correct.');
      }
      const data: Insurance = await this.service.update(query, id, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`Insurance update error: ${error?.message}`, [
        id,
        query,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: 'id of insurance',
  })
  @ApiQuery({
    type: InsuranceQueryDto,
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
  async remove(
    @Query() query: InsuranceQueryDto,
    @Param('id') id: string
  ): Promise<{ success: boolean } | unknown> {
    try {
      const { patientId } = query;
      const result = await this.service.remove(patientId, id);
      if (!result) {
        throw new NotFoundException('Error occured while deleting Insurance.');
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Insurance remove error: ${error?.message}`, [
        id,
        query,
      ]);

      return ErrorResponse(error);
    }
  }

  @Get('check-eligibility')
  @ApiQuery({
    type: InsuranceQueryDto,
    description: 'The data needed for checking eligibility',
  })
  @ApiOperation({
    summary: "Get insurance's eligibility information for patient",
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async checkEligibility(
    @Query() query: InsuranceQueryDto
  ): Promise<CareRequestAPIResponse<InsuranceEligibility[]>> {
    try {
      const { patientId, careRequestId, marketId } = query;
      const data: InsuranceEligibility[] = await this.service.checkEligibility(
        patientId,
        careRequestId,
        marketId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `Insurance check eligibility error: ${error?.message}`,
        query
      );

      return ErrorResponse(error);
    }
  }

  @Get('self-upload-insurance')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    example: 637526,
  })
  @ApiOperation({
    summary: 'Get self uploaded insurance information for patient',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async selfUploadInsurance(
    @Query('careRequestId') careRequestId: string | number
  ): Promise<CareRequestAPIResponse<SelfUploadInsurance | null>> {
    try {
      const data: SelfUploadInsurance =
        await this.service.getSelfUploadInsurance(careRequestId);
      if (!data) {
        return { success: true, data: null };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `Insurance check eligibility error: ${error?.message}`,
        careRequestId
      );
      if (error.isAxiosError && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          throw new NotFoundException('Insurance check eligibility error.');
        }
        if (error.response.status === HttpStatus.UNAUTHORIZED) {
          throw new UnauthorizedException();
        }
      }

      return ErrorResponse(error);
    }
  }

  @Get('classifications')
  @ApiOperation({
    summary: 'Get all insurance classification data',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(InsuranceClassificationDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async getInsuranceClassifications(): Promise<
    CareRequestAPIResponse<InsuranceClassification[]>
  > {
    try {
      const insuranceClassifications = await this.service.getClassifications();

      return { success: true, data: insuranceClassifications };
    } catch (error) {
      this.logger.error(
        `get insurance classifications error: ${error?.message}`
      );

      return ErrorResponse(error);
    }
  }
}
