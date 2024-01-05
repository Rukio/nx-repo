import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { CompanionLink } from '@prisma/client';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CommonModule } from '../../common/common.module';
import { CompanionAuthGuard } from '../../companion/companion-auth.guard';
import { mockCompanionAuthGuard } from '../../companion/mocks/companion-auth.guard.mock';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { PcpModule } from '../pcp.module';
import { buildMockPrimaryCareProvider } from '../mock/pcp.mock';
import { PcpController } from '../pcp.controller';
import { buildMockPrimaryCareProviderTask } from '../../tasks/mocks/companion-task.mock';
import { mockStatsigService } from '../../statsig/mocks/statsig.service.mock';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { getQueueToken } from '@nestjs/bull';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { PrimaryCareProviderDto } from '../dto/pcp.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as faker from 'faker';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../../companion/mocks/segment.service.mock';

describe(`${PcpModule.name} API Tests`, () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PcpModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink: CompanionLink = buildMockCompanionLink();

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const mockPrimaryCareProvider = buildMockPrimaryCareProvider();

  const mockCompanionTask = buildMockPrimaryCareProviderTask();

  const basePath = `/companion/${mockCompanionLink.id}/primary-care-providers`;

  describe(`${PcpController.prototype.setPrimaryCareProvider.name}`, () => {
    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDashboardService.setPrimaryCareProvider(
        mockCareRequest.id,
        mockCareRequest.patientId,
        mockPrimaryCareProvider.clinicalProvider
      );
      mockDatabaseService.companionTask.findMany.mockResolvedValue([
        mockCompanionTask,
      ]);
    });

    test(`Returns ${HttpStatus.CREATED}`, () => {
      return request(app.getHttpServer())
        .post(basePath)
        .send(mockPrimaryCareProvider)
        .expect(HttpStatus.CREATED);
    });

    test(`Returns ${HttpStatus.BAD_REQUEST} with no body`, () => {
      return request(app.getHttpServer())
        .post(basePath)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns ${HttpStatus.NOT_FOUND} when companion link is not found`, () => {
        return request(app.getHttpServer())
          .post(basePath)
          .send(mockPrimaryCareProvider)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });
});

describe(`${PrimaryCareProviderDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        clinicalProvider: {
          id: faker.datatype.number(),
        },
      };
      const dto = plainToInstance(PrimaryCareProviderDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        clinicalProviderId: faker.datatype.number(),
      };
      const dto = plainToInstance(PrimaryCareProviderDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'clinicalProvider must be an object'
      );
    });
  });
});
