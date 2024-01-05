import { INestApplication, Logger, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { TasksRepository } from '../tasks.repository';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import {
  buildMockPrimaryCareProviderTask,
  buildMockCompanionIdentificationTask,
  buildMockCompanionInsuranceTask,
  buildMockCompanionDefaultPharmacyTask,
  buildMockConsentsTaskMetadata,
  buildMockCompanionMedicationConsentTask,
  buildMockCompanionConsentsTask,
} from '../mocks/companion-task.mock';
import {
  buildMockCareRequest,
  mockCareRequestRepository,
} from '../../care-request/mocks/care-request.repository.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { TasksModule } from '../tasks.module';
import { buildMockTaskStatus } from '../../companion/mocks/companion-task-status.mock';
import {
  buildMockCompanionLink,
  buildMockCompanionLinkWithTasks,
} from '../../companion/mocks/companion-link.mock';
import { CompanionTaskStatusName, CompanionTaskType } from '@prisma/client';
import {
  CompanionPrimaryCareProviderTask,
  CompanionIdentificationImageTask,
  CompanionInsuranceImageTask,
  CompanionDefaultPharmacyTask,
  PcpTaskMetadata,
  CompanionConsentsTask,
  CompanionMedicationHistoryConsentTask,
} from '../models/companion-task';
import {
  QuestionAnswerDto,
  QuestionTag,
} from '../../social-history/dto/question-answer.dto';
import {
  mockStatsigService,
  mockTaskStatusNoteExperiment,
} from '../../statsig/mocks/statsig.service.mock';
import { mockClear, mockDeep } from 'jest-mock-extended';
import { buildMockQuestionAnswer } from '../../social-history/mocks/question-answer.mock';
import * as faker from 'faker';
import { VALID_YES_ANSWER } from '../../social-history/common';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { CareRequestRepository } from '../../care-request/care-request.repository';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { DashboardCareRequestNoteListResponse } from '../../dashboard/types/dashboard-care-request-note';
import { buildMockDashboardCareRequestNote } from '../../dashboard/mocks/dashboard-care-request.mock';
import { CARE_REQUEST_NOTE_DEFAULT_TYPE } from '../../companion/common';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';
import { CompanionService } from '../../companion/companion.service';
import { mockCompanionService } from '../../companion/mocks/companion.service.mock';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe(`${TasksRepository.name}`, () => {
  let app: INestApplication;
  let repository: TasksRepository;
  let findTasksSpy: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TasksModule, CommonModule],
    })
      .overrideProvider(CareRequestRepository)
      .useValue(mockCareRequestRepository)
      .overrideProvider(CompanionService)
      .useValue(mockCompanionService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .compile();

    repository = moduleRef.get<TasksRepository>(TasksRepository);
    findTasksSpy = jest.spyOn(repository, 'findTasks');

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockClear(findTasksSpy);
  });

  const mockCompanionLink = buildMockCompanionLink();

  const mockNotStartedCompanionTask = buildMockCompanionInsuranceTask({
    companionLinkId: mockCompanionLink.id,
    statuses: [
      buildMockTaskStatus({ name: CompanionTaskStatusName.NOT_STARTED }),
    ],
  });

  const mockCompletedPCPTask = buildMockPrimaryCareProviderTask({
    companionLinkId: mockCompanionLink.id,
    statuses: [
      buildMockTaskStatus({ name: CompanionTaskStatusName.COMPLETED }),
    ],
  });

  const mockStartedCompanionTask = buildMockCompanionInsuranceTask({
    companionLinkId: mockCompanionLink.id,
    statuses: [
      buildMockTaskStatus({ name: CompanionTaskStatusName.NOT_STARTED }),
      buildMockTaskStatus({ name: CompanionTaskStatusName.STARTED }),
    ],
  });

  const mockInsuranceTask = buildMockCompanionInsuranceTask();

  const mockIdentificationTask = buildMockCompanionIdentificationTask();

  const mockDefaultPharmacyTask = buildMockCompanionDefaultPharmacyTask();

  const mockPcpTask = buildMockPrimaryCareProviderTask();

  const mockClinicalProviderId = faker.datatype.number().toString();

  const mockMedicationConsentTask = buildMockCompanionMedicationConsentTask();

  const mockConsentsTask = buildMockCompanionConsentsTask();

  const mockTaskWithUnsupportedType = buildMockCompanionInsuranceTask({
    companionLinkId: mockCompanionLink.id,
    type: 'UNSUPPORTED' as never,
  });

  const mockLogger = mockDeep<Logger>();

  describe(`${TasksRepository.prototype.updateById.name}`, () => {
    const updateData: Pick<CompanionConsentsTask, 'metadata'> = {
      metadata: buildMockConsentsTaskMetadata(),
    };

    beforeEach(() => {
      mockDatabaseService.companionTask.findUnique.mockResolvedValue(
        mockNotStartedCompanionTask
      );
    });

    test(`should call update the task`, async () => {
      await repository.updateById(mockNotStartedCompanionTask.id, {
        data: updateData,
      });

      expect(mockDatabaseService.companionTask.update).toHaveBeenCalledTimes(1);
      expect(mockDatabaseService.companionTask.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: updateData })
      );
    });
  });

  describe(`${TasksRepository.prototype.updateTaskStatusById.name}`, () => {
    describe('Task exists', () => {
      const mockCareRequest: CareRequestDto = buildMockCareRequest({
        id: mockCompanionLink.careRequestId,
      });

      beforeEach(() => {
        mockDatabaseService.companionTask.findUnique.mockResolvedValue(
          mockNotStartedCompanionTask
        );
        mockCareRequestRepository.getByLinkId.mockResolvedValue(
          mockCareRequest
        );
      });

      test(`should call ${TasksRepository.prototype.updateTaskStatus.name}`, async () => {
        jest.spyOn(repository, 'updateTaskStatus');

        await repository.updateTaskStatusById(
          mockNotStartedCompanionTask.id,
          CompanionTaskStatusName.COMPLETED
        );

        expect(repository.updateTaskStatus).toHaveBeenCalledTimes(1);
      });
    });

    describe('Task does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionTask.findUnique.mockResolvedValue(null);
      });

      test(`should throw error`, async () => {
        await expect(
          repository.updateTaskStatusById(
            mockNotStartedCompanionTask.id,
            CompanionTaskStatusName.COMPLETED
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });

  describe(`${TasksRepository.prototype.updateTaskStatus.name}`, () => {
    describe('Task already in given state', () => {
      const mockCareRequestAccepted: CareRequestDto = buildMockCareRequest({
        id: mockCompanionLink.careRequestId,
        activeStatus: {
          id: faker.datatype.number(),
          name: CareRequestStatusText.Accepted,
          startedAt: '2021-07-14T15:19:12.797Z',
          username: faker.name.findName(),
          commenterName: faker.name.findName(),
        },
      });

      beforeEach(() => {
        mockDatabaseService.companionTask.findUnique.mockResolvedValue(
          mockCompletedPCPTask
        );
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockCompletedPCPTask,
        ]);
        mockCareRequestRepository.getByLinkId.mockResolvedValue(
          mockCareRequestAccepted
        );
      });

      test(`should not update status`, async () => {
        await repository.updateTaskStatus(
          mockStartedCompanionTask,
          CompanionTaskStatusName.STARTED
        );

        expect(
          mockDatabaseService.companionTaskStatus.create
        ).toHaveBeenCalledTimes(0);
        expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(1);
      });
    });

    describe('Task not already in given state', () => {
      test(`should update status`, async () => {
        const mockCareRequestAccepted: CareRequestDto = buildMockCareRequest({
          id: mockCompanionLink.careRequestId,
          activeStatus: {
            id: faker.datatype.number(),
            name: CareRequestStatusText.Accepted,
            startedAt: '2021-07-14T15:19:12.797Z',
            username: faker.name.findName(),
            commenterName: faker.name.findName(),
          },
        });

        mockCareRequestRepository.getByLinkId.mockResolvedValue(
          mockCareRequestAccepted
        );
        await repository.updateTaskStatus(
          mockNotStartedCompanionTask,
          CompanionTaskStatusName.STARTED
        );

        expect(
          mockDatabaseService.companionTaskStatus.create
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Task updated for care request on route', () => {
      const mockCareRequestOnRoute: CareRequestDto = buildMockCareRequest({
        id: mockCompanionLink.careRequestId,
        activeStatus: {
          id: faker.datatype.number(),
          name: CareRequestStatusText.OnRoute,
          startedAt: '2021-07-14T15:19:12.797Z',
          username: faker.name.findName(),
          commenterName: faker.name.findName(),
        },
      });
      const mockCompanionNote = buildMockDashboardCareRequestNote({
        note_type: CARE_REQUEST_NOTE_DEFAULT_TYPE,
      });
      const mockCareRequestNoteList: DashboardCareRequestNoteListResponse = [
        mockCompanionNote,
      ];
      const mockCompanionLinkWithTasks = buildMockCompanionLinkWithTasks();

      beforeEach(() => {
        mockDatabaseService.companionTask.findUnique.mockResolvedValue(
          mockCompletedPCPTask
        );
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockCompletedPCPTask,
        ]);
        mockCareRequestRepository.getByLinkId.mockResolvedValue(
          mockCareRequestOnRoute
        );
        mockCompanionService.findLinkById.mockResolvedValue(
          mockCompanionLinkWithTasks
        );

        mockTaskStatusNoteExperiment(true, [
          CompanionTaskType.IDENTIFICATION_IMAGE,
          CompanionTaskType.INSURANCE_CARD_IMAGES,
          CompanionTaskType.DEFAULT_PHARMACY,
          CompanionTaskType.PRIMARY_CARE_PROVIDER,
        ]);
      });

      describe('when there are no notes for the care request', () => {
        beforeEach(() => {
          mockDashboardService.getNotesForCareRequest.mockResolvedValue([]);
          mockDashboardService.createNoteForCareRequest.mockResolvedValue(
            undefined
          );
        });

        test(`should create a note`, async () => {
          await repository.updateTaskStatus(
            mockStartedCompanionTask,
            CompanionTaskStatusName.STARTED
          );

          expect(
            mockDatabaseService.companionTaskStatus.create
          ).toHaveBeenCalledTimes(0);
          expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(
            1
          );
          expect(
            mockDashboardService.getNotesForCareRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockDashboardService.createNoteForCareRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockDashboardService.updateNoteForCareRequest
          ).toHaveBeenCalledTimes(0);
        });
      });

      describe('when there is 1 note for the care request', () => {
        beforeEach(() => {
          mockDashboardService.getNotesForCareRequest.mockResolvedValue([
            mockCompanionNote,
          ]);
        });

        describe('displayed tasks: {}', () => {
          beforeEach(() => {
            mockTaskStatusNoteExperiment(true);
          });

          test(`should update a note if there is 1 note for the care request`, async () => {
            await repository.updateTaskStatus(
              mockStartedCompanionTask,
              CompanionTaskStatusName.STARTED
            );

            expect(
              mockDatabaseService.companionTaskStatus.create
            ).toHaveBeenCalledTimes(0);
            expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(
              1
            );
            expect(
              mockDashboardService.getNotesForCareRequest
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.createNoteForCareRequest
            ).toHaveBeenCalledTimes(0);
            expect(
              mockDashboardService.updateNoteForCareRequest
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.updateNoteForCareRequest
            ).toHaveBeenCalledWith(
              mockCareRequestOnRoute.id,
              mockCompanionNote.id,
              expect.objectContaining({
                meta_data: {
                  companionTasks: [],
                  completeCompanionTasks: [],
                },
              })
            );
          });
        });

        describe('displayed tasks: ID, Insurance', () => {
          beforeEach(() => {
            const displayedTasks = <CompanionTaskType[]>[
              CompanionTaskType.IDENTIFICATION_IMAGE,
              CompanionTaskType.INSURANCE_CARD_IMAGES,
            ];

            mockTaskStatusNoteExperiment(true, displayedTasks);
            mockDashboardService.getNotesForCareRequest.mockResolvedValue(
              mockCareRequestNoteList
            );
            mockDashboardService.updateNoteForCareRequest.mockResolvedValue(
              undefined
            );
          });

          test(`should update a note`, async () => {
            await repository.updateTaskStatus(
              mockStartedCompanionTask,
              CompanionTaskStatusName.STARTED
            );

            expect(
              mockDatabaseService.companionTaskStatus.create
            ).toHaveBeenCalledTimes(0);
            expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(
              1
            );
            expect(
              mockDashboardService.getNotesForCareRequest
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.createNoteForCareRequest
            ).toHaveBeenCalledTimes(0);
            expect(
              mockDashboardService.updateNoteForCareRequest
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.updateNoteForCareRequest
            ).toHaveBeenCalledWith(
              mockCareRequestOnRoute.id,
              mockCompanionNote.id,
              expect.objectContaining({
                meta_data: {
                  companionTasks: ['ID', 'Insurance'],
                  completeCompanionTasks: [],
                },
              })
            );
          });
        });

        describe('displayed tasks: ID, Insurance, PCP, Pharmacy', () => {
          beforeEach(() => {
            const displayedTasks = <CompanionTaskType[]>[
              CompanionTaskType.IDENTIFICATION_IMAGE,
              CompanionTaskType.INSURANCE_CARD_IMAGES,
              CompanionTaskType.PRIMARY_CARE_PROVIDER,
              CompanionTaskType.DEFAULT_PHARMACY,
            ];

            mockTaskStatusNoteExperiment(true, displayedTasks);
            mockDashboardService.updateNoteForCareRequest.mockResolvedValue(
              undefined
            );
          });

          describe(`when status is ${CompanionTaskStatusName.STARTED}`, () => {
            beforeEach(() => {
              mockDatabaseService.companionTask.findMany.mockResolvedValue([
                mockStartedCompanionTask,
              ]);
            });

            test(`should update a note`, async () => {
              await repository.updateTaskStatus(
                mockStartedCompanionTask,
                CompanionTaskStatusName.STARTED
              );

              expect(
                mockDatabaseService.companionTaskStatus.create
              ).toHaveBeenCalledTimes(0);
              expect(
                mockCareRequestRepository.getByLinkId
              ).toHaveBeenCalledTimes(1);
              expect(
                mockDashboardService.getNotesForCareRequest
              ).toHaveBeenCalledTimes(1);
              expect(
                mockDashboardService.createNoteForCareRequest
              ).toHaveBeenCalledTimes(0);
              expect(
                mockDashboardService.updateNoteForCareRequest
              ).toHaveBeenCalledTimes(1);
              expect(
                mockDashboardService.updateNoteForCareRequest
              ).toHaveBeenCalledWith(
                mockCareRequestOnRoute.id,
                mockCompanionNote.id,
                expect.objectContaining({
                  meta_data: {
                    companionTasks: ['ID', 'Insurance', 'PCP', 'Pharmacy'],
                    completeCompanionTasks: [],
                  },
                })
              );
            });
          });

          describe(`when status is ${CompanionTaskStatusName.COMPLETED}`, () => {
            beforeEach(() => {
              mockDatabaseService.companionTask.findMany.mockResolvedValue([
                mockCompletedPCPTask,
              ]);
            });

            test(`should update a note`, async () => {
              await repository.updateTaskStatus(
                mockStartedCompanionTask,
                CompanionTaskStatusName.COMPLETED
              );

              expect(
                mockDatabaseService.companionTaskStatus.create
              ).toHaveBeenCalledTimes(1);
              expect(
                mockCareRequestRepository.getByLinkId
              ).toHaveBeenCalledTimes(1);
              expect(
                mockDashboardService.getNotesForCareRequest
              ).toHaveBeenCalledTimes(1);
              expect(
                mockDashboardService.createNoteForCareRequest
              ).toHaveBeenCalledTimes(0);
              expect(
                mockDashboardService.updateNoteForCareRequest
              ).toHaveBeenCalledTimes(1);
              expect(
                mockDashboardService.updateNoteForCareRequest
              ).toHaveBeenCalledWith(
                mockCareRequestOnRoute.id,
                mockCompanionNote.id,
                expect.objectContaining({
                  meta_data: {
                    companionTasks: ['ID', 'Insurance', 'PCP', 'Pharmacy'],
                    completeCompanionTasks: ['PCP'],
                  },
                })
              );
            });
          });
        });
      });

      describe('when there are 2 note for the care request', () => {
        beforeEach(() => {
          mockTaskStatusNoteExperiment(true);
          mockDashboardService.getNotesForCareRequest.mockResolvedValue([
            mockCompanionNote,
            mockCompanionNote,
          ]);
        });

        test(`should return an error`, async () => {
          await repository.updateTaskStatus(
            mockNotStartedCompanionTask,
            CompanionTaskStatusName.STARTED
          );

          expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(
            1
          );
          expect(
            mockDashboardService.getNotesForCareRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockDashboardService.createNoteForCareRequest
          ).toHaveBeenCalledTimes(0);
          expect(
            mockDashboardService.updateNoteForCareRequest
          ).toHaveBeenCalledTimes(0);
          expect(mockLogger.error).toHaveBeenCalledWith(
            'expected to find 0 or 1 note, 2 found',
            {
              careRequestId: mockCompanionLink.careRequestId,
              companionLinkId: mockCompanionLink.id,
              note: expect.objectContaining({
                note_type: 'companion_checkin_task_statuses',
              }),
            }
          );
        });
      });

      describe('when no care request is found for the companion link', () => {
        beforeEach(() => {
          mockDashboardService.getNotesForCareRequest.mockResolvedValue([]);
          mockDashboardService.createNoteForCareRequest.mockResolvedValue(
            undefined
          );
          mockCareRequestRepository.getByLinkId.mockRejectedValue(new Error());
        });

        test(`should return an error`, async () => {
          await expect(
            repository.updateTaskStatus(
              mockStartedCompanionTask,
              CompanionTaskStatusName.STARTED
            )
          ).rejects.toBeInstanceOf(Error);
          expect(
            mockDatabaseService.companionTaskStatus.create
          ).toHaveBeenCalledTimes(0);
          expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(
            1
          );
          expect(
            mockDashboardService.getNotesForCareRequest
          ).toHaveBeenCalledTimes(0);
          expect(
            mockDashboardService.createNoteForCareRequest
          ).toHaveBeenCalledTimes(0);
          expect(
            mockDashboardService.updateNoteForCareRequest
          ).toHaveBeenCalledTimes(0);
        });
      });

      describe('when an Error is thrown when updateNoteForCareRequest is called', () => {
        beforeEach(() => {
          mockDashboardService.getNotesForCareRequest.mockResolvedValue([]);
          mockDashboardService.createNoteForCareRequest.mockRejectedValue(
            new Error()
          );
        });

        test(`should surface Error when createNoteForCareRequest returns an error`, async () => {
          await repository.updateTaskStatus(
            mockStartedCompanionTask,
            CompanionTaskStatusName.STARTED
          );

          expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(
            1
          );
          expect(
            mockDashboardService.getNotesForCareRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockDashboardService.createNoteForCareRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockDashboardService.updateNoteForCareRequest
          ).toHaveBeenCalledTimes(0);
          expect(mockLogger.error).toHaveBeenCalledWith(
            'failed to upsert note for care request',
            {
              careRequestId: mockCompanionLink.careRequestId,
              error: expect.any(Error),
            }
          );
        });
      });

      describe('when an Error is thrown when updateNoteForCareRequest is called', () => {
        beforeEach(() => {
          mockDashboardService.getNotesForCareRequest.mockResolvedValue(
            mockCareRequestNoteList
          );
          mockDashboardService.updateNoteForCareRequest.mockRejectedValue(
            new Error()
          );
        });

        test('should surface Error when updateNoteForCareRequest returns an error', async () => {
          await repository.updateTaskStatus(
            mockStartedCompanionTask,
            CompanionTaskStatusName.STARTED
          );

          expect(mockCareRequestRepository.getByLinkId).toHaveBeenCalledTimes(
            1
          );
          expect(
            mockDashboardService.getNotesForCareRequest
          ).toHaveBeenCalledTimes(1);
          expect(
            mockDashboardService.createNoteForCareRequest
          ).toHaveBeenCalledTimes(0);
          expect(
            mockDashboardService.updateNoteForCareRequest
          ).toHaveBeenCalledTimes(1);
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Unable to update note for care request.',
            {
              careRequestId: mockCompanionLink.careRequestId,
              companionLinkId: mockCompanionLink.id,
              note: expect.objectContaining({
                note_type: 'companion_checkin_task_statuses',
              }),
            }
          );
        });
      });
    });
  });

  describe(`${TasksRepository.prototype.findTask.name}`, () => {
    describe('Finds tasks', () => {
      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockNotStartedCompanionTask,
        ]);
      });

      test(`should return task`, async () => {
        const result = await repository.findTask(
          mockCompanionLink.id,
          mockNotStartedCompanionTask.type
        );

        expect(result).toStrictEqual(mockNotStartedCompanionTask);
      });

      test(`should send task type to find tasks if provided`, async () => {
        await repository.findTask(
          mockCompanionLink.id,
          mockNotStartedCompanionTask.type
        );

        expect(repository.findTasks).toHaveBeenCalledTimes(1);
        expect(repository.findTasks).toHaveBeenCalledWith(
          mockCompanionLink.id,
          mockNotStartedCompanionTask.type
        );
      });

      test(`should not send task type to find tasks if not provided`, async () => {
        await repository.findTask(mockCompanionLink.id);

        expect(repository.findTasks).toHaveBeenCalledTimes(1);
        expect(repository.findTasks).toHaveBeenCalledWith(mockCompanionLink.id);
      });
    });

    describe('Finds no tasks', () => {
      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([]);
      });

      test(`should not return task`, async () => {
        const result = await repository.findTask(
          mockCompanionLink.id,
          mockNotStartedCompanionTask.type
        );

        expect(result).toBeUndefined();
      });

      test(`should send task type to find tasks if provided`, async () => {
        await repository.findTask(
          mockCompanionLink.id,
          mockNotStartedCompanionTask.type
        );

        expect(repository.findTasks).toHaveBeenCalledTimes(1);
        expect(repository.findTasks).toHaveBeenCalledWith(
          mockCompanionLink.id,
          mockNotStartedCompanionTask.type
        );
      });

      test(`should not send task type to find tasks if not provided`, async () => {
        await repository.findTask(mockCompanionLink.id);

        expect(repository.findTasks).toHaveBeenCalledTimes(1);
        expect(repository.findTasks).toHaveBeenCalledWith(mockCompanionLink.id);
      });
    });
  });

  describe(`${TasksRepository.prototype.findTasks.name}`, () => {
    beforeEach(() => {
      mockDatabaseService.companionTask.findMany.mockResolvedValue([
        mockNotStartedCompanionTask,
        mockStartedCompanionTask,
      ]);
    });

    test(`should filter by given link ID`, async () => {
      await repository.findTasks(
        mockCompanionLink.id,
        CompanionTaskType.INSURANCE_CARD_IMAGES
      );

      expect(mockDatabaseService.companionTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companionLinkId: mockCompanionLink.id,
            type: expect.any(String),
          },
        })
      );
    });

    test(`should filter by given type`, async () => {
      const type: CompanionTaskType = CompanionTaskType.INSURANCE_CARD_IMAGES;

      await repository.findTasks(mockCompanionLink.id, type);

      expect(mockDatabaseService.companionTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companionLinkId: expect.any(String),
            type: type,
          },
        })
      );
    });

    test(`should include task statuses`, async () => {
      const type: CompanionTaskType = CompanionTaskType.IDENTIFICATION_IMAGE;

      await repository.findTasks(mockCompanionLink.id, type);

      expect(mockDatabaseService.companionTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            statuses: true,
          },
        })
      );
    });

    describe(`Type Filter: ${CompanionTaskType.IDENTIFICATION_IMAGE}`, () => {
      const type: CompanionTaskType = CompanionTaskType.IDENTIFICATION_IMAGE;

      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockIdentificationTask,
        ]);
      });

      test(`should return domain instances`, async () => {
        jest.spyOn(CompanionIdentificationImageTask, 'fromCompanionTask');

        await repository.findTasks(mockCompanionLink.id, type);

        expect(
          CompanionIdentificationImageTask.fromCompanionTask
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe(`Type Filter: ${CompanionTaskType.INSURANCE_CARD_IMAGES}`, () => {
      const type: CompanionTaskType = CompanionTaskType.INSURANCE_CARD_IMAGES;

      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockInsuranceTask,
        ]);
      });

      test(`should return domain instances`, async () => {
        jest.spyOn(CompanionInsuranceImageTask, 'fromCompanionTask');

        await repository.findTasks(mockCompanionLink.id, type);

        expect(
          CompanionInsuranceImageTask.fromCompanionTask
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe(`Type Filter: ${CompanionTaskType.DEFAULT_PHARMACY}`, () => {
      const type: CompanionTaskType = CompanionTaskType.DEFAULT_PHARMACY;

      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockDefaultPharmacyTask,
        ]);
      });

      test(`should return domain instances`, async () => {
        jest.spyOn(CompanionDefaultPharmacyTask, 'fromCompanionTask');

        await repository.findTasks(mockCompanionLink.id, type);

        expect(
          CompanionDefaultPharmacyTask.fromCompanionTask
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe(`Type Filter: ${CompanionTaskType.PRIMARY_CARE_PROVIDER}`, () => {
      const type: CompanionTaskType = CompanionTaskType.PRIMARY_CARE_PROVIDER;

      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockPcpTask,
        ]);
      });

      test(`should return domain instances`, async () => {
        jest.spyOn(CompanionPrimaryCareProviderTask, 'fromCompanionTask');

        await repository.findTasks(mockCompanionLink.id, type);

        expect(
          CompanionPrimaryCareProviderTask.fromCompanionTask
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe(`Type Filter: ${CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY}`, () => {
      const type: CompanionTaskType =
        CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY;

      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockMedicationConsentTask,
        ]);
      });

      test(`should return domain instances`, async () => {
        jest.spyOn(CompanionMedicationHistoryConsentTask, 'fromCompanionTask');

        await repository.findTasks(mockCompanionLink.id, type);

        expect(
          CompanionMedicationHistoryConsentTask.fromCompanionTask
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe(`Type Filter: ${CompanionTaskType.CONSENTS}`, () => {
      const type: CompanionTaskType = CompanionTaskType.CONSENTS;

      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockConsentsTask,
        ]);
      });

      test(`should return domain instances`, async () => {
        jest.spyOn(CompanionConsentsTask, 'fromCompanionTask');

        await repository.findTasks(mockCompanionLink.id, type);

        expect(CompanionConsentsTask.fromCompanionTask).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe('Unsupported task type', () => {
      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockTaskWithUnsupportedType,
        ]);
      });

      test(`should throw error`, async () => {
        await expect(
          repository.findTasks(mockCompanionLink.id)
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${TasksRepository.prototype.onSocialHistoryUpdate.name}`, () => {
    describe('Task does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionTask.findMany.mockResolvedValue([]);
      });

      const mockCompanionLinkWithTasks = buildMockCompanionLinkWithTasks();
      const questionAnswer = buildMockQuestionAnswer(
        QuestionTag.HAS_PCP,
        VALID_YES_ANSWER
      );

      test(`should throw error`, async () => {
        await expect(
          repository.onSocialHistoryUpdate(
            mockCompanionLinkWithTasks,
            questionAnswer
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });

    describe(`${TasksRepository.prototype.newPrimaryCareProviderStatus.name}`, () => {
      const newPcpStatus = (
        startingMetadata: PcpTaskMetadata,
        questionAnswer: QuestionAnswerDto
      ) => {
        const mockPcpTaskWithMetadata = buildMockPrimaryCareProviderTask({
          metadata: startingMetadata,
        });

        return repository.newPrimaryCareProviderStatus(
          mockPcpTaskWithMetadata,
          questionAnswer
        );
      };

      describe('when metadata is null', () => {
        const questionAnswer = buildMockQuestionAnswer(
          QuestionTag.HAS_PCP,
          VALID_YES_ANSWER
        );
        const mockMetadata: PcpTaskMetadata = null;
        const expectedMetadata: PcpTaskMetadata = {
          clinicalProviderId: undefined,
          socialHistoryResponses: { [QuestionTag.HAS_PCP]: true },
        };

        test('should return updated task metadata and status', async () => {
          const status = await newPcpStatus(mockMetadata, questionAnswer);

          expect(status.metadata).toEqual(expectedMetadata);
          expect(status.overallStatus).toEqual(CompanionTaskStatusName.STARTED);
        });
      });

      describe('Answer submitted for HAS_PCP question tag', () => {
        describe('when answer is Y', () => {
          const questionAnswer = buildMockQuestionAnswer(
            QuestionTag.HAS_PCP,
            VALID_YES_ANSWER
          );

          describe('when clinical provider ID is undefined', () => {
            const mockMetadata: PcpTaskMetadata = {
              socialHistoryResponses: {},
            };
            const expectedMetadata: PcpTaskMetadata = {
              socialHistoryResponses: { [QuestionTag.HAS_PCP]: true },
            };

            test('should return updated task metadata and status', async () => {
              const status = await newPcpStatus(mockMetadata, questionAnswer);

              expect(status.metadata).toEqual(expectedMetadata);
              expect(status.overallStatus).toEqual(
                CompanionTaskStatusName.STARTED
              );
            });
          });

          describe('when clinical provider ID is in metadata', () => {
            const mockMetadata: PcpTaskMetadata = {
              clinicalProviderId: mockClinicalProviderId,
              socialHistoryResponses: {},
            };
            const expectedMetadata: PcpTaskMetadata = {
              clinicalProviderId: mockClinicalProviderId,
              socialHistoryResponses: { [QuestionTag.HAS_PCP]: true },
            };

            test('should return updated task metadata and status', async () => {
              const status = await newPcpStatus(mockMetadata, questionAnswer);

              expect(status.metadata).toEqual(expectedMetadata);
              expect(status.overallStatus).toEqual(
                CompanionTaskStatusName.STARTED
              );
            });
          });
        });

        describe('when answer is N', () => {
          const questionAnswer = buildMockQuestionAnswer(
            QuestionTag.HAS_PCP,
            'N'
          );

          describe('when clinical provider ID is undefined', () => {
            const mockMetadata: PcpTaskMetadata = {
              socialHistoryResponses: {},
            };
            const expectedMetadata: PcpTaskMetadata = {
              socialHistoryResponses: {
                [QuestionTag.HAS_PCP]: false,
                [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
              },
            };

            test('should return updated task metadata and status', async () => {
              const status = await newPcpStatus(mockMetadata, questionAnswer);

              expect(status.metadata).toEqual(expectedMetadata);
              expect(status.overallStatus).toEqual(
                CompanionTaskStatusName.COMPLETED
              );
            });
          });

          describe('when clinicalProviderId is in metadata', () => {
            const mockMetadata: PcpTaskMetadata = {
              clinicalProviderId: mockClinicalProviderId,
              socialHistoryResponses: {},
            };
            const expectedMetadata: PcpTaskMetadata = {
              clinicalProviderId: mockClinicalProviderId,
              socialHistoryResponses: {
                [QuestionTag.HAS_PCP]: false,
                [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
              },
            };

            test('should return updated task metadata and status', async () => {
              const status = await newPcpStatus(mockMetadata, questionAnswer);

              expect(status.metadata).toEqual(expectedMetadata);
              expect(status.overallStatus).toEqual(
                CompanionTaskStatusName.COMPLETED
              );
            });
          });
        });
      });

      describe('Answer submitted for HAS_SEEN_PCP_RECENTLY question tag', () => {
        describe('when answer is Y', () => {
          const questionAnswer = buildMockQuestionAnswer(
            QuestionTag.HAS_SEEN_PCP_RECENTLY,
            VALID_YES_ANSWER
          );

          describe('when HAS_PCP is true', () => {
            describe('when clinicalProviderId is in metadata', () => {
              const mockMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                },
              };
              const expectedMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
                },
              };

              test('should return updated task metadata and status', async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.COMPLETED
                );
              });
            });

            describe('when clinical provider ID is undefined', () => {
              const mockMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                },
              };
              const expectedMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
                },
              };

              test(`should return updated task metadata and status`, async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.STARTED
                );
              });
            });
          });

          describe('when HAS_PCP is undefined', () => {
            describe('when clinicalProviderId is in metadata', () => {
              const mockMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {},
              };
              const expectedMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
                },
              };

              test(`should return updated task metadata and status`, async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.COMPLETED
                );
              });
            });

            describe('when clinical provider ID is undefined', () => {
              const mockMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {},
              };
              const expectedMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
                },
              };

              test(`should return updated task metadata and status`, async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.STARTED
                );
              });
            });
          });
        });

        describe('when answer is N', () => {
          const questionAnswer = buildMockQuestionAnswer(
            QuestionTag.HAS_SEEN_PCP_RECENTLY,
            'N'
          );

          describe('when HAS_PCP is true', () => {
            describe('when clinicalProviderId is in metadata', () => {
              const mockMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                },
              };
              const expectedMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
                },
              };

              test(`should return updated task metadata and status`, async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.COMPLETED
                );
              });
            });

            describe('when clinical provider ID is undefined', () => {
              const mockMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                },
              };
              const expectedMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {
                  [QuestionTag.HAS_PCP]: true,
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
                },
              };

              test(`should return updated task metadata and status`, async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.STARTED
                );
              });
            });
          });

          describe('when HAS_PCP is undefined', () => {
            describe('when clinicalProviderId is in metadata', () => {
              const mockMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {},
              };
              const expectedMetadata: PcpTaskMetadata = {
                clinicalProviderId: mockClinicalProviderId,
                socialHistoryResponses: {
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
                },
              };

              test(`should return updated task metadata and status`, async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.COMPLETED
                );
              });
            });

            describe('when clinical provider ID is undefined', () => {
              const mockMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {},
              };
              const expectedMetadata: PcpTaskMetadata = {
                socialHistoryResponses: {
                  [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
                },
              };

              test(`should return updated task metadata and status`, async () => {
                const status = await newPcpStatus(mockMetadata, questionAnswer);

                expect(status.metadata).toEqual(expectedMetadata);
                expect(status.overallStatus).toEqual(
                  CompanionTaskStatusName.STARTED
                );
              });
            });
          });
        });
      });
    });
  });

  describe(`${TasksRepository.prototype.getPcpTaskStatusFromMetadata.name}`, () => {
    describe('when metadata is null', () => {
      const metadata: PcpTaskMetadata = null;

      test(`should return ${CompanionTaskStatusName.NOT_STARTED}`, async () => {
        expect(await repository.getPcpTaskStatusFromMetadata(metadata)).toEqual(
          CompanionTaskStatusName.NOT_STARTED
        );
      });
    });

    describe('No social history responses', () => {
      describe('when clinical provider ID is undefined', () => {
        const metadata: PcpTaskMetadata = {
          socialHistoryResponses: {},
        };

        test(`should return ${CompanionTaskStatusName.NOT_STARTED}`, async () => {
          expect(
            await repository.getPcpTaskStatusFromMetadata(metadata)
          ).toEqual(CompanionTaskStatusName.NOT_STARTED);
        });
      });

      describe('when clinicalProviderId is in metadata', () => {
        const metadata: PcpTaskMetadata = {
          clinicalProviderId: mockClinicalProviderId,
          socialHistoryResponses: {},
        };

        test(`should return ${CompanionTaskStatusName.STARTED}`, async () => {
          expect(
            await repository.getPcpTaskStatusFromMetadata(metadata)
          ).toEqual(CompanionTaskStatusName.STARTED);
        });
      });
    });

    describe('socialHistoryResponses: HAS_PCP is false', () => {
      describe('when clinical provider ID is undefined', () => {
        const metadata: PcpTaskMetadata = {
          socialHistoryResponses: {
            [QuestionTag.HAS_PCP]: false,
          },
        };

        test(`should return ${CompanionTaskStatusName.COMPLETED}`, async () => {
          expect(
            await repository.getPcpTaskStatusFromMetadata(metadata)
          ).toEqual(CompanionTaskStatusName.COMPLETED);
        });
      });

      describe('when clinicalProviderId is in metadata', () => {
        const metadata: PcpTaskMetadata = {
          clinicalProviderId: mockClinicalProviderId,
          socialHistoryResponses: {
            [QuestionTag.HAS_PCP]: false,
          },
        };

        test(`should return ${CompanionTaskStatusName.COMPLETED}`, async () => {
          expect(
            await repository.getPcpTaskStatusFromMetadata(metadata)
          ).toEqual(CompanionTaskStatusName.COMPLETED);
        });
      });
    });

    describe('socialHistoryResponses: HAS_PCP is true', () => {
      describe('when HAS_SEEN_PCP_RECENTLY is not undefined', () => {
        describe('when clinical provider ID is undefined', () => {
          const metadata: PcpTaskMetadata = {
            socialHistoryResponses: {
              [QuestionTag.HAS_PCP]: true,
              [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
            },
          };

          test(`should return ${CompanionTaskStatusName.STARTED}`, async () => {
            expect(
              await repository.getPcpTaskStatusFromMetadata(metadata)
            ).toEqual(CompanionTaskStatusName.STARTED);
          });
        });

        describe('when clinicalProviderId is in metadata', () => {
          const metadata: PcpTaskMetadata = {
            clinicalProviderId: mockClinicalProviderId,
            socialHistoryResponses: {
              [QuestionTag.HAS_PCP]: true,
              [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
            },
          };

          test(`should return ${CompanionTaskStatusName.COMPLETED}`, async () => {
            expect(
              await repository.getPcpTaskStatusFromMetadata(metadata)
            ).toEqual(CompanionTaskStatusName.COMPLETED);
          });
        });
      });
    });

    describe('when HAS_PCP is undefined', () => {
      describe('when HAS_SEEN_PCP_RECENTLY is true', () => {
        describe('when clinical provider ID is undefined', () => {
          const metadata: PcpTaskMetadata = {
            socialHistoryResponses: {
              [QuestionTag.HAS_SEEN_PCP_RECENTLY]: true,
            },
          };

          test(`should return ${CompanionTaskStatusName.STARTED}`, async () => {
            expect(
              await repository.getPcpTaskStatusFromMetadata(metadata)
            ).toEqual(CompanionTaskStatusName.STARTED);
          });
        });

        describe('when clinicalProviderId is in metadata', () => {
          const metadata: PcpTaskMetadata = {
            clinicalProviderId: mockClinicalProviderId,
            socialHistoryResponses: {
              [QuestionTag.HAS_PCP]: true,
            },
          };

          test(`should return ${CompanionTaskStatusName.STARTED}`, async () => {
            expect(
              await repository.getPcpTaskStatusFromMetadata(metadata)
            ).toEqual(CompanionTaskStatusName.STARTED);
          });
        });
      });

      describe('when HAS_SEEN_PCP_RECENTLY is false', () => {
        describe('when clinical provider ID is undefined', () => {
          const metadata: PcpTaskMetadata = {
            socialHistoryResponses: {
              [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
            },
          };

          test(`should return ${CompanionTaskStatusName.STARTED}`, async () => {
            expect(
              await repository.getPcpTaskStatusFromMetadata(metadata)
            ).toEqual(CompanionTaskStatusName.STARTED);
          });
        });

        describe('when clinicalProviderId is in metadata', () => {
          const metadata: PcpTaskMetadata = {
            clinicalProviderId: mockClinicalProviderId,
            socialHistoryResponses: {
              [QuestionTag.HAS_SEEN_PCP_RECENTLY]: false,
            },
          };

          test(`should return ${CompanionTaskStatusName.COMPLETED}`, async () => {
            expect(
              await repository.getPcpTaskStatusFromMetadata(metadata)
            ).toEqual(CompanionTaskStatusName.COMPLETED);
          });
        });
      });
    });
  });
});
