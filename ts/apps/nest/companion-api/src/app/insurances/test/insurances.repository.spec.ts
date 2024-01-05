import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { CommonModule } from '../../common/common.module';
import { InsurancesModule } from '../insurances.module';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { buildMockDashboardInsurance } from '../../dashboard/mocks/dashboard-insurance.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { InsurancesRepository } from '../insurances.repository';
import { DashboardInsurance } from '../../dashboard/types/dashboard-insurance';
import { mockDeep } from 'jest-mock-extended';
import { InsuranceCardType } from '../interfaces/insurance_card_type.interface';
import { getQueueToken } from '@nestjs/bull';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';

describe(`${InsurancesRepository.name}`, () => {
  let app: INestApplication;
  let repository: InsurancesRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [InsurancesModule, CommonModule],
    })
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    repository = moduleRef.get<InsurancesRepository>(InsurancesRepository);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink = buildMockCompanionLink();

  const mockDashboardInsurance: DashboardInsurance =
    buildMockDashboardInsurance();
  const mockDashboardInsurances: DashboardInsurance[] = [
    mockDashboardInsurance,
  ];

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const mockFile = mockDeep<Express.Multer.File>();

  describe(`${InsurancesRepository.prototype.uploadImagesByInsurancePriority.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.getPatientInsurances.mockResolvedValue(
          mockDashboardInsurances
        );
      });

      test(`Calls ${DashboardService.prototype.uploadInsurance.name}`, async () => {
        await repository.uploadImagesByInsurancePriority(
          mockCareRequest.id,
          mockDashboardInsurance.priority,
          mockFile,
          mockFile
        );

        expect(mockDashboardService.uploadInsurance).toHaveBeenCalledTimes(1);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
        mockDashboardService.getPatientInsurances.mockResolvedValue(
          mockDashboardInsurances
        );
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.uploadImagesByInsurancePriority(
            mockCareRequest.id,
            mockDashboardInsurance.priority,
            mockFile,
            mockFile
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      test(`Does not call ${DashboardService.prototype.uploadInsurance.name}`, async () => {
        try {
          await repository.uploadImagesByInsurancePriority(
            mockCareRequest.id,
            mockDashboardInsurance.priority,
            mockFile,
            mockFile
          );
          // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(mockDashboardService.uploadInsurance).toHaveBeenCalledTimes(0);
      });
    });

    describe('Patient has no insurance matching by priority', () => {
      const unmatchedPriority = '2';
      const mockDashboardInsuranceWithDiffPriority: DashboardInsurance =
        buildMockDashboardInsurance({
          priority: unmatchedPriority,
        });
      const mockDashboardInsurancesWithoutPriorityMatch: DashboardInsurance[] =
        [mockDashboardInsuranceWithDiffPriority];

      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.getPatientInsurances.mockResolvedValue(
          mockDashboardInsurancesWithoutPriorityMatch
        );
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.uploadImagesByInsurancePriority(
            mockCareRequest.id,
            mockDashboardInsurance.priority,
            mockFile,
            mockFile
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      test(`Does not call ${DashboardService.prototype.uploadInsurance.name}`, async () => {
        try {
          await repository.uploadImagesByInsurancePriority(
            mockCareRequest.id,
            mockDashboardInsurance.priority,
            mockFile,
            mockFile
          );
          // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(mockDashboardService.uploadInsurance).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe(`${InsurancesRepository.prototype.getPatientInsurancesByCareRequestId.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.getPatientInsurances.mockResolvedValue(
          mockDashboardInsurances
        );
      });

      test(`Gets insurances from dashboard`, async () => {
        await repository.getPatientInsurancesByCareRequestId(
          mockCareRequest.id
        );
        expect(mockDashboardService.getPatientInsurances).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.getPatientInsurancesByCareRequestId(mockCareRequest.id)
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });

  describe(`${InsurancesRepository.prototype.deleteInsuranceImages.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockDashboardService.getPatientInsurances.mockResolvedValue(
          mockDashboardInsurances
        );
      });

      test(`Calls ${DashboardService.prototype.deleteInsuranceImageByType.name}`, async () => {
        await repository.deleteInsuranceImages(
          mockCareRequest.id,
          mockDashboardInsurance.priority,
          InsuranceCardType.RemoveCardFront
        );

        expect(
          mockDashboardService.deleteInsuranceImageByType
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
        mockDashboardService.getPatientInsurances.mockResolvedValue(
          mockDashboardInsurances
        );
      });

      test(`Throws a ${NotFoundException.name}`, async () => {
        await expect(
          repository.deleteInsuranceImages(
            mockCareRequest.id,
            mockDashboardInsurance.priority,
            InsuranceCardType.RemoveCardBack
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      test(`Does not call ${DashboardService.prototype.deleteInsuranceImageByType.name}`, async () => {
        try {
          await repository.deleteInsuranceImages(
            mockCareRequest.patientId,
            mockDashboardInsurance.priority,
            InsuranceCardType.RemoveCardFront
          );
          // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(
          mockDashboardService.deleteInsuranceImageByType
        ).toHaveBeenCalledTimes(0);
      });
    });
  });
});
