import {
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import * as faker from 'faker';
import {
  DashboardWebhookDtoV1 as DashboardWebhookDto,
  DashboardWebhookDtoV1,
} from '../dto/dashboard-webhook-v1.dto';
import { CompanionModule } from '../companion.module';
import { CompanionController } from '../companion.controller';
import { TasksRepository } from '../../tasks/tasks.repository';
import { mockTasksRepository } from '../../tasks/mocks/tasks.repository.mock';
import {
  buildMockCompanionTaskStatus,
  buildMockCompanionIdentificationTask,
} from '../../tasks/mocks/companion-task.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import {
  buildMockCareRequest,
  buildMockDashboardWebhookCareRequest,
} from '../../care-request/mocks/care-request.repository.mock';
import {
  buildMockCompanionLink,
  buildMockCompanionLinkWithTasks,
} from '../mocks/companion-link.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { toggleLogging } from '../../../testUtils/utilities';
import { CompanionAuthGuard } from '../companion-auth.guard';
import { mockCompanionAuthGuard } from '../mocks/companion-auth.guard.mock';
import { SmsService } from '../../communications/sms.service';
import { mockSmsService } from '../../communications/mocks/sms.service.mock';
import { buildMockCompanionInfoFromCareRequest } from '../mocks/companion-info.mock';
import { sub } from 'date-fns';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { CommonModule } from '../../common/common.module';
import { buildMockDashboardInsurance } from '../../dashboard/mocks/dashboard-insurance.mock';
import { CompanionLinkAnalytics } from '../dto/companion-link-analytics.dto';
import {
  mockStatsigService,
  mockReminderTextExperiment,
  mockWebRequestSmsConfig,
  buildMockDynamicConfig,
} from '../../statsig/mocks/statsig.service.mock';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { CompanionTaskStatusName } from '@prisma/client';
import { buildMockCareTeamEta } from '../../dashboard/mocks/care-team-eta.mock';
import { CareTeamEtaDto } from '../dto/care-team-eta-dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DashboardWebhookDtoV2 } from '../dto/dashboard-webhook-v2.dto';
import { CompanionTaskStatusDto } from '../dto/companion-task-status.dto';
import { CompanionInfoDto } from '../dto/companion-info.dto';
import { mockJobsService } from '../../jobs/mocks/jobs.service.mock';
import { JobsService } from '../../jobs/jobs.service';

