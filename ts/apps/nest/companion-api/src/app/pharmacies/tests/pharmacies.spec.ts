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
import { PharmaciesModule } from '../pharmacies.module';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { PharmaciesController } from '../pharmacies.controller';
import { buildMockDefaultPharmacy } from '../mocks/pharmacy.mocks';
import { CompanionService } from '../../companion/companion.service';
import { buildMockCompanionDefaultPharmacyTask } from '../../tasks/mocks/companion-task.mock';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';
import { DefaultPharmacyDto } from '../dto/default-pharmacy.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as faker from 'faker';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../../companion/mocks/segment.service.mock';

describe(`${PharmaciesModule.name} API Tests`, () => {
  let app: INestApplication;
  let companionService: CompanionService;
  let markPharmacySetSpy: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PharmaciesModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    companionService = moduleRef.get<CompanionService>(CompanionService);
    markPharmacySetSpy = jest.spyOn(companionService, 'markPharmacySet');

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    markPharmacySetSpy?.mockClear();
  });

  const mockCompanionLink: CompanionLink = buildMockCompanionLink();

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const mockDefaultPharmacy = buildMockDefaultPharmacy();
  const mockPharmacyTask = buildMockCompanionDefaultPharmacyTask();

  const basePath = `/companion/${mockCompanionLink.id}/pharmacies/default`;

  describe(`${PharmaciesController.prototype.setDefaultPharmacy.name}`, () => {
    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockDatabaseService.companionTask.findMany.mockResolvedValue([
        mockPharmacyTask,
      ]);
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
    });

    test(`Returns ${HttpStatus.CREATED}`, () => {
      return request(app.getHttpServer())
        .post(basePath)
        .send(mockDefaultPharmacy)
        .expect(HttpStatus.CREATED)
        .expect(() => {
          expect(companionService.markPharmacySet).toHaveBeenCalledTimes(1);
        });
    });

    test(`Returns ${HttpStatus.BAD_REQUEST} with no body`, () => {
      return request(app.getHttpServer())
        .post(basePath)
        .send({})
        .expect(HttpStatus.BAD_REQUEST)
        .expect(() => {
          expect(companionService.markPharmacySet).toHaveBeenCalledTimes(0);
        });
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns ${HttpStatus.NOT_FOUND} when companion link is not found`, () => {
        return request(app.getHttpServer())
          .post(basePath)
          .send(mockDefaultPharmacy)
          .expect(HttpStatus.NOT_FOUND)
          .expect(() => {
            expect(companionService.markPharmacySet).toHaveBeenCalledTimes(0);
          });
      });
    });
  });

  describe(`${DefaultPharmacyDto.name}`, () => {
    describe('validations', () => {
      test('it passes with valid properties', async () => {
        const body = {
          defaultPharmacy: {
            id: faker.datatype.number(),
          },
        };
        const dto = plainToInstance(DefaultPharmacyDto, body);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      test('it fails with invalid properties', async () => {
        const body = {
          pharmacy: {
            id: faker.datatype.string(),
          },
        };
        const dto = plainToInstance(DefaultPharmacyDto, body);
        const errors = await validate(dto);

        expect(errors.length).not.toBe(0);
        expect(JSON.stringify(errors)).toContain(
          'defaultPharmacy must be an object'
        );
      });
    });
  });
});
