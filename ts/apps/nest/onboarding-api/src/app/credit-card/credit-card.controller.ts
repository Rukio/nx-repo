import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  CreditCard,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import CreditCardService from './credit-card.service';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import CreditCardParamsDto from './dto/credit-card-params.dto';
import CreditCardDto from './dto/credit-card.dto';
import UpdateCreditCardParamsDto from './dto/update-credit-card-params.dto';
import ResponseDto from '../common/response.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import mapper from './credit-card.mapper';
import CreditCardIframeDto from './dto/credit-card-iframe.dto';

@Controller('credit-cards')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.CreditCard)
@ApiBearerAuth()
@ApiExtraModels(ResponseDto, CreditCardDto)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class CreditCardController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: CreditCardService
  ) {}

  @Post()
  @ApiBody({
    description: 'The data needed to create credit card',
    type: CreditCardParamsDto,
  })
  @ApiOperation({
    summary: 'Create credit card for patient',
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
              $ref: getSchemaPath(CreditCardDto),
            },
          },
        },
      ],
    },
  })
  async create(
    @Body() payload: CreditCardParamsDto
  ): Promise<CareRequestAPIResponse<CreditCardDto>> {
    try {
      const data: CreditCardDto = await this.service.create(payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `CreditCardController create card error: ${error?.message}`
      );
      const errorMessage = {
        message: error?.response?.data?.errors
          ? mapper.transformErrors(error.response.data.errors)
          : error?.response?.data?.error || error?.message,
      };

      throw new HttpException(errorMessage, error?.response?.status || 500);
    }
  }

  @Get()
  @ApiQuery({
    name: 'patientId',
    description: 'id of patient',
    required: true,
  })
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
    required: true,
  })
  @ApiOperation({
    summary: 'Retrieve patient credit cards',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(CreditCardDto),
            },
          },
        },
      ],
    },
  })
  async fetch(
    @Query('patientId') patientId: number,
    @Query('careRequestId') careRequestId: number
  ): Promise<CareRequestAPIResponse<CreditCardDto>> {
    try {
      const data: CreditCardDto = await this.service.fetch(
        patientId,
        careRequestId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `CreditCardController fetch cards error: ${error?.message}`,
        patientId
      );
      const errorMessage = {
        message: error?.response?.data ? error.response.data : error?.message,
      };

      throw new HttpException(errorMessage, error?.response?.status || 500);
    }
  }

  @Put('/:id')
  @ApiParam({
    name: 'id',
    description: 'id of credit card',
  })
  @ApiBody({
    description: 'The data needed to update credit card',
    type: UpdateCreditCardParamsDto,
  })
  @ApiOperation({
    summary: 'Updates Credit card info',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(CreditCardDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(
    @Param('id') id: number,
    @Body() payload: UpdateCreditCardParamsDto
  ): Promise<CareRequestAPIResponse<CreditCard>> {
    try {
      const data: CreditCard = await this.service.update(id, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `CreditCardController update card error: ${error?.message}`,
        id
      );

      const errorMessage = {
        message: error?.response?.data?.errors
          ? mapper.transformErrors(error.response.data.errors)
          : error?.response?.data?.error || error?.message,
      };

      throw new HttpException(errorMessage, error?.response?.status || 500);
    }
  }

  @Get('/iframe')
  @ApiQuery({
    name: 'patientId',
    description: 'id of patient',
    required: true,
  })
  @ApiOperation({
    summary: 'Retrieve patient credit cards iframe',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(CreditCardIframeDto),
            },
          },
        },
      ],
    },
  })
  async iframe(
    @Query('patientId') patientId: number
  ): Promise<CareRequestAPIResponse<CreditCardIframeDto>> {
    try {
      const data: CreditCardIframeDto = await this.service.getIframeUrl(
        patientId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `CreditCardController get iframe error: ${error?.message}`,
        patientId
      );
      const errorMessage = {
        message: error?.response?.data ? error.response.data : error?.message,
      };

      throw new HttpException(errorMessage, error?.response?.status || 500);
    }
  }

  @Delete('/:id')
  @ApiParam({
    name: 'id',
    description: 'id of credit card',
  })
  @ApiOperation({
    summary: 'Delete credit card',
  })
  @ApiResponse({
    status: 200,
    type: ResponseDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async delete(
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<boolean>> {
    try {
      const data: boolean = await this.service.delete(id);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `CreditCardController delete card error: ${error?.message}`,
        id
      );
      throw new HttpException(error?.message, error?.response?.status || 500);
    }
  }
}