describe(`${CompanionModule.name} API Tests`, () => {
  let app: INestApplication;
  const basePath = `/companion`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SmsService)
      .useValue(mockSmsService)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .overrideProvider(TasksRepository)
      .useValue(mockTasksRepository)
      .overrideProvider(JobsService)
      .useValue(mockJobsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockStatsigService.getConfig.mockResolvedValue(buildMockDynamicConfig([]));
  });

  const mockDashboardApiCareRequest = buildMockDashboardWebhookCareRequest();

  const mockDashboardWebhookDto: DashboardWebhookDto = {
    care_request: JSON.stringify(mockDashboardApiCareRequest),
  };

  const mockCompanionLink = buildMockCompanionLink({
    careRequestId: mockDashboardApiCareRequest.external_id,
  });

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const oneYearAgo = sub(new Date(), {
    years: 1,
  });

  const mockOldCompanionLink = buildMockCompanionLink({
    careRequestId: mockDashboardApiCareRequest.external_id,
    created: oneYearAgo,
  });

  const mockOldCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockOldCompanionLink.careRequestId,
    currentState: [
      {
        name: CareRequestStatusText.Complete,
        id: faker.datatype.number(),
        createdAt: oneYearAgo.toISOString(),
        startedAt: oneYearAgo.toISOString(),
        updatedAt: oneYearAgo.toISOString(),
        statusIndex: 5,
      },
    ],
  });

  const mockCompanionInfo =
    buildMockCompanionInfoFromCareRequest(mockCareRequest);
  const mockDashboardInsurance = buildMockDashboardInsurance();

  const mockDashboardApiCareRequestRequested =
    buildMockDashboardWebhookCareRequest({
      request_status: CareRequestStatusText.Requested,
    });

  const mockDashboardApiCareRequestOnScene =
    buildMockDashboardWebhookCareRequest({
      request_status: CareRequestStatusText.OnScene,
    });

  const mockDashboardApiCareRequestOnRoute =
    buildMockDashboardWebhookCareRequest({
      request_status: CareRequestStatusText.OnRoute,
    });

  const mockDashboardApiCareRequestInvalidStatus =
    buildMockDashboardWebhookCareRequest({
      request_status: 'FAKE' as CareRequestStatusText,
    });

  const mockDashboardWebhookDtoRequested: DashboardWebhookDto = {
    care_request: JSON.stringify(mockDashboardApiCareRequestRequested),
  };

  const mockDashboardWebhookDtoOnScene: DashboardWebhookDto = {
    care_request: JSON.stringify(mockDashboardApiCareRequestOnScene),
  };

  const mockDashboardWebhookDtoOnRoute: DashboardWebhookDto = {
    care_request: JSON.stringify(mockDashboardApiCareRequestOnRoute),
  };

  const mockAnalyticsInfo: CompanionLinkAnalytics = {
    statsigCareRequestId: mockCareRequest.statsigCareRequestId,
  };

  const mockDashboardWebhookDtoInvalidStatus: DashboardWebhookDto = {
    care_request: JSON.stringify(mockDashboardApiCareRequestInvalidStatus),
  };

  describe(`${CompanionController.prototype.handleDashboardWebhook.name}`, () => {
    const buildPath = (): string => `${basePath}/webhook`;

    beforeEach(() => {
      mockWebRequestSmsConfig();
      mockDatabaseService.companionLink.create.mockResolvedValue(
        mockCompanionLink
      );
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDashboardService.getPatientInsurances.mockResolvedValue([
        mockDashboardInsurance,
      ]);
    });

    describe(`Companion Experience Link Creation`, () => {
      test(`should return ${HttpStatus.OK}`, () => {
        return request(app.getHttpServer())
          .post(buildPath())
          .send(mockDashboardWebhookDto)
          .expect(HttpStatus.OK);
      });

      // verify missing required properties throw 400
      // create DTO with only required properties
      const dtoRequiredProperties: DashboardWebhookDto = {
        care_request: mockDashboardWebhookDto.care_request,
      };

      Object.keys(dtoRequiredProperties).forEach((key) => {
        // duplicate
        const partial = {
          ...dtoRequiredProperties,
        };

        // delete key
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete partial[key as keyof typeof partial];

        // test
        test(`Returns ${HttpStatus.BAD_REQUEST} for missing ${key}`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .send(partial)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      test(`should return ${HttpStatus.BAD_REQUEST} for empty body`, () => {
        return request(app.getHttpServer())
          .post(buildPath())
          .send()
          .expect(HttpStatus.BAD_REQUEST);
      });

      test(`should return ${HttpStatus.BAD_REQUEST} for invalid CR status`, () => {
        return request(app.getHttpServer())
          .post(buildPath())
          .send(mockDashboardWebhookDtoInvalidStatus)
          .expect(HttpStatus.BAD_REQUEST);
      });

      test(`should return ${HttpStatus.BAD_REQUEST} for invalid care request ID`, () => {
        return request(app.getHttpServer())
          .post(buildPath())
          .send({
            ...mockDashboardWebhookDto,
            care_request: 12345 as unknown,
          } as DashboardWebhookDto)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe(`SMS Notifications`, () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      describe(`Successfully created Notification`, () => {
        test(`should return ${HttpStatus.OK}`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .send(mockDashboardWebhookDtoOnScene)
            .expect(HttpStatus.OK);
        });
      });
    });

    describe(`Requested Notifications`, () => {
      describe(`Successfully created Notification`, () => {
        test(`should return ${HttpStatus.OK}`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .send(mockDashboardWebhookDtoRequested)
            .expect(HttpStatus.OK);
        });
      });
    });

    describe(`On Route Notifications`, () => {
      describe(`Successfully created Notification`, () => {
        const mockCompanionLink = buildMockCompanionLinkWithTasks({
          careRequestId: mockDashboardApiCareRequest.external_id,
        });
        const completedStatus = [
          buildMockCompanionTaskStatus({
            name: CompanionTaskStatusName.COMPLETED,
          }),
        ];

        beforeEach(() => {
          mockJobsService.removeRunningLateSmsJob.mockResolvedValue();
          mockDatabaseService.companionLink.findUnique.mockResolvedValue(
            mockCompanionLink
          );
          mockReminderTextExperiment(true);
          mockTasksRepository.findTasks.mockResolvedValue([
            buildMockCompanionIdentificationTask({ statuses: completedStatus }),
          ]);
        });

        test(`should return ${HttpStatus.OK}`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .send(mockDashboardWebhookDtoOnRoute)
            .expect(HttpStatus.OK);
        });
      });
    });
  });

  describe(`${CompanionController.prototype.getCompanionInfoByLinkId.name}`, () => {
    const buildPath = (id: string): string => `${basePath}/${id}`;

    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
    });

    test(`should return ${HttpStatus.OK}`, () => {
      return request(app.getHttpServer())
        .get(buildPath(mockCompanionLink.id))
        .expect(HttpStatus.OK);
    });

    test(`should return companion info`, () => {
      return request(app.getHttpServer())
        .get(buildPath(mockCompanionLink.id))
        .expect(JSON.stringify(mockCompanionInfo));
    });

    test(`should return ${HttpStatus.NOT_FOUND} for invalid ID`, () => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .get(buildPath(faker.datatype.uuid()))
        .expect(HttpStatus.NOT_FOUND);
    });

    test(`should return ${HttpStatus.INTERNAL_SERVER_ERROR} for care request not found`, () => {
      toggleLogging(app, false);
      mockDashboardService.getCareRequestById.mockResolvedValue(null);

      request(app.getHttpServer())
        .get(buildPath(faker.datatype.uuid()))
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      toggleLogging(app, true);
    });

    describe(`Authentication Unsuccessful`, () => {
      beforeEach(() => {
        mockCompanionAuthGuard.canActivate.mockRejectedValue(
          new UnauthorizedException()
        );
      });

      test(`should return ${HttpStatus.UNAUTHORIZED}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe(`${CompanionController.prototype.authenticate.name}`, () => {
    const buildPath = (id: string): string => `${basePath}/${id}/auth`;

    describe(`Authentication Successful`, () => {
      beforeEach(() => {
        mockCompanionAuthGuard.canActivate.mockResolvedValue(true);
      });

      test(`should return ${HttpStatus.OK}`, () => {
        return request(app.getHttpServer())
          .post(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.OK);
      });
    });

    describe(`Authentication Unsuccessful`, () => {
      beforeEach(() => {
        mockCompanionAuthGuard.canActivate.mockRejectedValue(
          new UnauthorizedException()
        );
      });

      test(`should return ${HttpStatus.UNAUTHORIZED}`, () => {
        return request(app.getHttpServer())
          .post(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe(`${CompanionController.prototype.getCompanionLinkStatusByLinkId.name}`, () => {
    const buildPath = (id: string): string => `${basePath}/${id}/status`;

    describe('Link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValueOnce(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValueOnce(
          mockCareRequest
        );
      });

      test(`hould return ${HttpStatus.OK}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.OK);
      });
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValueOnce(
          null
        );
      });

      test(`should return ${HttpStatus.NOT_FOUND}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('Link Expired', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValueOnce(
          mockOldCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValueOnce(
          mockOldCareRequest
        );
      });

      test(`should return ${HttpStatus.GONE}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.GONE);
      });
    });
  });

  describe(`${CompanionController.prototype.getCompanionLinkAnalyticsInfo.name}`, () => {
    const buildPath = (id: string): string => `${basePath}/${id}/analytics`;

    describe('Link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test(`should return ${HttpStatus.OK}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.OK, mockAnalyticsInfo);
      });
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`should return ${HttpStatus.NOT_FOUND}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('Link is expired', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockOldCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockOldCareRequest
        );
      });

      test(`should return ${HttpStatus.GONE}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.GONE);
      });
    });
  });

  describe(`${CompanionController.prototype.getCareTeamEta.name}`, () => {
    const buildPath = (id: string): string => `${basePath}/${id}/care-team-eta`;

    const mockCareTeamEta = buildMockCareTeamEta();
    const mockCompanionLink = buildMockCompanionLinkWithTasks({
      careRequestId: mockDashboardApiCareRequest.external_id,
    });

    describe(`Authentication Successful`, () => {
      beforeEach(() => {
        mockCompanionAuthGuard.canActivate.mockResolvedValue(true);
      });

      describe('Link exists', () => {
        beforeEach(() => {
          mockDatabaseService.companionLink.findUnique.mockResolvedValue(
            mockCompanionLink
          );
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
          mockDashboardService.getCareTeamEta.mockResolvedValue(
            mockCareTeamEta
          );
        });

        test(`should return ${HttpStatus.OK}`, () => {
          return request(app.getHttpServer())
            .get(buildPath(mockCompanionLink.id))
            .expect(HttpStatus.OK, mockCareTeamEta);
        });

        describe('Link is expired', () => {
          beforeEach(() => {
            mockDatabaseService.companionLink.findUnique.mockResolvedValue(
              mockOldCompanionLink
            );
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockOldCareRequest
            );
          });

          test(`should return ${HttpStatus.GONE}`, () => {
            return request(app.getHttpServer())
              .get(buildPath(mockCompanionLink.id))
              .expect(HttpStatus.GONE);
          });
        });
      });

      describe('Link does not exist', () => {
        beforeEach(() => {
          mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
        });

        test(`should return ${HttpStatus.NOT_FOUND}`, () => {
          return request(app.getHttpServer())
            .get(buildPath(mockCompanionLink.id))
            .expect(HttpStatus.NOT_FOUND);
        });
      });
    });

    describe(`Authentication Unsuccessful`, () => {
      beforeEach(() => {
        mockCompanionAuthGuard.canActivate.mockRejectedValue(
          new UnauthorizedException()
        );
      });

      test(`should return ${HttpStatus.UNAUTHORIZED}`, () => {
        return request(app.getHttpServer())
          .get(buildPath(mockCompanionLink.id))
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });
});

describe(`${CareTeamEtaDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        estimatedArrivalTimestampSec: 1668211110,
        precision: 'PRECISION_COARSE',
      };
      const dto = plainToInstance(CareTeamEtaDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        precision: 'INVALID',
      };
      const dto = plainToInstance(CareTeamEtaDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'estimatedArrivalTimestampSec must be a number'
      );
    });
  });
});

describe(`${CompanionInfoDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        careRequestId: faker.datatype.number(),
        patientFirstName: faker.datatype.string(),
        patientLastName: faker.datatype.string(),
        currentStates: [],
        location: {},
        providers: [],
        checkInTaskStatuses: [],
        isLV1: true,
        activeStatus: {
          id: faker.datatype.number(),
          name: 'accepted',
          startedAt: '2021-07-08T20:39:08.305Z',
          metadata: {},
          username: 'user',
          commenterName: 'commenter',
        },
        etaRanges: [
          {
            id: faker.datatype.number(),
            startsAt: '2021-07-08T18:39:08.305Z',
            endsAt: '2021-07-08T18:39:08.305Z',
            careRequestId: faker.datatype.number(),
            careRequestStatusId: faker.datatype.number(),
            createdAt: '2021-07-08T18:39:08.305Z',
            updatedAt: '2021-07-08T18:39:08.305Z',
          },
        ],
      };
      const dto = plainToInstance(CompanionInfoDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        careRequestId: faker.datatype.number(),
        patientFirstName: faker.datatype.string(),
        patientLastName: faker.datatype.string(),
        currentStates: [],
        location: {},
        providers: [],
        checkInTaskStatuses: [],
        isLV1: true,
        activeStatus: {},
      };
      const dto = plainToInstance(CompanionInfoDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('etaRanges must be an array');
    });
  });
});

