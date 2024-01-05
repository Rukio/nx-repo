import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { CommonModule } from '../../common/common.module';
import { ClinicalProvidersRepository } from '../clinical-providers.repository';
import { ClinicalProvidersModule } from '../clinical-providers.module';
import { buildMockClinicalProviderSearchDto } from '../mocks/clinical-providers.mocks';
import { ClinicalProvidersController } from '../clinical-providers.controller';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';

describe(`${ClinicalProvidersRepository.name}`, () => {
  let app: INestApplication;
  let repository: ClinicalProvidersRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ClinicalProvidersModule, CommonModule],
    })
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    repository = moduleRef.get<ClinicalProvidersRepository>(
      ClinicalProvidersRepository
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockClinicalProvider = buildMockClinicalProviderSearchDto();

  describe(`${ClinicalProvidersController.prototype.searchClinicalProviders.name}`, () => {
    describe('Care request exists', () => {
      test(`Calls ${DashboardService.prototype.searchClinicalProviders.name}`, async () => {
        await repository.searchClinicalProviders(
          mockClinicalProvider.clinicalProvider
        );

        expect(
          mockDashboardService.searchClinicalProviders
        ).toHaveBeenCalledTimes(1);
      });
    });
  });
});
