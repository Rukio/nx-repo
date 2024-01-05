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
  Note,
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
import NoteService from './note.service';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import NoteDto from './dto/note.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('notes')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.Note)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class NoteController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: NoteService
  ) {}

  @Post()
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
  })
  @ApiBody({
    type: NoteDto,
    description: 'The data needed to create note',
  })
  @ApiOperation({
    summary: 'create note for Care Request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async create(
    @Body() payload: Omit<Note, 'id' | 'careRequestId'>,
    @Query('careRequestId') careRequestId: string
  ): Promise<CareRequestAPIResponse<Note>> {
    try {
      const data: Note = await this.service.create(careRequestId, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`NoteController error: ${error?.message}`, [
        careRequestId,
        payload,
      ]);

      return ErrorResponse(error);
    }
  }

  @Get()
  @ApiQuery({
    name: 'careRequestId',
    description: 'id of care request',
  })
  @ApiOperation({
    summary: 'Retrieve notes for Care Request',
  })
  async fetchAll(
    @Query('careRequestId') careRequestId: string
  ): Promise<CareRequestAPIResponse<Note[]>> {
    try {
      const data: Note[] = await this.service.fetchAll(careRequestId);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `NoteController error: ${error?.message}`,
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
    description: 'id of note',
  })
  @ApiBody({
    type: NoteDto,
    description: 'The data needed to update note',
  })
  @ApiOperation({
    summary: 'Update note for Care Request',
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async update(
    @Body() payload: Omit<Note, 'id' | 'careRequestId'>,
    @Query('careRequestId') careRequestId: string,
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<Note>> {
    try {
      const data: Note = await this.service.update(careRequestId, id, payload);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`NoteController error: ${error?.message}`, [
        id,
        careRequestId,
        payload,
      ]);

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
    description: 'id of note',
  })
  @ApiOperation({
    summary: 'Delete note of Care Request',
  })
  async remove(
    @Query('careRequestId') careRequestId: string,
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<{ success: boolean }>> {
    try {
      await this.service.remove(careRequestId, id);

      return { success: true };
    } catch (error) {
      this.logger.error(`NoteController error: ${error?.message}`, [
        id,
        careRequestId,
      ]);

      return ErrorResponse(error);
    }
  }
}
