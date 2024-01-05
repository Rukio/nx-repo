import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CommonModule } from '../../common/common.module';
import { IdentificationModule } from '../identification.module';
import { IdentificationController } from '../identification.controller';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { buildMockDriversLicenseUploadResponse as buildMockDashboardDriversLicense } from '../../dashboard/mocks/drivers-license-upload-response.mock';
import { IdentificationRepository } from '../identification.repository';
import { mockDeep } from 'jest-mock-extended';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';

describe(`${IdentificationRepository.name}`, () => {
  let app: INestApplication;
  let repository: IdentificationRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IdentificationModule, CommonModule],
    })
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    repository = moduleRef.get<IdentificationRepository>(
      IdentificationRepository
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink = buildMockCompanionLink();

  const mockDashboardDriversLicense = buildMockDashboardDriversLicense();

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const mockFile = mockDeep<Express.Multer.File>();

  describe(`${IdentificationController.prototype.uploadImage.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.uploadPatientDriversLicense.mockResolvedValue(
          mockDashboardDriversLicense
        );
      });

      test(`Calls ${DashboardService.prototype.uploadPatientDriversLicense.name}`, async () => {
        await repository.uploadImageByCareRequestId(
          mockCareRequest.patientId,
          mockFile
        );

        expect(
          mockDashboardService.uploadPatientDriversLicense
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
        mockDashboardService.uploadPatientDriversLicense.mockResolvedValue(
          mockDashboardDriversLicense
        );
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.uploadImageByCareRequestId(
            mockCareRequest.patientId,
            mockFile
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      test(`Does not call ${DashboardService.prototype.uploadPatientDriversLicense.name}`, async () => {
        try {
          await repository.uploadImageByCareRequestId(
            mockCareRequest.patientId,
            mockFile
          );
          // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(
          mockDashboardService.uploadPatientDriversLicense
        ).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe(`${IdentificationController.prototype.deleteByLinkId.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.getDriversLicenseByPatientId.mockResolvedValue(
          mockDashboardDriversLicense
        );
        mockDashboardService.deleteDriversLicenseById.mockResolvedValue();
      });

      test(`Calls ${DashboardService.prototype.deleteDriversLicenseById.name}`, async () => {
        await repository.deleteDriversLicenseByCareRequestId(
          mockCareRequest.id
        );

        expect(
          mockDashboardService.deleteDriversLicenseById
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
        mockDashboardService.deleteDriversLicenseById.mockResolvedValue();
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.deleteDriversLicenseByCareRequestId(mockCareRequest.id)
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      test(`Does not call ${DashboardService.prototype.deleteDriversLicenseById.name}`, async () => {
        try {
          await repository.deleteDriversLicenseByCareRequestId(
            mockCareRequest.id
          );
          // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(
          mockDashboardService.deleteDriversLicenseById
        ).toHaveBeenCalledTimes(0);
      });
    });
  });
});
