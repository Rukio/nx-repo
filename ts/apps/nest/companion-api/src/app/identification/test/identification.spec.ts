import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CommonModule } from '../../common/common.module';
import { IdentificationModule } from '../identification.module';
import { CompanionAuthGuard } from '../../companion/companion-auth.guard';
import { mockCompanionAuthGuard } from '../../companion/mocks/companion-auth.guard.mock';
import { IdentificationController } from '../identification.controller';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { buildMockDriversLicenseUploadResponse } from '../../dashboard/mocks/drivers-license-upload-response.mock';
import { buildMockCompanionTask } from '../../tasks/mocks/companion-task.mock';
import { IMAGE_UPLOAD_TIMEOUT } from '../../../testUtils/jest.setup';
import { IdentificationUploadDto } from '../dto/identification-upload.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../../companion/mocks/segment.service.mock';

describe(`${IdentificationModule.name} API Tests`, () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IdentificationModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink = buildMockCompanionLink();

  const mockDashboardDriversLicense = buildMockDriversLicenseUploadResponse();

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const basePath = `/companion/${mockCompanionLink.id}/identification`;

  const identificationImagePath =
    './ts/apps/nest/companion-api/src/testUtils/data/identification.jpeg';
  const identificationImageMimeType = 'image/jpeg';

  const mockCompanionTask = buildMockCompanionTask();

  describe(`${IdentificationController.prototype.uploadImage.name}`, () => {
    const buildPath = (): string => `${basePath}/images`;

    describe('Link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.uploadPatientDriversLicense.mockResolvedValue(
          mockDashboardDriversLicense
        );
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockCompanionTask,
        ]);
      });

      test(
        `Returns ${HttpStatus.CREATED}`,
        () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .attach('image', identificationImagePath, {
              contentType: identificationImageMimeType,
            })
            .expect(HttpStatus.CREATED);
        },
        IMAGE_UPLOAD_TIMEOUT
      );

      test(`Returns ${HttpStatus.BAD_REQUEST} with no image`, () => {
        return request(app.getHttpServer())
          .post(buildPath())
          .expect(HttpStatus.BAD_REQUEST);
      });

      test(
        `Returns ${HttpStatus.BAD_REQUEST} with with bad mime-type`,
        () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .attach('image', identificationImagePath, {
              contentType: 'image/bad',
            })
            .expect(HttpStatus.BAD_REQUEST);
        },
        IMAGE_UPLOAD_TIMEOUT
      );
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(
        `Returns ${HttpStatus.NOT_FOUND}`,
        () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .attach('image', identificationImagePath, {
              contentType: identificationImageMimeType,
            })
            .expect(HttpStatus.NOT_FOUND);
        },
        IMAGE_UPLOAD_TIMEOUT
      );
    });
  });

  describe(`${IdentificationController.prototype.deleteByLinkId.name}`, () => {
    const buildPath = (): string => `${basePath}`;

    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDashboardService.getDriversLicenseByPatientId.mockResolvedValue(
        mockDashboardDriversLicense
      );
      mockDashboardService.deleteDriversLicenseById.mockResolvedValue();
    });

    describe('Link exists', () => {
      test(`Returns ${HttpStatus.OK}`, () => {
        return request(app.getHttpServer())
          .delete(buildPath())
          .expect(HttpStatus.OK);
      });
    });

    describe(`Driver's license does not exist`, () => {
      beforeEach(() => {
        mockDashboardService.getDriversLicenseByPatientId.mockResolvedValue(
          null
        );
      });

      test(`Returns ${HttpStatus.BAD_REQUEST}`, () => {
        return request(app.getHttpServer())
          .delete(buildPath())
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns ${HttpStatus.NOT_FOUND}`, () => {
        return request(app.getHttpServer())
          .delete(buildPath())
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });
});

describe(`${IdentificationUploadDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        image: 'image',
      };
      const dto = plainToInstance(IdentificationUploadDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        image: true,
      };
      const dto = plainToInstance(IdentificationUploadDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('image must be a string');
    });
  });
});
