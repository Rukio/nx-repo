import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CompanionTaskStatusName,
  CompanionTaskType,
  Prisma,
} from '@prisma/client';
import { Logger } from 'winston';
import { CompanionTaskWithStatuses } from '../companion/dto/companion-task-status.dto';
import {
  CompanionInsuranceImageTask,
  CompanionIdentificationImageTask,
  CompanionDefaultPharmacyTask,
  CompanionTask,
  DiscriminatedCompanionTaskDtoReturnType,
  CompanionPrimaryCareProviderTask,
  CompanionMedicationHistoryConsentTask,
  PcpTaskMetadata,
  CompanionConsentsTask,
} from './models/companion-task';
import { DatabaseService } from '../database/database.service';
import {
  QuestionAnswerDto,
  QuestionTag,
} from '../social-history/dto/question-answer.dto';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { StatsigUser } from 'statsig-node';
import { InjectLogger } from '../logger/logger.decorator';
import { DashboardService } from '../dashboard/dashboard.service';
import { CareRequestRepository } from '../care-request/care-request.repository';
import { VALID_YES_ANSWER } from '../social-history/common';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { CareRequestStatusText } from '../care-request/enums/care-request-status.enum';
import {
  CARE_REQUEST_NOTE_DEFAULT_TITLE,
  CARE_REQUEST_NOTE_DEFAULT_TYPE,
} from '../companion/common/companion.constants';
import { DashboardCareRequestNoteUpsert } from '../dashboard/types/dashboard-care-request-note';
import { CareRequestDto } from '../care-request/dto/care-request.dto';
import { DisplayedTask } from './types/task.statuses.note';
import { TaskLabelText } from './enums/task-label-text';

@Injectable()
export class TasksRepository {
  constructor(
    private database: DatabaseService,
    private dashboardService: DashboardService,
    private careRequestRepository: CareRequestRepository,
    private statsig: StatsigService,
    @InjectLogger() private logger: Logger
  ) {}

  async updateById(
    id: number,
    args: Omit<Prisma.CompanionTaskUpdateArgs, 'where'>
  ) {
    await this.database.companionTask.update({ where: { id }, ...args });
  }

  async updateTaskStatusById(
    taskId: number,
    newStatus: CompanionTaskStatusName
  ): Promise<void> {
    const task = await this.findById(taskId);

    if (!task) {
      throw new NotFoundException('Task with given ID not found.');
    }

    return this.updateTaskStatus(task, newStatus);
  }

  async updateTaskStatus(
    task: CompanionTask,
    newStatus: CompanionTaskStatusName
  ): Promise<void> {
    const matchingStatusExists = !!task.statuses.find(
      (status) => status.name === newStatus
    );

    if (!matchingStatusExists) {
      await this.database.companionTaskStatus.create({
        data: {
          companionTaskId: task.id,
          name: newStatus,
        },
      });
    }

    const careRequest = await this.careRequestRepository.getByLinkId(
      task.companionLinkId
    );

    if (careRequest.activeStatus.name === CareRequestStatusText.OnRoute) {
      try {
        await this.upsertCompanionNoteMetadata(
          task.companionLinkId,
          careRequest
        );
      } catch (error) {
        this.logger.error('failed to upsert note for care request', {
          careRequestId: careRequest.id,
          error,
        });
      }
    }
  }

  async findById(id: number): Promise<CompanionTask | null> {
    const task = await this.database.companionTask.findUnique({
      where: { id },
      include: { statuses: true },
    });

    if (!task) {
      return null;
    }

    return this.taskToDomain(task);
  }

  async findTasks(companionLinkId: string): Promise<CompanionTask[]>;
  async findTasks<T extends CompanionTaskType>(
    companionLinkId: string,
    type: T
  ): Promise<DiscriminatedCompanionTaskDtoReturnType<T>[]>;
  async findTasks(
    companionLinkId: string,
    type?: CompanionTaskType
  ): Promise<CompanionTask[]> {
    const tasks = await this.database.companionTask.findMany({
      where: {
        companionLinkId,
        type,
      },
      include: {
        statuses: true,
      },
    });

    return tasks.map((task) => this.taskToDomain(task));
  }

  async findTask(companionLinkId: string): Promise<CompanionTask | undefined>;
  async findTask<T extends CompanionTaskType>(
    companionLinkId: string,
    type: T
  ): Promise<DiscriminatedCompanionTaskDtoReturnType<T> | undefined>;
  async findTask(
    companionLinkId: string,
    type?: CompanionTaskType
  ): Promise<CompanionTask | undefined> {
    const tasks = type
      ? await this.findTasks(companionLinkId, type)
      : await this.findTasks(companionLinkId);

    return tasks.pop();
  }

