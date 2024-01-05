import {
  Controller,
  NotFoundException,
  Patch,
  Body,
  UseInterceptors,
  Delete,
  HttpCode,
  HttpException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiParam,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  EtaRange,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import AssignTeamService from './assign-team.service';
import AssignTeamQueryDto from './dto/assign-team-query.dto';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import EtaRangeQueryDTO from './dto/assign-team-eta-range.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import errorMapper from '../common/error-response-mapper';
import ErrorResponse from '../common/error-response';

@Controller('assign-team')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.AssignTeam)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class AssignTeamController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: AssignTeamService
  ) {}

  @Patch()
  @ApiOperation({
    summary: 'Assign team for Care Request',
  })
  @ApiBody({
    type: AssignTeamQueryDto,
    description: 'The data needed to assign team',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(@Body() payload: AssignTeamQueryDto) {
    try {
      const result = await this.service.update(payload.careRequestId, payload);
      if (!result) {
        throw new NotFoundException(
          `Error occured while assigning team. Care Request ${payload.careRequestId} was not found.`
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `AssignTeamController error: ${error?.message}`,
        payload
      );
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

  @Post('eta-ranges')
  @ApiOperation({
    summary: 'Set ETA range of the care team for Care Request',
  })
  @ApiBody({
    type: EtaRangeQueryDTO,
    description: 'The data needed to set eta of team',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async createEta(
    @Body() payload: EtaRangeQueryDTO
  ): Promise<CareRequestAPIResponse<EtaRange>> {
    try {
      const data: EtaRange = await this.service.createEta(
        payload.careRequestId,
        payload
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `AssignTeamController error: ${error?.message}`,
        payload
      );

      return ErrorResponse(error);
    }
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: 'id of care request',
  })
  @ApiOperation({
    summary: 'Remove the assignments of care request',
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @HttpCode(204)
  async removeAssignment(@Param('id') id: string): Promise<void> {
    try {
      await this.service.removeAssignment(id);
    } catch (error) {
      this.logger.error(`AssignTeamController error: ${error?.message}`, id);
      ErrorResponse(error);
    }
  }
}
