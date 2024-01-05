import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CommonModule } from '../../common/common.module';
import { PharmaciesController } from '../pharmacies.controller';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { PharmaciesRepository } from '../pharmacies.repository';
import { buildMockDefaultPharmacy } from '../mocks/pharmacy.mocks';
import { PharmaciesModule } from '../pharmacies.module';
import { getQueueToken } from '@nestjs/bull';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';

describe(`${PharmaciesRepository.name}`, () => {
  let app: INestApplication;
  let repository: PharmaciesRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PharmaciesModule, CommonModule],
    })
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    repository = moduleRef.get<PharmaciesRepository>(PharmaciesRepository);

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

  const mockDefaultPharmacy = buildMockDefaultPharmacy();

  describe(`${PharmaciesController.prototype.setDefaultPharmacy.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test(`Calls ${DashboardService.prototype.setDefaultPharmacy.name}`, async () => {
        await repository.setDefaultPharmacy(
          mockCareRequest.patientId,
          mockDefaultPharmacy.defaultPharmacy
        );

        expect(mockDashboardService.setDefaultPharmacy).toHaveBeenCalledTimes(
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
          repository.setDefaultPharmacy(
            mockCareRequest.patientId,
            mockDefaultPharmacy.defaultPharmacy
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      test(`Does not call ${DashboardService.prototype.setDefaultPharmacy.name}`, async () => {
        try {
          await repository.setDefaultPharmacy(
            mockCareRequest.patientId,
            mockDefaultPharmacy.defaultPharmacy
          );
          // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(mockDashboardService.setDefaultPharmacy).toHaveBeenCalledTimes(
          0
        );
      });
    });
  });
});
