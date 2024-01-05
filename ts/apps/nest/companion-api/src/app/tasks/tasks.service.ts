import { Injectable } from '@nestjs/common';
import { CompanionTaskStatusName, CompanionTaskType } from '@prisma/client';
import { Logger } from 'winston';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { ConsentsService } from '../consents/consents.service';
import { InjectLogger } from '../logger/logger.decorator';
import { CompanionTask } from './models/companion-task';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private repository: TasksRepository,
    private consentsService: ConsentsService,
    @InjectLogger() private logger: Logger
  ) {}

  async onConsentCaptured(
    link: CompanionLinkWithTasks,
    definitionId: number
  ): Promise<void> {
    const consentsTask = await this.repository.findTask(
      link.id,
      CompanionTaskType.CONSENTS
    );

    if (!consentsTask) {
      this.logger.debug(
        `${TasksService.prototype.onConsentCaptured.name} called for CompanionLink without consents task.`,
        { companionLinkId: link.id, definitionId }
      );

      return;
    }

    this.logger.debug(
      `Marking consent definition complete for companion task.`,
      {
        companionLinkId: link.id,
        companionTaskId: consentsTask.id,
        definitionId,
      }
    );

    const newMetadata = { ...consentsTask.metadata };

    if (!newMetadata.completedDefinitionIds.includes(definitionId)) {
      newMetadata.completedDefinitionIds.push(definitionId);
    }
    await this.repository.updateById(consentsTask.id, {
      data: {
        metadata: newMetadata,
      },
    });
  }

  async updateTaskStatus(
    task: CompanionTask,
    statusName: CompanionTaskStatusName
  ) {
    this.repository.updateTaskStatus(task, statusName);

    if (
      task.type === CompanionTaskType.CONSENTS &&
      statusName === CompanionTaskStatusName.COMPLETED
    ) {
      this.consentsService.applySignedConsents(task);
    }
  }
}
