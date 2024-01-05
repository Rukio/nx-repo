import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { CompanionTaskStatusName, CompanionTaskType } from '@prisma/client';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { DatabaseService } from '../../database/database.service';
import { CompanionModule } from '../companion.module';
import { CompanionService } from '../companion.service';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import {
  buildMockCareRequest,
  buildMockDashboardEtaRange,
  buildMockDashboardWebhookCareRequest,
} from '../../care-request/mocks/care-request.repository.mock';
import { SmsService } from '../../communications/sms.service';
import { mockSmsService } from '../../communications/mocks/sms.service.mock';
import { NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { buildMockCompanionInfoFromCareRequest } from '../mocks/companion-info.mock';
import { buildMockDashboardPatient } from '../../dashboard/mocks/dashboard-patient.mock';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { CurrentStateDto } from '../../care-request/dto/current-state.dto';
import { mockConfigService } from '../../common/mocks/config.service.mock';
import { ConfigService } from '@nestjs/config';
import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import { CommonModule } from '../../common/common.module';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import {
  buildMockCompanionLink,
  buildMockCompanionLinkWithTasks,
} from '../mocks/companion-link.mock';
import { buildMockDriversLicenseUploadResponse as buildMockDashboardDriversLicense } from '../../dashboard/mocks/drivers-license-upload-response.mock';
import { format } from 'date-fns';
import {
  buildMockPrimaryCareProviderTask,
  buildMockCompanionTaskStatus,
  buildMockCompanionDefaultPharmacyTask,
  buildMockCompanionIdentificationTask,
  buildMockCompanionInsuranceTask,
  buildMockCompanionMedicationConsentTask,
  buildMockCompanionConsentsTask,
} from '../../tasks/mocks/companion-task.mock';

import { buildMockDashboardInsurance } from '../../dashboard/mocks/dashboard-insurance.mock';
import { TasksRepository } from '../../tasks/tasks.repository';
import { mockTasksRepository } from '../../tasks/mocks/tasks.repository.mock';
import { buildMockDashboardPharmacy } from '../../dashboard/mocks/dashboard-pharmacy.mock';
import { buildMockDashboardPrimaryCareProvider } from '../../dashboard/mocks/dashboard-primary-care-provider.mock';
import { buildMockUploadedImage } from '../../dashboard/mocks/uploaded-image.mock';
import { CompanionLinkAnalytics } from '../dto/companion-link-analytics.dto';
import {
  buildMockDynamicConfig,
  mockConsentsModuleExperiment,
  mockReminderTextExperiment,
  mockStatsigService,
} from '../../statsig/mocks/statsig.service.mock';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import {
  buildMockDashboardSocialHistory,
  buildSocialHistoryQuestion,
} from '../../dashboard/mocks/social-history.mock';
import { VALID_NO_ANSWER, VALID_YES_ANSWER } from '../../social-history/common';
import { buildMockCareTeamEta } from '../../dashboard/mocks/care-team-eta.mock';
import { JobsService } from '../../jobs/jobs.service';
import { mockJobsService } from '../../jobs/mocks/jobs.service.mock';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../mocks/segment.service.mock';

describe(`${CompanionService.name}`, () => {
  let service: CompanionService;
  const MAX_INVALID_AUTH_COUNT =
    process.env.COMPANION_MAX_AUTH_ATTEMPTS === undefined
      ? 25
      : Number(process.env.COMPANION_MAX_AUTH_ATTEMPTS);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SmsService)
      .useValue(mockSmsService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .overrideProvider(TasksRepository)
      .useValue(mockTasksRepository)
      .overrideProvider(JobsService)
      .useValue(mockJobsService)
      .compile();

    service = module.get<CompanionService>(CompanionService);

    mockStatsigService.getConfig.mockResolvedValue(buildMockDynamicConfig([]));
  });

  const mockDashboardApiCareRequest = buildMockDashboardWebhookCareRequest();

  const mockCompanionLink = buildMockCompanionLinkWithTasks({
    careRequestId: mockDashboardApiCareRequest.external_id,
    createdNotificationSent: false,
    onRouteNotificationSent: false,
  });

  const mockCompanionLinkWithNoTasks = buildMockCompanionLink();

  const mockCompanionLinkBlocked = buildMockCompanionLink({
    careRequestId: mockDashboardApiCareRequest.external_id,
    invalidAuthCount: MAX_INVALID_AUTH_COUNT,
    isBlocked: true,
    lastInvalidAuth: new Date(),
  });

  const mockCompanionLinkBlockedMaxAuth = buildMockCompanionLink({
    careRequestId: mockDashboardApiCareRequest.external_id,
    invalidAuthCount: MAX_INVALID_AUTH_COUNT,
    isBlocked: false,
    lastInvalidAuth: new Date(),
  });

  const mockCareRequest = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });
  const mockDashboardDriversLicense = buildMockDashboardDriversLicense();
  const mockDashboardInsuranceWithImage = buildMockDashboardInsurance({
    card_back: buildMockUploadedImage(),
    card_front: buildMockUploadedImage(),
  });
  const mockDashboardDefaultPharmacy = buildMockDashboardPharmacy();

  const mockIdentificationImageTask = buildMockCompanionIdentificationTask();
  const mockInsuranceImageTask = buildMockCompanionInsuranceTask();
  const mockPharmacyTask = buildMockCompanionDefaultPharmacyTask();
  const mockPcpTaskV1 = buildMockPrimaryCareProviderTask({
    metadata: null as never,
  });
  const mockPcpTask = buildMockPrimaryCareProviderTask();
  const mockMedicationConsentTask = buildMockCompanionMedicationConsentTask();

  const mockDashboardPrimaryCareProvider =
    buildMockDashboardPrimaryCareProvider();
  const mockAnalyticsInfo: CompanionLinkAnalytics = {
    statsigCareRequestId: mockCareRequest.statsigCareRequestId,
  };

  describe(`${CompanionService.prototype.createCompanionLink.name}`, () => {
    describe(`Successful`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.create.mockResolvedValue(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.getDriversLicenseByPatientId.mockResolvedValue(
          mockDashboardDriversLicense
        );
        mockDashboardService.getPatientInsurances.mockResolvedValue([
          mockDashboardInsuranceWithImage,
        ]);
        mockDashboardService.getDefaultPharmacyByPatientId.mockResolvedValue(
          mockDashboardDefaultPharmacy
        );
        mockDashboardService.getPrimaryCareProviderEhrIdByPatientId.mockResolvedValue(
          mockDashboardPrimaryCareProvider.primaryCareProvider
            .clinicalProviderId as string
        );
        mockTasksRepository.getPcpTaskStatusFromMetadata.mockResolvedValue(
          CompanionTaskStatusName.NOT_STARTED
        );
      });

      describe('Link does not currently exist', () => {
        beforeEach(() => {
          mockDatabaseService.companionLink.findFirst.mockResolvedValue(null);
        });

        test(`should add link to database with one of each task`, async () => {
          await service.createCompanionLink(mockDashboardApiCareRequest);

          expect(
            mockDatabaseService.companionLink.create
          ).toHaveBeenCalledTimes(1);
          expect(mockDatabaseService.companionLink.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: {
                careRequestId: mockDashboardApiCareRequest.external_id,
                tasks: {
                  create: Object.values(CompanionTaskType).map((type) =>
                    expect.objectContaining({
                      type,
                      statuses: expect.objectContaining({
                        create: { name: expect.any(String) },
                      }),
                    })
                  ),
                },
              },
            })
          );
        });

        describe('Metadata includes Social History', () => {
          const hasPcpQuestionKey = 'LOCAL.227';
          const seenPcpRecentlyQuestionKey = 'LOCAL.247';
          const mockClinicalProviderId =
            mockDashboardPrimaryCareProvider.primaryCareProvider
              .clinicalProviderId;

          beforeEach(() => {
            mockStatsigService.getConfig.mockResolvedValueOnce(
              buildMockDynamicConfig(hasPcpQuestionKey)
            );

            mockStatsigService.getConfig.mockResolvedValueOnce(
              buildMockDynamicConfig(seenPcpRecentlyQuestionKey)
            );
          });

          describe('Social history is empty', () => {
            const mockSocialHistory = buildMockDashboardSocialHistory([]);

            beforeEach(() => {
              mockDashboardService.getPatientSocialHistory.mockResolvedValue(
                mockSocialHistory
              );
            });

            describe('clinicalProviderId is blank', () => {
              beforeEach(() => {
                mockDashboardService.getPrimaryCareProviderEhrIdByPatientId.mockResolvedValue(
                  null
                );
              });

              test(`should have empty social history responses`, async () => {
                await service.createCompanionLink(mockDashboardApiCareRequest);

                const passedMetadata = {
                  socialHistoryResponses: {},
                };

                expect(
                  mockTasksRepository.getPcpTaskStatusFromMetadata
                ).toHaveBeenCalledWith(passedMetadata);
              });
            });

            describe('clinicalProviderId is present', () => {
              test(`should have empty social history responses and a clinical provider ID`, async () => {
                await service.createCompanionLink(mockDashboardApiCareRequest);

                const passedMetadata = {
                  socialHistoryResponses: {},
                  clinicalProviderId: mockClinicalProviderId,
                };

                expect(
                  mockTasksRepository.getPcpTaskStatusFromMetadata
                ).toHaveBeenCalledWith(passedMetadata);
              });
            });
          });

          describe('Social history responses include HAS_PCP: Y, SEEN_PCP_RECENTLY: Y', () => {
            const mockQuestions = [
              buildSocialHistoryQuestion({
                key: hasPcpQuestionKey,
                answer: VALID_YES_ANSWER,
              }),
              buildSocialHistoryQuestion({
                key: seenPcpRecentlyQuestionKey,
                answer: VALID_YES_ANSWER,
              }),
            ];
            const mockSocialHistory =
              buildMockDashboardSocialHistory(mockQuestions);

            beforeEach(() => {
              mockDashboardService.getPatientSocialHistory.mockResolvedValue(
                mockSocialHistory
              );
            });

            test(`should add Social History responses to metadata`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              const passedMetadata = {
                socialHistoryResponses: {
                  HAS_PCP: true,
                  HAS_SEEN_PCP_RECENTLY: true,
                },
                clinicalProviderId: mockClinicalProviderId,
              };

              expect(
                mockTasksRepository.getPcpTaskStatusFromMetadata
              ).toHaveBeenCalledWith(passedMetadata);
            });
          });

          describe('Social history responses include HAS_PCP: Y, SEEN_PCP_RECENTLY: N', () => {
            const mockQuestions = [
              buildSocialHistoryQuestion({
                key: hasPcpQuestionKey,
                answer: VALID_YES_ANSWER,
              }),
              buildSocialHistoryQuestion({
                key: seenPcpRecentlyQuestionKey,
                answer: VALID_NO_ANSWER,
              }),
            ];
            const mockSocialHistory =
              buildMockDashboardSocialHistory(mockQuestions);

            beforeEach(() => {
              mockDashboardService.getPatientSocialHistory.mockResolvedValue(
                mockSocialHistory
              );
            });

            test(`should add Social History responses to metadata`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              const passedMetadata = {
                socialHistoryResponses: {
                  HAS_PCP: true,
                  HAS_SEEN_PCP_RECENTLY: false,
                },
                clinicalProviderId: mockClinicalProviderId,
              };

              expect(
                mockTasksRepository.getPcpTaskStatusFromMetadata
              ).toHaveBeenCalledWith(passedMetadata);
            });
          });

          describe('Social history responses include only HAS_PCP: Y', () => {
            const mockQuestions = [
              buildSocialHistoryQuestion({
                key: hasPcpQuestionKey,
                answer: VALID_YES_ANSWER,
              }),
            ];
            const mockSocialHistory =
              buildMockDashboardSocialHistory(mockQuestions);

            beforeEach(() => {
              mockDashboardService.getPatientSocialHistory.mockResolvedValue(
                mockSocialHistory
              );
            });

            test(`should add Social History responses to metadata`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              const passedMetadata = {
                socialHistoryResponses: { HAS_PCP: true },
                clinicalProviderId: mockClinicalProviderId,
              };

              expect(
                mockTasksRepository.getPcpTaskStatusFromMetadata
              ).toHaveBeenCalledWith(passedMetadata);
            });
          });

          describe('Social history responses include only HAS_SEEN_PCP_RECENTLY: Y', () => {
            const mockQuestions = [
              buildSocialHistoryQuestion({
                key: seenPcpRecentlyQuestionKey,
                answer: VALID_YES_ANSWER,
              }),
            ];
            const mockSocialHistory =
              buildMockDashboardSocialHistory(mockQuestions);

            beforeEach(() => {
              mockDashboardService.getPatientSocialHistory.mockResolvedValue(
                mockSocialHistory
              );
            });

            test(`should add Social History responses to metadata`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              const passedMetadata = {
                socialHistoryResponses: { HAS_SEEN_PCP_RECENTLY: true },
                clinicalProviderId: mockClinicalProviderId,
              };

              expect(
                mockTasksRepository.getPcpTaskStatusFromMetadata
              ).toHaveBeenCalledWith(passedMetadata);
            });
          });

          describe('Social history responses include HAS_PCP: N, SEEN_PCP_RECENTLY: N', () => {
            const mockQuestions = [
              buildSocialHistoryQuestion({
                key: hasPcpQuestionKey,
                answer: VALID_NO_ANSWER,
              }),
              buildSocialHistoryQuestion({
                key: seenPcpRecentlyQuestionKey,
                answer: VALID_NO_ANSWER,
              }),
            ];
            const mockSocialHistory =
              buildMockDashboardSocialHistory(mockQuestions);

            beforeEach(() => {
              mockDashboardService.getPatientSocialHistory.mockResolvedValue(
                mockSocialHistory
              );
            });

            test(`should add Social History responses to metadata`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              const passedMetadata = {
                socialHistoryResponses: {
                  HAS_PCP: false,
                  HAS_SEEN_PCP_RECENTLY: false,
                },
                clinicalProviderId: mockClinicalProviderId,
              };

              expect(
                mockTasksRepository.getPcpTaskStatusFromMetadata
              ).toHaveBeenCalledWith(passedMetadata);
            });
          });
        });

        test(`should send create communications`, async () => {
          await service.createCompanionLink(mockDashboardApiCareRequest);

          expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
        });

        test(`Returns Link ID`, async () => {
          const result = await service.createCompanionLink(
            mockDashboardApiCareRequest
          );

          expect(result).toStrictEqual(mockCompanionLink.id);
        });

        describe('Status Checks Throw Error', () => {
          describe('ID', () => {
            beforeEach(() => {
              mockDashboardService.getDriversLicenseByPatientId.mockRejectedValueOnce(
                new Error()
              );
            });

            test(`Adds link to database`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              expect(
                mockDatabaseService.companionLink.create
              ).toHaveBeenCalledTimes(1);
            });
          });

          describe('Insurance', () => {
            beforeEach(() => {
              mockDashboardService.getDefaultPharmacyByPatientId.mockRejectedValueOnce(
                new Error()
              );
            });

            test(`Adds link to database`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              expect(
                mockDatabaseService.companionLink.create
              ).toHaveBeenCalledTimes(1);
            });
          });

          describe('Default Pharmacy', () => {
            beforeEach(() => {
              mockDashboardService.getPrimaryCareProviderEhrIdByPatientId.mockRejectedValueOnce(
                new Error()
              );
            });

            test(`Adds link to database`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              expect(
                mockDatabaseService.companionLink.create
              ).toHaveBeenCalledTimes(1);
            });
          });

          describe('PCP', () => {
            beforeEach(() => {
              mockDashboardService.getPatientInsurances.mockRejectedValueOnce(
                new Error()
              );
            });

            test(`Adds link to database`, async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              expect(
                mockDatabaseService.companionLink.create
              ).toHaveBeenCalledTimes(1);
            });
          });
        });

        describe('Running Late SMS', () => {
          describe('companion_running_late_sms flag is on', () => {
            beforeEach(() => {
              mockJobsService.checkRunningLateSmsGate.mockResolvedValueOnce(
                true
              );
            });

            test('adds job to queue', async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              expect(
                mockJobsService.queueRunningLateSmsJob
              ).toHaveBeenCalledTimes(1);
            });
          });

          describe('companion_running_late_sms flag is off', () => {
            beforeEach(() => {
              mockJobsService.checkRunningLateSmsGate.mockResolvedValueOnce(
                false
              );
            });

            test('does not add job to queue', async () => {
              await service.createCompanionLink(mockDashboardApiCareRequest);

              expect(
                mockJobsService.queueRunningLateSmsJob
              ).toHaveBeenCalledTimes(0);
            });
          });
        });
      });
    });

    describe('Link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`Returns Link ID`, async () => {
        const result = await service.createCompanionLink(
          mockDashboardApiCareRequest
        );

        expect(result).toStrictEqual(mockCompanionLink.id);
      });
    });

    describe(`Unsuccessful`, () => {
      test(`Throws error`, async () => {
        mockDatabaseService.companionLink.create.mockRejectedValue(new Error());

        const result = service.createCompanionLink(mockDashboardApiCareRequest);

        await expect(result).rejects.toBeInstanceOf(Error);
      });

      describe(`Prisma throws error`, () => {
        beforeEach(() => {
          const mockError = new PrismaClientKnownRequestError(
            'Other',
            'P-1',
            '1'
          );

          mockDatabaseService.companionLink.create.mockRejectedValue(mockError);
        });

        test(`Throws generic ${Error.name}`, async () => {
          const result = service.createCompanionLink(
            mockDashboardApiCareRequest
          );

          await expect(result).rejects.toBeInstanceOf(Error);
        });
      });
    });
  });

  describe(`${CompanionService.prototype.findLinkByCareRequestId.name}`, () => {
    describe(`Link Exists`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`Returns link`, async () => {
        const result = await service.findLinkByCareRequestId(
          mockCareRequest.id
        );

        expect(result).toStrictEqual(mockCompanionLink);
      });
    });

    describe(`Link Does Not Exist`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns null`, async () => {
        const result = await service.findLinkByCareRequestId(
          mockCareRequest.id
        );

        expect(result).toBeNull();
      });
    });
  });

  describe(`${CompanionService.prototype.findLinkById.name}`, () => {
    describe(`Link Exists`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`Returns link`, async () => {
        const result = await service.findLinkById(mockCompanionLink.id);

        expect(result).toStrictEqual(mockCompanionLink);
      });
    });

    describe(`Link Does Not Exist`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns null`, async () => {
        const result = await service.findLinkById(mockCompanionLink.id);

        expect(result).toBeNull();
      });
    });
  });

  describe(`${CompanionService.prototype.isCompanionLinkAuthBlocked.name}`, () => {
    describe(`Link Auth is blocked by status`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLinkBlocked
        );
      });

      test(`Blocked`, async () => {
        const result = await service.isCompanionLinkAuthBlocked(
          mockCompanionLinkBlocked
        );

        expect(result).toStrictEqual(true);
      });
    });

    describe(`Link Auth is not blocked`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`Not blocked`, async () => {
        const result = await service.isCompanionLinkAuthBlocked(
          mockCompanionLink
        );

        expect(result).toStrictEqual(false);
      });
    });

    describe(`Link Auth is blocked by attempts`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLinkBlockedMaxAuth
        );
      });

      test(`Blocked`, async () => {
        const result = await service.isCompanionLinkAuthBlocked(
          mockCompanionLinkBlockedMaxAuth
        );

        expect(result).toStrictEqual(true);
      });
    });
  });

  describe(`${CompanionService.prototype.updateBlockedStatus.name}`, () => {
    describe(`Link Blocked Status update`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.update.mockResolvedValue(
          mockCompanionLinkBlocked
        );
      });

      test(`Blocking link`, async () => {
        const result = await service.updateBlockedStatus(
          mockCompanionLinkBlocked.id,
          true
        );

        expect(result).toStrictEqual(true);
      });
    });

    describe(`Link Unblock Status update`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.update.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`Unblocking link`, async () => {
        const result = await service.updateBlockedStatus(
          mockCompanionLink.id,
          false
        );

        expect(result).toStrictEqual(true);
      });
    });
  });

  describe(`${CompanionService.prototype.updateInvalidAuthCount.name}`, () => {
    describe(`Link Auth Attempts update`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.update.mockResolvedValue(
          mockCompanionLinkBlockedMaxAuth
        );
      });

      test(`Auth Attempts update`, async () => {
        const result = await service.updateInvalidAuthCount(
          mockCompanionLinkBlockedMaxAuth.id,
          25
        );

        expect(result).toStrictEqual(true);
      });
    });
  });

  describe(`${CompanionService.prototype.getCompanionInfoByCareRequestLink.name}`, () => {
    const filteredState: CurrentStateDto = {
      id: faker.datatype.number(),
      name: CareRequestStatusText.Archived,
      startedAt: '2021-07-14T15:19:12.797Z',
      createdAt: '2021-07-14T15:19:12.797Z',
      updatedAt: '2021-07-14T15:19:12.797Z',
      statusIndex: 1,
    };

    const mockCareRequest: CareRequestDto = buildMockCareRequest({
      currentState: [
        {
          id: faker.datatype.number(),
          name: CareRequestStatusText.OnRoute,
          startedAt: '2021-07-14T15:19:12.797Z',
          createdAt: '2021-07-14T15:19:12.797Z',
          updatedAt: '2021-07-14T15:19:12.797Z',
          statusIndex: 1,
        },
        filteredState,
      ],
    });

    const tasks = undefined;
    const isLV1 = true;
    const mockCompanionInfo = buildMockCompanionInfoFromCareRequest(
      mockCareRequest,
      tasks,
      isLV1
    );

    describe(`Care Request Exists`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockStatsigService.getConfig.mockResolvedValue(
          buildMockDynamicConfig([mockCareRequest.market.shortName])
        );
      });

      test(`Retrieves care request from Dashboard`, async () => {
        await service.getCompanionInfoByCareRequestLink(mockCompanionLink);

        expect(mockDashboardService.getCareRequestById).toHaveBeenCalledTimes(
          1
        );
        expect(mockDashboardService.getCareRequestById).toHaveBeenCalledWith(
          mockCompanionLink.careRequestId
        );
      });

      test(`Returns companion info`, async () => {
        const result = await service.getCompanionInfoByCareRequestLink(
          mockCompanionLink
        );

        expect(Object.keys(result)).toStrictEqual(
          Object.keys(mockCompanionInfo)
        );
        expect(result.careRequestId).toStrictEqual(
          mockCompanionInfo.careRequestId
        );
        expect(result.patientLastName).toStrictEqual(
          mockCompanionInfo.patientLastName
        );
        expect(result.currentStates).toStrictEqual(
          mockCompanionInfo.currentStates
        );
        expect(result.providers).toStrictEqual(mockCompanionInfo.providers);
        expect(result.activeStatus).toStrictEqual(
          mockCompanionInfo.activeStatus
        );
        expect(result.etaRanges).toStrictEqual(mockCompanionInfo.etaRanges);
        expect(result.location).toStrictEqual(mockCompanionInfo.location);
        expect(result.isLV1).toStrictEqual(mockCompanionInfo.isLV1);
      });

      test(`Filters out unnecessary states`, async () => {
        const result = await service.getCompanionInfoByCareRequestLink(
          mockCompanionLink
        );

        expect(result.currentStates).not.toContain(filteredState);
      });
    });

    describe(`Care Request Does Not Exist`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
      });

      test(`Throws error`, async () => {
        const result =
          service.getCompanionInfoByCareRequestLink(mockCompanionLink);

        await expect(result).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${CompanionService.prototype.getAnalyticsInfo.name}`, () => {
    describe(`Link exists`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      describe('Care request exists', () => {
        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
        });

        test(`should return correct data`, async () => {
          const result = await service.getAnalyticsInfo(mockCompanionLink);

          expect(mockDashboardService.getCareRequestById).toHaveBeenCalledTimes(
            1
          );
          expect(mockDashboardService.getCareRequestById).toHaveBeenCalledWith(
            mockCompanionLink.careRequestId
          );
          expect(result).toStrictEqual(mockAnalyticsInfo);
        });
      });

      describe('Care request does not exist', () => {
        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(null);
        });

        test(`should throw error`, async () => {
          await expect(
            service.getAnalyticsInfo(mockCompanionLink)
          ).rejects.toBeInstanceOf(NotFoundException);
        });
      });
    });

    describe(`Link does not exist`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`should throw error`, async () => {
        await expect(
          service.getAnalyticsInfo(mockCompanionLink)
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });

  describe(`${CompanionService.prototype.sendCompanionLinkCreatedNotification.name}`, () => {
    const mockCareRequest: CareRequestDto = buildMockCareRequest();

    describe('createdNotificationSent is false', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      describe(`Care request has appointment slot`, () => {
        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
        });

        test(`Retrieves care request from Dashboard`, async () => {
          await service.sendCompanionLinkCreatedNotification(
            mockCareRequest.id,
            mockCompanionLink.id
          );

          expect(mockDashboardService.getCareRequestById).toHaveBeenCalledTimes(
            1
          );
          expect(mockDashboardService.getCareRequestById).toHaveBeenCalledWith(
            mockCareRequest.id
          );
        });

        test(`should send SMS`, async () => {
          await service.sendCompanionLinkCreatedNotification(
            mockCareRequest.id,
            mockCompanionLink.id
          );
          expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
          expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
              status: expect.any(String),
              url: expect.any(String),
              date: expect.any(String),
            })
          );
          expect(
            mockDatabaseService.companionLink.update
          ).toHaveBeenCalledTimes(1);
          expect(mockDatabaseService.companionLink.update).toHaveBeenCalledWith(
            {
              where: { id: mockCompanionLink.id },
              data: { createdNotificationSent: true },
            }
          );
        });
      });

      describe(`Care request does not have appointment slot`, () => {
        describe(`Care Request has assignment date`, () => {
          const mockCareRequestWithAssignmentDate = buildMockCareRequest({
            appointmentSlot: undefined,
            assignmentDate: new Date().toISOString(),
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequestWithAssignmentDate
            );
          });

          test(`should send SMS with default body`, async () => {
            await service.sendCompanionLinkCreatedNotification(
              mockCareRequestWithAssignmentDate.id,
              mockCompanionLink.id
            );
            expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                status: expect.any(String),
                url: expect.any(String),
                date: format(
                  new Date(
                    mockCareRequestWithAssignmentDate.assignmentDate ?? 0
                  ),
                  'iiii, MMMM d'
                ),
              })
            );
          });
        });

        describe(`Care Request has no assignment date`, () => {
          const mockCareRequestNoAppointment = buildMockCareRequest({
            appointmentSlot: undefined,
            assignmentDate: undefined,
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequestNoAppointment
            );
          });

          test(`Retrieves care request from Dashboard`, async () => {
            await service.sendCompanionLinkCreatedNotification(
              mockCareRequestNoAppointment.id,
              mockCompanionLink.id
            );

            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledWith(mockCareRequestNoAppointment.id);
          });

          test(`Send SMS with default body`, async () => {
            await service.sendCompanionLinkCreatedNotification(
              mockCareRequestNoAppointment.id,
              mockCompanionLink.id
            );
            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
            expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                status: expect.any(String),
                url: expect.any(String),
              })
            );
          });
        });
      });

      describe(`Care request does not exist`, () => {
        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(null);
        });

        test(`Throws error`, async () => {
          await expect(
            service.sendCompanionLinkCreatedNotification(
              mockCareRequest.id,
              mockCompanionLink.id
            )
          ).rejects.toBeInstanceOf(NotFoundException);
        });
      });
    });

    describe('createdNotificationSent is true', () => {
      const mockCompanionLinkCreatedNotificationSent =
        buildMockCompanionLinkWithTasks({
          ...mockCompanionLink,
          createdNotificationSent: true,
        });

      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLinkCreatedNotificationSent
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test(`should not send SMS`, async () => {
        await service.sendCompanionLinkCreatedNotification(
          mockCareRequest.id,
          mockCompanionLinkCreatedNotificationSent.id
        );

        expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe(`${CompanionService.prototype.onCareRequestOnScene.name}`, () => {
    const mockCareRequest: CareRequestDto = buildMockCareRequest();

    describe(`Log metrics successful`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`should log metrics`, async () => {
        jest.spyOn(service, 'logTaskCompletionMetrics');
        await service.onCareRequestOnScene(mockCareRequest.id);

        expect(service.logTaskCompletionMetrics).toHaveBeenCalledWith(
          mockCareRequest.id
        );
      });
    });

    describe(`Error while logging metrics`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`should not throw error`, async () => {
        jest
          .spyOn(service, 'logTaskCompletionMetrics')
          .mockRejectedValueOnce(new Error());

        await expect(
          service.onCareRequestOnScene(mockCareRequest.id)
        ).resolves.toBeUndefined();
      });
    });
  });

  describe(`${CompanionService.prototype.onCareRequestOnRoute.name}`, () => {
    const mockCareRequest: CareRequestDto = buildMockCareRequest();

    describe(`Successful`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`should call Twilio Flow`, async () => {
        await service.onCareRequestOnRoute(mockCareRequest.id);

        expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
      });

      test(`should create note for care request`, async () => {
        await service.onCareRequestOnRoute(mockCareRequest.id);

        expect(
          mockTasksRepository.upsertCompanionNoteMetadata
        ).toHaveBeenCalledWith(mockCompanionLink.id, mockCareRequest);
      });
    });

    describe(`Unsuccessful`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`should throw error if send notification fails`, async () => {
        mockSmsService.executeFlow.mockRejectedValue(new Error());

        await expect(
          service.onCareRequestOnRoute(mockCareRequest.id)
        ).rejects.toThrowError();
      });

      test(`should throw error if create note fails`, async () => {
        mockTasksRepository.upsertCompanionNoteMetadata.mockRejectedValue(
          new Error()
        );
        await expect(
          service.onCareRequestOnRoute(mockCareRequest.id)
        ).rejects.toThrowError();

        expect(
          mockTasksRepository.upsertCompanionNoteMetadata
        ).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe(`${CompanionService.prototype.sendCareTeamOnRouteNotification.name}`, () => {
    const mockCareRequest: CareRequestDto = buildMockCareRequest();
    const completedStatus = [
      buildMockCompanionTaskStatus({ name: CompanionTaskStatusName.COMPLETED }),
    ];
    const notStartedStatus = [
      buildMockCompanionTaskStatus({
        name: CompanionTaskStatusName.NOT_STARTED,
      }),
    ];

    describe('onRouteNotificationSent is false', () => {
      beforeEach(() => {
        mockReminderTextExperiment(true);
      });

      describe(`when companion_experience_consents_module experiment is disabled`, () => {
        beforeEach(() => {
          mockConsentsModuleExperiment(false);
        });

        describe(`when all tasks are completed`, () => {
          const mockCompanionLink = buildMockCompanionLinkWithTasks({
            careRequestId: mockDashboardApiCareRequest.external_id,
            tasks: [
              buildMockCompanionIdentificationTask({
                statuses: completedStatus,
              }),
              buildMockCompanionInsuranceTask({ statuses: completedStatus }),
              buildMockCompanionDefaultPharmacyTask({
                statuses: completedStatus,
              }),
              buildMockPrimaryCareProviderTask({ statuses: completedStatus }),
              buildMockCompanionMedicationConsentTask({
                statuses: completedStatus,
              }),
              buildMockCompanionConsentsTask({ statuses: completedStatus }),
            ],
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockCompanionLink
            );
          });

          test(`should return an empty string`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
            expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                status: CareRequestStatusText.OnRoute,
                url: expect.any(String),
                pendingTaskText: '',
              })
            );
          });
        });

        describe(`when one task is incomplete`, () => {
          const mockCompanionLink = buildMockCompanionLinkWithTasks({
            careRequestId: mockDashboardApiCareRequest.external_id,
            tasks: [
              buildMockCompanionIdentificationTask({
                statuses: completedStatus,
              }),
              buildMockCompanionInsuranceTask({ statuses: completedStatus }),
              buildMockCompanionDefaultPharmacyTask({
                statuses: completedStatus,
              }),
              buildMockPrimaryCareProviderTask({ statuses: completedStatus }),
              buildMockCompanionMedicationConsentTask({
                statuses: notStartedStatus,
              }),
              buildMockCompanionConsentsTask({ statuses: completedStatus }),
            ],
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockCompanionLink
            );
          });

          test(`should acknowledge the incomplete task`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);
            const pendingTaskText = 'medications';

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
            expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                status: CareRequestStatusText.OnRoute,
                url: expect.any(String),
                pendingTaskText,
              })
            );
          });
        });

        describe(`when two tasks are incomplete`, () => {
          const mockCompanionLink = buildMockCompanionLinkWithTasks({
            careRequestId: mockDashboardApiCareRequest.external_id,
            tasks: [
              buildMockCompanionIdentificationTask({
                statuses: completedStatus,
              }),
              buildMockCompanionInsuranceTask({ statuses: completedStatus }),
              buildMockCompanionDefaultPharmacyTask({
                statuses: completedStatus,
              }),
              buildMockPrimaryCareProviderTask({ statuses: notStartedStatus }),
              buildMockCompanionMedicationConsentTask({
                statuses: notStartedStatus,
              }),
              buildMockCompanionConsentsTask({ statuses: completedStatus }),
            ],
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockCompanionLink
            );
          });

          test(`should acknowledge the incomplete task`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);
            const pendingTaskText = 'primary care provider and medications';

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
            expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                status: CareRequestStatusText.OnRoute,
                url: expect.any(String),
                pendingTaskText,
              })
            );
          });
        });

        describe(`when more than two tasks are incomplete`, () => {
          const mockCompanionLink = buildMockCompanionLinkWithTasks({
            careRequestId: mockDashboardApiCareRequest.external_id,
            tasks: [
              buildMockCompanionIdentificationTask({
                statuses: completedStatus,
              }),
              buildMockCompanionInsuranceTask({ statuses: completedStatus }),
              buildMockCompanionDefaultPharmacyTask({
                statuses: notStartedStatus,
              }),
              buildMockPrimaryCareProviderTask({ statuses: notStartedStatus }),
              buildMockCompanionMedicationConsentTask({
                statuses: notStartedStatus,
              }),
              buildMockCompanionConsentsTask({ statuses: notStartedStatus }),
            ],
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockCompanionLink
            );
          });

          test(`should acknowledge that more than two tasks are incomplete`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);
            const pendingTaskText = 'required information';

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
            expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                status: CareRequestStatusText.OnRoute,
                url: expect.any(String),
                pendingTaskText: pendingTaskText,
              })
            );
          });
        });

        describe(`When voicemailConsent is true`, () => {
          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockCompanionLink
            );
          });

          test(`should retrieve a care request from Dashboard`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledWith(mockCareRequest.id);
          });

          test(`should execute a Twilio Flow Notification`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
            expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
              expect.any(String),
              expect.any(String),
              expect.objectContaining({
                status: CareRequestStatusText.OnRoute,
                url: expect.any(String),
                pendingTaskText: expect.any(String),
              })
            );
          });
        });

        describe(`When voicemailConsent is false`, () => {
          const mockCareRequest: CareRequestDto = buildMockCareRequest({
            patient: buildMockDashboardPatient(true, {
              voicemail_consent: false,
            }).toPatientDto(),
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockCompanionLink
            );
            mockReminderTextExperiment(true);
          });

          test(`should Retrieve the care request from Dashboard`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledWith(mockCareRequest.id);
          });

          test(`should not Execute Twilio Flow Notification`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(0);
          });
        });

        describe(`When patient is undefined`, () => {
          const mockCareRequest: CareRequestDto = buildMockCareRequest({
            patient: buildMockDashboardPatient(true, {
              voicemail_consent: false,
            }).toPatientDto(),
          });

          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockCompanionLink
            );
            mockReminderTextExperiment(true);
          });

          test(`should Retrieve the care request from Dashboard`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledTimes(1);
            expect(
              mockDashboardService.getCareRequestById
            ).toHaveBeenCalledWith(mockCareRequest.id);
          });

          test(`should not Execute Twilio Flow Notification`, async () => {
            await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(0);
          });
        });

        describe(`Care request does not exist`, () => {
          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(null);
          });

          test(`should throw an error`, async () => {
            await expect(
              service.sendCareTeamOnRouteNotification(mockCareRequest.id)
            ).rejects.toBeInstanceOf(NotFoundException);
          });
        });

        describe(`Link does not exist`, () => {
          beforeEach(() => {
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              null
            );
          });

          test(`should throw an error`, async () => {
            await expect(
              service.sendCareTeamOnRouteNotification(mockCareRequest.id)
            ).rejects.toBeInstanceOf(NotFoundException);
          });
        });
      });

      describe(`when companion_experience_consents_module experiment is enabled`, () => {
        beforeEach(() => {
          mockConsentsModuleExperiment(true);
        });

        const mockCompanionLink = buildMockCompanionLinkWithTasks({
          careRequestId: mockDashboardApiCareRequest.external_id,
          tasks: [
            buildMockCompanionIdentificationTask({ statuses: completedStatus }),
            buildMockCompanionInsuranceTask({ statuses: completedStatus }),
            buildMockCompanionDefaultPharmacyTask({
              statuses: completedStatus,
            }),
            buildMockPrimaryCareProviderTask({ statuses: completedStatus }),
            buildMockCompanionMedicationConsentTask({
              statuses: notStartedStatus,
            }),
            buildMockCompanionConsentsTask({ statuses: completedStatus }),
          ],
        });

        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
          mockDatabaseService.companionLink.findUnique.mockResolvedValue(
            mockCompanionLink
          );
        });

        test(`should not include medication consent task text`, async () => {
          await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

          expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(1);
          expect(mockSmsService.executeFlow).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
              status: CareRequestStatusText.OnRoute,
              url: expect.any(String),
              pendingTaskText: '',
            })
          );
        });
      });
    });

    describe('onRouteNotificationSent is true', () => {
      const mockCompanionLinkOnRouteNotificationSent =
        buildMockCompanionLinkWithTasks({
          ...mockCompanionLink,
          onRouteNotificationSent: true,
        });

      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLinkOnRouteNotificationSent
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test(`should not send SMS`, async () => {
        await service.sendCareTeamOnRouteNotification(mockCareRequest.id);

        expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(0);
      });
    });

    describe('Running Late SMS', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test('completes running late job', async () => {
        await service.sendCareTeamOnRouteNotification(mockCareRequest.id);
        expect(mockJobsService.removeRunningLateSmsJob).toBeCalledTimes(1);
      });
    });
  });

  describe(`${CompanionService.prototype.markIdentificationUploaded.name}`, () => {
    describe(`Task exists`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([
          mockIdentificationImageTask,
        ]);
      });

      test(`Pulls task from ${TasksRepository.name}`, async () => {
        await service.markIdentificationUploaded(mockCompanionLink.id);

        expect(mockTasksRepository.findTasks).toHaveBeenCalledTimes(1);
      });
    });

    describe(`Task does not exist`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([]);
      });

      test(`Does not create task status`, async () => {
        await service.markIdentificationUploaded(mockCompanionLink.id);

        expect(mockDatabaseService.companionTaskStatus.create).toBeCalledTimes(
          0
        );
      });
    });
  });

  describe(`${CompanionService.prototype.onInsuranceImageUploaded.name}`, () => {
    describe(`Task exists`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([
          mockInsuranceImageTask,
        ]);
      });

      test(`Updates task metadata`, async () => {
        await service.onInsuranceImageUploaded(mockCompanionLink.id, '1');

        expect(mockDatabaseService.companionTask.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              metadata: expect.any(Object),
            },
          })
        );
      });
    });

    describe(`Task does not exist`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([]);
      });

      test(`Does not create task status`, async () => {
        await service.onInsuranceImageUploaded(mockCompanionLink.id, '1');

        expect(mockDatabaseService.companionTaskStatus.create).toBeCalledTimes(
          0
        );
      });
    });
  });

  describe(`${CompanionService.prototype.markPharmacySet.name}`, () => {
    describe(`Task exists`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([mockPharmacyTask]);
      });

      test(`should update task status`, async () => {
        const response = await service.markPharmacySet(mockCompanionLink.id);

        expect(mockTasksRepository.findTasks).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledWith(
          expect.any(Object),
          CompanionTaskStatusName.COMPLETED
        );
        expect(response).toBeUndefined();
      });
    });

    describe(`Task does not exist`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([]);
      });

      test(`should not create task status`, async () => {
        const response = await service.markPharmacySet(mockCompanionLink.id);

        expect(mockTasksRepository.findTasks).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledTimes(0);
        expect(response).toBeUndefined();
      });
    });
  });

  describe(`${CompanionService.prototype.markPrimaryCareProviderSet.name}`, () => {
    const mockClinicalProviderId = faker.datatype.number().toString();

    describe(`Task exists`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockTasksRepository.getPcpTaskStatusFromMetadata.mockResolvedValue(
          CompanionTaskStatusName.COMPLETED
        );
      });

      describe('Task V1', () => {
        beforeEach(() => {
          mockTasksRepository.findTask.mockResolvedValue(mockPcpTaskV1);
        });

        test(`should update task status`, async () => {
          const response = await service.markPrimaryCareProviderSet(
            mockCompanionLink,
            mockClinicalProviderId
          );

          expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledWith(
            expect.any(Object),
            CompanionTaskStatusName.COMPLETED
          );
          expect(response).toBeUndefined();
        });
      });

      describe('Task V2', () => {
        beforeEach(() => {
          mockTasksRepository.findTask.mockResolvedValue(mockPcpTask);
        });

        test(`should update task status`, async () => {
          const response = await service.markPrimaryCareProviderSet(
            mockCompanionLink,
            mockClinicalProviderId
          );

          expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledWith(
            expect.any(Object),
            CompanionTaskStatusName.COMPLETED
          );
          expect(response).toBeUndefined();
        });
      });
    });

    describe(`Task does not exist`, () => {
      beforeEach(() => {
        mockTasksRepository.findTask.mockResolvedValue(undefined);
      });

      test(`should not create task status`, async () => {
        const response = await service.markPrimaryCareProviderSet(
          mockCompanionLink,
          mockClinicalProviderId
        );

        expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledTimes(0);
        expect(response).toBeUndefined();
      });
    });
  });

  describe(`${CompanionService.prototype.markMedicationHistoryConsentApplied.name}`, () => {
    describe(`Task exists`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([
          mockMedicationConsentTask,
        ]);
      });

      test(`should update task status`, async () => {
        const response = await service.markMedicationHistoryConsentApplied(
          mockCompanionLink.id
        );

        expect(mockTasksRepository.findTasks).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledWith(
          expect.any(Object),
          CompanionTaskStatusName.COMPLETED
        );
        expect(response).toBeUndefined();
      });
    });

    describe(`Task does not exist`, () => {
      beforeEach(() => {
        mockTasksRepository.findTasks.mockResolvedValue([]);
      });

      test(`should not create task status`, async () => {
        const response = await service.markMedicationHistoryConsentApplied(
          mockCompanionLink.id
        );

        expect(mockTasksRepository.findTasks).toHaveBeenCalledTimes(1);
        expect(mockTasksRepository.updateTaskStatus).toHaveBeenCalledTimes(0);
        expect(response).toBeUndefined();
      });
    });
  });

  describe(`${CompanionService.prototype.createNoteForCareRequest.name}`, () => {
    const mockCareRequestId = faker.datatype.number();

    describe(`Link exists`, () => {
      const completedStatus = [
        buildMockCompanionTaskStatus({
          name: CompanionTaskStatusName.COMPLETED,
        }),
      ];

      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      describe('Create note', () => {
        beforeEach(() => {
          mockTasksRepository.findTasks.mockResolvedValue([
            buildMockPrimaryCareProviderTask({
              companionLinkId: mockCompanionLink.id,
              statuses: completedStatus,
            }),
          ]);
          mockDatabaseService.companionLink.findUnique.mockResolvedValue(
            mockCompanionLink
          );
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
          mockTasksRepository.upsertCompanionNoteMetadata.mockResolvedValue(
            undefined
          );
        });

        test(`should call upsertCompanionNoteMetadata`, async () => {
          const response = await service.createNoteForCareRequest(
            mockCareRequestId
          );

          expect(
            mockTasksRepository.upsertCompanionNoteMetadata
          ).toHaveBeenCalledWith(mockCompanionLink.id, mockCareRequest);
          expect(response).toBeUndefined();
        });

        describe('error occurs during upsert', () => {
          const mockErrorMessage = 'mock error message';

          beforeEach(() => {
            mockTasksRepository.upsertCompanionNoteMetadata.mockRejectedValue(
              new Error(mockErrorMessage)
            );
          });

          test(`should bubble up error from upsertCompanionNoteMetadata`, async () => {
            await expect(
              service.createNoteForCareRequest(mockCareRequestId)
            ).rejects.toThrowError(mockErrorMessage);
          });
        });

        test(`should bubble up error from upsertCompanionNoteMetadata`, async () => {
          mockTasksRepository.upsertCompanionNoteMetadata.mockRejectedValue(
            new Error()
          );
          await expect(
            service.createNoteForCareRequest(mockCareRequestId)
          ).rejects.toThrowError();

          expect(
            mockTasksRepository.upsertCompanionNoteMetadata
          ).toHaveBeenCalledWith(mockCompanionLink.id, mockCareRequest);
        });
      });
    });

    describe(`Link does not exists`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test('should return nil value', async () => {
        const response = await service.createNoteForCareRequest(
          mockCareRequestId
        );

        expect(
          mockDashboardService.createNoteForCareRequest
        ).toHaveBeenCalledTimes(0);
        expect(response).toBeUndefined();
      });
    });

    describe(`Care request does not exists`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
      });

      test(`should throw error`, async () => {
        await expect(
          service.createNoteForCareRequest(mockCareRequestId)
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });

  describe(`${CompanionService.prototype.logTaskCompletionMetrics.name}`, () => {
    describe(`Care Request and Link exist`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      [true, false].forEach((v) => {
        describe(`companion_experience_consents_module.enable is ${v}`, () => {
          beforeEach(() => {
            mockConsentsModuleExperiment(v);
          });

          test(`should log task completion metrics to statsig`, async () => {
            await service.logTaskCompletionMetrics(mockCareRequest.id);

            const completionPercentage = 0;
            const metadata = {
              careRequestId: mockCareRequest.statsigCareRequestId,
              totalTaskCount: '5',
              totalCompletedStatuses: '0',
              acceptedToOnRouteSeconds: '0',
              acceptedToOnSceneSeconds: '0',
            };

            const statsigUser = {
              userID: mockCompanionLink.id,
              customIDs: {
                careRequestID: mockCareRequest.statsigCareRequestId,
              },
            };

            expect(mockStatsigService.logEvent).toHaveBeenCalledTimes(1);
            expect(mockStatsigService.logEvent).toHaveBeenCalledWith(
              statsigUser,
              'task_completion_percentage_on_arrival',
              completionPercentage,
              metadata
            );
          });

          describe(`The task count is 0`, () => {
            beforeEach(() => {
              mockDashboardService.getCareRequestById.mockResolvedValue(
                mockCareRequest
              );
              mockDatabaseService.companionLink.findUnique.mockResolvedValue(
                mockCompanionLinkWithNoTasks
              );
            });

            test(`should log 'metrics unavailable' to statsig`, async () => {
              await service.logTaskCompletionMetrics(mockCareRequest.id);

              const statsigUser = {
                userID: mockCompanionLinkWithNoTasks.id,
                customIDs: {
                  careRequestID: mockCareRequest.statsigCareRequestId,
                },
              };

              expect(mockStatsigService.logEvent).toHaveBeenCalledTimes(1);
              expect(mockStatsigService.logEvent).toHaveBeenCalledWith(
                statsigUser,
                'task_completion_percentage_on_arrival',
                'metrics unavailable'
              );
            });
          });
        });
      });
    });

    describe(`Companion Link does not exist`, () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`should thow exception`, async () => {
        const error = service.logTaskCompletionMetrics(mockCareRequest.id);

        await expect(error).rejects.toThrow(
          new NotFoundException(
            'Companion link associated with care request ID not found'
          )
        );
      });
    });
  });

  describe(`${CompanionService.prototype.getCareTeamEta.name}`, () => {
    const mockCareTeamEta = buildMockCareTeamEta();

    beforeEach(() => {
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDashboardService.getCareTeamEta.mockResolvedValue(mockCareTeamEta);
    });

    test(`should return care team ETA`, async () => {
      const returnedEta = await service.getCareTeamEta(mockCompanionLink);

      expect(mockDashboardService.getCareTeamEta).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getCareTeamEta).toHaveBeenCalledWith(
        mockCompanionLink.careRequestId
      );

      expect(mockCareTeamEta).toBe(returnedEta);
    });
  });

  describe(`${CompanionService.prototype.handleEtaRangeEvent.name}`, () => {
    describe('if link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      [
        CareRequestStatusText.Accepted,
        CareRequestStatusText.Committed,
        CareRequestStatusText.Scheduled,
        CareRequestStatusText.Requested,
      ].forEach((status: string) => {
        test(`${status} is updated`, async () => {
          const careRequestData = {
            care_request_id: mockCareRequest.id,
            request_status: status,
            eta_range: buildMockDashboardEtaRange({
              care_request_id: mockCareRequest.id,
            }),
          };

          await service.handleEtaRangeEvent(careRequestData);
          expect(mockJobsService.updateRunningLateSmsJob).toBeCalledTimes(1);
        });
      });

      [CareRequestStatusText.Complete, 'unlisted status'].forEach(
        (status: string) => {
          test(`${status} is completed`, async () => {
            const careRequestData = {
              care_request_id: mockCareRequest.id,
              request_status: status,
              eta_range: buildMockDashboardEtaRange({
                care_request_id: mockCareRequest.id,
              }),
            };

            await service.handleEtaRangeEvent(careRequestData);
            expect(mockJobsService.removeRunningLateSmsJob).toBeCalledTimes(1);
          });
        }
      );
    });
  });
});

describe(`${SmsService.name} - Missing COMPANION_URL`, () => {
  test('Throws error', async () => {
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'COMPANION_URL') {
        return undefined;
      }

      return process.env[key];
    });

    const moduleRef = Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService);

    await expect(moduleRef.compile()).rejects.toBeInstanceOf(
      MissingEnvironmentVariableException
    );
    await expect(moduleRef.compile()).rejects.toThrow(
      `Missing required environment variable: COMPANION_URL`
    );
  });
});

describe(`${CompanionService.name} - Missing TWILIO_COMPANION_FLOW_SID`, () => {
  test('Throws error', async () => {
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'TWILIO_COMPANION_FLOW_SID') {
        return undefined;
      }

      return process.env[key];
    });

    const moduleRef = Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService);

    await expect(moduleRef.compile()).rejects.toBeInstanceOf(
      MissingEnvironmentVariableException
    );
    await expect(moduleRef.compile()).rejects.toThrow(
      `Missing required environment variable: TWILIO_COMPANION_FLOW_SID`
    );
  });
});
