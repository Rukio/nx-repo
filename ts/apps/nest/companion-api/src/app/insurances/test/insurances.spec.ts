import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { buildMockDashboardInsurance } from '../../dashboard/mocks/dashboard-insurance.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CommonModule } from '../../common/common.module';
import { CompanionAuthGuard } from '../../companion/companion-auth.guard';
import { mockCompanionAuthGuard } from '../../companion/mocks/companion-auth.guard.mock';
import { InsurancesModule } from '../insurances.module';
import { InsurancesController } from '../insurances.controller';
import { DashboardInsurance } from '../../dashboard/types/dashboard-insurance';
import { buildMockCompanionInsuranceTask } from '../../tasks/mocks/companion-task.mock';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { IMAGE_UPLOAD_TIMEOUT } from '../../../testUtils/jest.setup';
import { InsuranceImageUploadDto } from '../dto/insurance-image-upload.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IOREDIS_CLIENT_TOKEN } from '../../redis';
import { mockRedis } from '../../redis/mocks/redis.mock';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../../companion/mocks/segment.service.mock';

describe(`${InsurancesModule.name} API Tests`, () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InsurancesModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .overrideProvider(IOREDIS_CLIENT_TOKEN)
      .useValue(mockRedis)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink = buildMockCompanionLink();

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const mockDashboardInsurance: DashboardInsurance =
    buildMockDashboardInsurance();
  const mockDashboardInsurances: DashboardInsurance[] = [
    mockDashboardInsurance,
  ];

  const basePath = `/companion/${mockCompanionLink.id}/insurances`;

  const insuranceCardFrontPath =
    './ts/apps/nest/companion-api/src/testUtils/data/insurance-card-front.png';
  const insuranceCardBackPath =
    './ts/apps/nest/companion-api/src/testUtils/data/insurance-card-back.jpeg';
  const insuranceCardImageMimeType = 'image/jpeg';
  const invalidMimeType = 'image/gif';

  const mockCompanionTask = buildMockCompanionInsuranceTask();

  describe(`${InsurancesController.prototype.uploadImage.name}`, () => {
    const buildPath = (priority: string): string =>
      `${basePath}/priority/${priority}/images`;

    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDashboardService.getPatientInsurances.mockResolvedValue(
        mockDashboardInsurances
      );
      mockDatabaseService.companionTask.findMany.mockResolvedValue([
        mockCompanionTask,
      ]);
    });

    test(
      `Returns ${HttpStatus.CREATED}`,
      () => {
        return request(app.getHttpServer())
          .post(buildPath(mockDashboardInsurance.priority))
          .attach('cardFront', insuranceCardFrontPath, {
            contentType: insuranceCardImageMimeType,
          })
          .attach('cardBack', insuranceCardBackPath, {
            contentType: insuranceCardImageMimeType,
          })
          .expect(HttpStatus.CREATED);
      },
      IMAGE_UPLOAD_TIMEOUT
    );

    test(`Returns ${HttpStatus.BAD_REQUEST} with no images`, () => {
      return request(app.getHttpServer())
        .post(buildPath(mockDashboardInsurance.priority))
        .expect(HttpStatus.BAD_REQUEST);
    });

    test(
      `Returns ${HttpStatus.CREATED} with no card front`,
      () => {
        return request(app.getHttpServer())
          .post(buildPath(mockDashboardInsurance.priority))
          .attach('cardBack', insuranceCardBackPath, {
            contentType: insuranceCardImageMimeType,
          })
          .expect(HttpStatus.CREATED);
      },
      IMAGE_UPLOAD_TIMEOUT
    );

    test(
      `Returns ${HttpStatus.CREATED} with no card back`,
      () => {
        return request(app.getHttpServer())
          .post(buildPath(mockDashboardInsurance.priority))
          .attach('cardFront', insuranceCardFrontPath, {
            contentType: insuranceCardImageMimeType,
          })
          .expect(HttpStatus.CREATED);
      },
      IMAGE_UPLOAD_TIMEOUT
    );

    test(
      `Returns ${HttpStatus.BAD_REQUEST} with priority over limit`,
      () => {
        const priorityOverLimit = '3';

        return request(app.getHttpServer())
          .post(buildPath(priorityOverLimit))
          .attach('cardFront', insuranceCardFrontPath, {
            contentType: insuranceCardImageMimeType,
          })
          .attach('cardBack', insuranceCardBackPath, {
            contentType: insuranceCardImageMimeType,
          })
          .expect(HttpStatus.BAD_REQUEST);
      },
      IMAGE_UPLOAD_TIMEOUT
    );

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(
        `Returns ${HttpStatus.NOT_FOUND} when companion link is not found`,
        () => {
          return request(app.getHttpServer())
            .post(buildPath(mockDashboardInsurance.priority))
            .attach('cardFront', insuranceCardFrontPath, {
              contentType: insuranceCardImageMimeType,
            })
            .attach('cardBack', insuranceCardBackPath, {
              contentType: insuranceCardImageMimeType,
            })
            .expect(HttpStatus.NOT_FOUND);
        },
        IMAGE_UPLOAD_TIMEOUT
      );
    });

    test(
      `Returns ${HttpStatus.BAD_REQUEST} with invalid MIME type for card front`,
      () => {
        return request(app.getHttpServer())
          .post(buildPath(mockDashboardInsurance.priority))
          .attach('cardFront', insuranceCardFrontPath, {
            contentType: invalidMimeType,
          })
          .attach('cardBack', insuranceCardBackPath, {
            contentType: insuranceCardImageMimeType,
          })
          .expect(HttpStatus.BAD_REQUEST);
      },
      IMAGE_UPLOAD_TIMEOUT
    );

    test(
      `Returns ${HttpStatus.BAD_REQUEST} with invalid MIME type for card back`,
      () => {
        return request(app.getHttpServer())
          .post(buildPath(mockDashboardInsurance.priority))
          .attach('cardFront', insuranceCardFrontPath, {
            contentType: insuranceCardImageMimeType,
          })
          .attach('cardBack', insuranceCardBackPath, {
            contentType: invalidMimeType,
          })
          .expect(HttpStatus.BAD_REQUEST);
      },
      IMAGE_UPLOAD_TIMEOUT
    );
  });

  describe(`${InsurancesController.prototype.deleteImages.name}`, () => {
    const buildPath = (priority: string, cardType: string): string =>
      `${basePath}/priority/${priority}/images?card_type=${cardType}`;

    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDashboardService.getPatientInsurances.mockResolvedValue(
        mockDashboardInsurances
      );
    });

    test(`Returns ${HttpStatus.BAD_REQUEST} with invalid card type`, () => {
      return request(app.getHttpServer())
        .delete(buildPath(mockDashboardInsurance.priority, 'dummy card side'))
        .expect(HttpStatus.BAD_REQUEST);
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns ${HttpStatus.NOT_FOUND} when companion link is not found`, () => {
        return request(app.getHttpServer())
          .delete(
            buildPath(mockDashboardInsurance.priority, 'remove_card_front')
          )
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });
});

describe(`${InsuranceImageUploadDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        cardFront: 'data:image/png;base64,ABQCAIAAABtUGDWAA...',
        cardBack: 'data:image/png;base64,iVBORw0KGgoAAAANSUh...',
      };
      const dto = plainToInstance(InsuranceImageUploadDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const body = {};
      const dto = plainToInstance(InsuranceImageUploadDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        cardFront: false,
      };
      const dto = plainToInstance(InsuranceImageUploadDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('cardFront must be a string');
    });
  });
});