  async upsertCompanionNoteMetadata(
    linkId: string,
    careRequest: CareRequestDto
  ): Promise<void> {
    const metadata = await this.findTasksStatusChangeForLinkId(
      linkId,
      careRequest
    );

    const notes = await this.dashboardService.getNotesForCareRequest(
      careRequest.id
    );
    const companionNotes = notes.filter(
      (dashboardNote) =>
        dashboardNote.note_type === CARE_REQUEST_NOTE_DEFAULT_TYPE
    );
    const note: DashboardCareRequestNoteUpsert = {
      care_request_id: careRequest.id,
      note: CARE_REQUEST_NOTE_DEFAULT_TITLE,
      note_type: CARE_REQUEST_NOTE_DEFAULT_TYPE,
      in_timeline: true,
      meta_data: metadata,
    };
    const loggerMetadata = {
      companionLinkId: linkId,
      careRequestId: careRequest.id,
    };

    switch (companionNotes.length) {
      case 0:
        this.logger.debug('no companion notes found, create a new one', {
          loggerMetadata,
        });
        try {
          await this.dashboardService.createNoteForCareRequest(
            careRequest.id,
            note
          );
        } catch (error) {
          this.logger.error(`Unable to create note for care request.`, {
            ...loggerMetadata,
            note,
          });
          throw error;
        }
        break;
      case 1: {
        this.logger.debug('update existing note', { loggerMetadata });
        const noteId = companionNotes[0].id;

        try {
          await this.dashboardService.updateNoteForCareRequest(
            careRequest.id,
            noteId,
            note
          );
        } catch (error) {
          this.logger.error(`Unable to update note for care request.`, {
            ...loggerMetadata,
            note,
          });
          throw error;
        }
        break;
      }
      default:
        this.logger.error(
          `expected to find 0 or 1 note, ${companionNotes.length} found`,
          {
            ...loggerMetadata,
            note,
          }
        );
        throw new Error(
          `expected to find 0 or 1 note, ${companionNotes.length} found`
        );
    }
  }

  private async getTaskStatusNoteInTimelineExperiment(
    linkId: string,
    careRequest: CareRequestDto
  ) {
    const statsigUser: StatsigUser = {
      userID: linkId,
      customIDs: {
        careRequestID: careRequest.statsigCareRequestId,
      },
    };

    return this.statsig.getExperiment(
      statsigUser,
      'companion_care_request_timeline_task_status_note'
    );
  }

  async findTasksStatusChangeForLinkId(
    linkId: string,
    careRequest: CareRequestDto
  ): Promise<DashboardCareRequestNoteUpsert['meta_data']> {
    const approvedTaskNames: CompanionTaskType[] = [
      CompanionTaskType.IDENTIFICATION_IMAGE,
      CompanionTaskType.INSURANCE_CARD_IMAGES,
      CompanionTaskType.PRIMARY_CARE_PROVIDER,
      CompanionTaskType.DEFAULT_PHARMACY,
    ];

    const experiment = await this.getTaskStatusNoteInTimelineExperiment(
      linkId,
      careRequest
    );
    const displayedTaskNames = experiment.get<CompanionTaskType[]>(
      'displayed_tasks',
      []
    );
    const validDisplayedTasks = displayedTaskNames.reduce<
      Partial<DisplayedTask>
    >((acc, displayedTaskName) => {
      if (approvedTaskNames.includes(displayedTaskName)) {
        switch (displayedTaskName) {
          case CompanionTaskType.IDENTIFICATION_IMAGE:
            acc[displayedTaskName] = TaskLabelText.ID;
            break;
          case CompanionTaskType.INSURANCE_CARD_IMAGES:
            acc[displayedTaskName] = TaskLabelText.Insurance;
            break;
          case CompanionTaskType.PRIMARY_CARE_PROVIDER:
            acc[displayedTaskName] = TaskLabelText.PCP;
            break;
          case CompanionTaskType.DEFAULT_PHARMACY:
            acc[displayedTaskName] = TaskLabelText.Pharmacy;
            break;
        }
      }

      return acc;
    }, {});

    const metadata: DashboardCareRequestNoteUpsert['meta_data'] = {
      companionTasks: Object.values(validDisplayedTasks),
      completeCompanionTasks: [],
    };

    const tasks = await this.findTasks(linkId);
    const filteredTasks = tasks.filter((task) =>
      displayedTaskNames.includes(task.type)
    );

    filteredTasks.forEach((task) => {
      if (
        task.statuses.some(
          (status) => status.name === CompanionTaskStatusName.COMPLETED
        )
      ) {
        const taskLabel = validDisplayedTasks[task.type];
        taskLabel && metadata.completeCompanionTasks.push(taskLabel);
      }
    });

    return metadata;
  }

