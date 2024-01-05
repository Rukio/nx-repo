import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { Logger } from 'winston';
import { CareRequestAPIResponse } from '@*company-data-covered*/consumer-web-types';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import ShiftTeamsService from './shift-teams.service';
import { InjectLogger } from '../decorators/logger.decorator';
import ResponseDto from '../common/response.dto';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import ShiftTeamSearchDto from './dto/shift-team-search.dto';
import ShiftTeamDto from './dto/shift-team.dto';
import AssignableShiftTeamDto from './dto/assignable-shift-team.dto';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import ErrorResponse from '../common/error-response';

@Controller('shift-teams')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.ShiftTeams)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class ShiftTeamsController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: ShiftTeamsService
  ) {}

  @Get('fetch')
  @ApiOperation({
    summary: 'Fetch assignable shift teams',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(AssignableShiftTeamDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  async fetch(
    @Query() searchParams: ShiftTeamSearchDto
  ): Promise<CareRequestAPIResponse<AssignableShiftTeamDto[]>> {
    try {
      const data: AssignableShiftTeamDto[] = await this.service.fetch(
        searchParams
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `ShiftTeamController error: ${error?.message}`,
        searchParams
      );

      return ErrorResponse(error);
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search shift teams',
  })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(ShiftTeamDto),
            },
          },
        },
      ],
    },
  })
  @UseValidationPipe()
  async search(
    @Query() searchParams: ShiftTeamSearchDto
  ): Promise<CareRequestAPIResponse<ShiftTeamDto[]>> {
    try {
      const data: ShiftTeamDto[] = await this.service.search(searchParams);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `ShiftTeamController error: ${error?.message}`,
        searchParams
      );

      return ErrorResponse(error);
    }
  }
}
