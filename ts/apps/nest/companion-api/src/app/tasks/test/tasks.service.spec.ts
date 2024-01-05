import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { TasksRepository } from '../tasks.repository';
import {
  buildMockCompanionConsentsTask,
  buildMockCompanionIdentificationTask,
} from '../mocks/companion-task.mock';
import { TasksModule } from '../tasks.module';
import { buildMockCompanionLinkWithTasks } from '../../companion/mocks/companion-link.mock';
import { mockTasksRepository } from '../mocks/tasks.repository.mock';
import { TasksService } from '../tasks.service';
import { buildMockConsentCapture } from '../../consents/mocks/capture.mock';
import { mockCompanionService } from '../../companion/mocks/companion.service.mock';
import { CompanionService } from '../../companion/companion.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { CompanionTaskStatusName } from '@prisma/client';
import { ConsentsService } from '../../consents/consents.service';
import { mockConsentsService } from '../../consents/mocks/consents.service.mock';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';

describe(`${TasksService.name}`, () => {
  let app: INestApplication;
  let service: TasksService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TasksModule, CommonModule],
    })
      .overrideProvider(TasksRepository)
      .useValue(mockTasksRepository)
      .overrideProvider(CompanionService)
      .useValue(mockCompanionService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(ConsentsService)
      .useValue(mockConsentsService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    service = moduleRef.get<TasksService>(TasksService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink = buildMockCompanionLinkWithTasks();

  const mockConsentsTask = buildMockCompanionConsentsTask({
    companionLinkId: mockCompanionLink.id,
  });

  const mockConsentCapture = buildMockConsentCapture();

  describe(`${TasksService.prototype.onConsentCaptured.name}`, () => {
    describe('Task exists', () => {
      beforeEach(() => {
        mockTasksRepository.findTask.mockResolvedValue(mockConsentsTask);
      });

      test(`should update metadata with new definition ID`, async () => {
        await service.onConsentCaptured(
          mockCompanionLink,
          mockConsentCapture.definitionId
        );

        expect(mockTasksRepository.findTask).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateById).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateById).toHaveBeenCalledWith(
          mockConsentsTask.id,
          expect.objectContaining({
            data: {
              metadata: {
                completedDefinitionIds: expect.arrayContaining([
                  ...mockConsentsTask.metadata.completedDefinitionIds,
                  mockConsentCapture.definitionId,
                ]),
              },
            },
          })
        );
      });

      test(`does not push duplicate definition IDs`, async () => {
        await service.onConsentCaptured(
          mockCompanionLink,
          mockConsentsTask.metadata.completedDefinitionIds[0]
        );

        expect(mockTasksRepository.findTask).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateById).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateById).toHaveBeenCalledWith(
          mockConsentsTask.id,
          expect.objectContaining({
            data: {
              metadata: {
                completedDefinitionIds:
                  mockConsentsTask.metadata.completedDefinitionIds,
              },
            },
          })
        );
      });
    });

    describe('Task does not exist', () => {
      beforeEach(() => {
        mockTasksRepository.findTask.mockResolvedValue(undefined);
      });

      test(`should return undefined`, async () => {
        const result = await service.onConsentCaptured(
          mockCompanionLink,
          mockConsentCapture.definitionId
        );

        expect(mockTasksRepository.findTask).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
      });
    });
  });

  describe(`${TasksService.prototype.updateTaskStatus.name}`, () => {
    describe(`Consents task status is ${CompanionTaskStatusName.COMPLETED}`, () => {
      test(`should call applySignedConsents method in consents service`, async () => {
        service.updateTaskStatus(
          mockConsentsTask,
          CompanionTaskStatusName.COMPLETED
        );
        expect(mockConsentsService.applySignedConsents).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe(`Non-consents task status is ${CompanionTaskStatusName.COMPLETED}`, () => {
      const mockCompanionIdentificationTask =
        buildMockCompanionIdentificationTask();

      test(`should not call applySignedConsents method in consents service`, async () => {
        service.updateTaskStatus(
          mockCompanionIdentificationTask,
          CompanionTaskStatusName.STARTED
        );
        expect(mockConsentsService.applySignedConsents).toHaveBeenCalledTimes(
          0
        );
      });
    });

    describe(`Consents task status is ${CompanionTaskStatusName.STARTED}`, () => {
      test(`should not call applySignedConsents method in consents service`, async () => {
        service.updateTaskStatus(
          mockConsentsTask,
          CompanionTaskStatusName.STARTED
        );
        expect(mockConsentsService.applySignedConsents).toHaveBeenCalledTimes(
          0
        );
      });
    });
  });
});