describe(`${CompanionTaskStatusDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        id: faker.datatype.number(),
        type: 'CONSENTS',
        activeStatusId: faker.datatype.number(),
        activeStatus: {},
        statuses: [],
        updatedAt: new Date(),
        metadata: {},
      };
      const dto = plainToInstance(CompanionTaskStatusDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        id: faker.datatype.string(),
        type: 'INVALID',
        activeStatusId: faker.datatype.number(),
        activeStatus: {},
        statuses: [],
        updatedAt: new Date(),
        metadata: {},
      };
      const dto = plainToInstance(CompanionTaskStatusDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('id must be a number');
    });
  });
});

describe(`${DashboardWebhookDtoV1.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        care_request: '{"external_id":867769,"request_status":"accepted"}',
      };
      const dto = plainToInstance(DashboardWebhookDtoV1, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        care_request_id: faker.datatype.number(),
      };
      const dto = plainToInstance(DashboardWebhookDtoV1, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('care_request must be a string');
    });
  });
});

describe(`${DashboardWebhookDtoV2.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        care_request_id: faker.datatype.number(),
        request_status: 'accepted',
      };
      const dto = plainToInstance(DashboardWebhookDtoV2, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        request_status: 'accepted',
      };
      const dto = plainToInstance(DashboardWebhookDtoV2, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'care_request_id must be a number conforming to the specified constraints'
      );
    });
  });
});
