import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CompanionTaskStatusName } from '@prisma/client';
import { CommonModule } from '../../common/common.module';
import {
  buildMockCompanionTaskStatus,
  buildMockCompanionConsentsTask,
} from '../mocks/companion-task.mock';
import { mockTasksRepository } from '../mocks/tasks.repository.mock';
import { mockTasksService } from '../mocks/tasks.service.mock';
import { TasksController } from '../tasks.controller';
import { TasksModule } from '../tasks.module';
import { TasksRepository } from '../tasks.repository';
import { TasksService } from '../tasks.service';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';
import { UpdateTaskStatusDto } from '../dto/update-task-status.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe(`${TasksController.name}`, () => {
  let app: INestApplication;
  let controller: TasksController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TasksModule, CommonModule],
    })
      .overrideProvider(TasksRepository)
      .useValue(mockTasksRepository)
      .overrideProvider(TasksService)
      .useValue(mockTasksService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    controller = moduleRef.get<TasksController>(TasksController);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${TasksController.prototype.updateStatus.name}`, () => {
    const mockConsentsTask = buildMockCompanionConsentsTask();

    beforeEach(() => {
      mockTasksRepository.findById.mockResolvedValue(mockConsentsTask);
      mockTasksService.updateTaskStatus.mockResolvedValue(undefined);
    });

    describe('Consents task status is started', () => {
      const mockCompanionTaskStatus = buildMockCompanionTaskStatus({
        name: CompanionTaskStatusName.STARTED,
      });

      describe('Task not found by provided ID', () => {
        beforeEach(() => {
          mockTasksRepository.findById.mockResolvedValue(null);
        });

        test(`Throws ${NotFoundException.name}`, async () => {
          await expect(
            controller.updateStatus(mockConsentsTask.id, {
              statusName: mockCompanionTaskStatus.name,
            })
          ).rejects.toBeInstanceOf(NotFoundException);
        });
      });

      test(`Updates task status`, async () => {
        await controller.updateStatus(mockConsentsTask.id, {
          statusName: mockCompanionTaskStatus.name,
        });

        expect(mockTasksService.updateTaskStatus).toHaveBeenCalledTimes(1);
      });
    });
  });
});

describe(`${UpdateTaskStatusDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        statusName: 'COMPLETED',
      };
      const dto = plainToInstance(UpdateTaskStatusDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        statusName: 'Invalid Value',
      };
      const dto = plainToInstance(UpdateTaskStatusDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'statusName must be one of the following values'
      );
    });
  });
});
