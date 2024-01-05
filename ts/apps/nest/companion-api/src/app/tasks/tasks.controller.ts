import {
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiGoneResponse,
  ApiOkResponse,
  ApiParam,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../companion/common/companion.constants';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { ApiTagsText } from '../swagger';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

const ApiTaskIdParam = () =>
  ApiParam({
    name: 'taskId',
    description: `The unique identifier of the task.`,
  });

@Controller()
@ApiTags(ApiTagsText.Tasks)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class TasksController {
  constructor(
    private repository: TasksRepository,
    private service: TasksService
  ) {}

  @Put(':taskId/status')
  @ApiOperation({
    summary: `Updates the status of the given task.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiTaskIdParam()
  @ApiBody({ type: UpdateTaskStatusDto })
  @ApiOkResponse({
    description: `Status updated successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  async updateStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto
  ) {
    const task = await this.repository.findById(taskId);

    if (!task) {
      throw new NotFoundException('Task with given ID not found.');
    }

    this.service.updateTaskStatus(task, updateTaskStatusDto.statusName);
  }
}