  async onSocialHistoryUpdate(
    link: CompanionLinkWithTasks,
    questionAnswer: QuestionAnswerDto
  ) {
    const task = await this.findTask(
      link.id,
      CompanionTaskType.PRIMARY_CARE_PROVIDER
    );

    if (!task) {
      throw new NotFoundException('Task with given link ID not found.');
    }

    const careRequest = await this.careRequestRepository.getByIdWithError(
      link.careRequestId
    );

    const statsigUser: StatsigUser = {
      userID: link.id,
      customIDs: {
        careRequestID: careRequest.statsigCareRequestId,
      },
    };
    const { overallStatus, metadata } = await this.newPrimaryCareProviderStatus(
      task,
      questionAnswer
    );

    await this.updateTaskStatus(task, overallStatus);

    if (overallStatus === CompanionTaskStatusName.COMPLETED) {
      this.statsig.logEvent(statsigUser, 'pcp_task_complete');
    }

    return this.database.companionTask.update({
      where: {
        id: task.id,
      },
      data: {
        metadata,
      },
    });
  }

  async newPrimaryCareProviderStatus(
    task: CompanionPrimaryCareProviderTask,
    questionAnswer: QuestionAnswerDto
  ) {
    const questionMetadata = {
      [questionAnswer.questionTag]: questionAnswer.answer === VALID_YES_ANSWER,
    };
    const metadata: PcpTaskMetadata = {
      clinicalProviderId: task.metadata?.clinicalProviderId,
      socialHistoryResponses: {
        ...task.metadata?.socialHistoryResponses,
        ...questionMetadata,
      },
    };

    if (metadata.socialHistoryResponses.HAS_PCP === false) {
      metadata.socialHistoryResponses.HAS_SEEN_PCP_RECENTLY = false;
    }

    if (metadata.socialHistoryResponses.HAS_SEEN_PCP_RECENTLY === true) {
      metadata.socialHistoryResponses.HAS_PCP = true;
    }

    const overallStatus = await this.getPcpTaskStatusFromMetadata(metadata);

    return { overallStatus, metadata };
  }

  async getPcpTaskStatusFromMetadata(metadata: PcpTaskMetadata) {
    if (metadata === null) {
      return CompanionTaskStatusName.NOT_STARTED;
    }

    const {
      clinicalProviderId,
      socialHistoryResponses: {
        [QuestionTag.HAS_PCP]: hasPcp,
        [QuestionTag.HAS_SEEN_PCP_RECENTLY]: hasSeenPcpRecently,
      },
    } = metadata;
    const hasClinicalProviderId = !!clinicalProviderId;
    const hasPcpIsAnswered = hasPcp !== undefined;
    const hasSeenPcpRecentlyIsAnswered = hasSeenPcpRecently !== undefined;
    const hasPcpAnsweredFalse = hasPcp === false;

    if (
      !(
        hasPcpIsAnswered ||
        hasSeenPcpRecentlyIsAnswered ||
        hasClinicalProviderId
      )
    ) {
      return CompanionTaskStatusName.NOT_STARTED;
    } else if (
      hasPcpAnsweredFalse ||
      (hasClinicalProviderId && hasSeenPcpRecentlyIsAnswered)
    ) {
      return CompanionTaskStatusName.COMPLETED;
    } else {
      return CompanionTaskStatusName.STARTED;
    }
  }

  private taskToDomain(task: CompanionTaskWithStatuses): CompanionTask {
    switch (task.type) {
      case CompanionTaskType.INSURANCE_CARD_IMAGES:
        return CompanionInsuranceImageTask.fromCompanionTask(task);
      case CompanionTaskType.IDENTIFICATION_IMAGE:
        return CompanionIdentificationImageTask.fromCompanionTask(task);
      case CompanionTaskType.DEFAULT_PHARMACY:
        return CompanionDefaultPharmacyTask.fromCompanionTask(task);
      case CompanionTaskType.PRIMARY_CARE_PROVIDER:
        return CompanionPrimaryCareProviderTask.fromCompanionTask(task);
      case CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY:
        return CompanionMedicationHistoryConsentTask.fromCompanionTask(task);
      case CompanionTaskType.CONSENTS:
        return CompanionConsentsTask.fromCompanionTask(task);
      default:
        throw new Error(`Unexpected task type: ${task.type}`);
    }
  }
}
