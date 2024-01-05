import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  SecondaryScreening,
  CareRequestAPIResponse,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import SecondaryScreeningService from './secondary-screening.service';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import SecodaryScreeningDto from './dto/secondary-screening.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('secondary-screenings')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.SecondaryScreening)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class SecondaryScreeningController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: SecondaryScreeningService
  ) {}

  @Post()
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
  })
  @ApiBody({
    type: SecodaryScreeningDto,
    description: 'The data needed to create secondary screening',
  })
  @ApiOperation({
    summary: 'create secondary screening for Care Request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async create(
    @Body() payload: Omit<SecondaryScreening, 'id' | 'careRequestId'>,
    @Query('careRequestId') careRequestId: string
  ): Promise<CareRequestAPIResponse<SecondaryScreening>> {
    try {
      const data: SecondaryScreening = await this.service.create(
        careRequestId,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `SecondaryScreeningController error: ${error?.message}`,
        [careRequestId, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Get()
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
  })
  @ApiOperation({
    summary: 'Retrieve secondary screenings for Care Request',
  })
  async fetchAll(
    @Query('careRequestId') careRequestId: string
  ): Promise<CareRequestAPIResponse<SecondaryScreening[]>> {
    try {
      const data: SecondaryScreening[] = await this.service.fetchAll(
        careRequestId
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `SecondaryScreeningController error: ${error?.message}`,
        careRequestId
      );

      return ErrorResponse(error);
    }
  }

  @Put(':id')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
  })
  @ApiParam({
    name: 'id',
    description: 'id of secondary screening',
  })
  @ApiBody({
    type: SecodaryScreeningDto,
    description: 'The data needed to update secondary screening',
  })
  @ApiOperation({
    summary: 'Update secondary screening for Care Request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(
    @Body() payload: Omit<SecondaryScreening, 'id' | 'careRequestId'>,
    @Query('careRequestId') careRequestId: string,
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<SecondaryScreening>> {
    try {
      const data: SecondaryScreening = await this.service.update(
        careRequestId,
        id,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `SecondaryScreeningController error: ${error?.message}`,
        [id, careRequestId, payload]
      );

      return ErrorResponse(error);
    }
  }

  @Delete(':id')
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
  })
  @ApiParam({
    name: 'id',
    description: 'id of secondary screening',
  })
  @ApiOperation({
    summary: 'Delete secondary screening of Care Request',
  })
  async remove(
    @Query('careRequestId') careRequestId: string,
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<{ success: boolean }>> {
    try {
      await this.service.remove(careRequestId, id);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `SecondaryScreeningController error: ${error?.message}`,
        [id, careRequestId]
      );

      return ErrorResponse(error);
    }
  }
}
