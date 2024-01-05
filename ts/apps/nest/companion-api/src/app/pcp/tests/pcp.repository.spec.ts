import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { CommonModule } from '../../common/common.module';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { PcpRepository } from '../pcp.repository';
import { PcpModule } from '../pcp.module';
import { buildMockPrimaryCareProvider } from '../mock/pcp.mock';
import { PcpController } from '../pcp.controller';
import { getQueueToken } from '@nestjs/bull';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';

describe(`${PcpRepository.name}`, () => {
  let app: INestApplication;
  let repository: PcpRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PcpModule, CommonModule],
    })
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    repository = moduleRef.get<PcpRepository>(PcpRepository);

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

  const mockPrimaryCareProvider = buildMockPrimaryCareProvider();

  describe(`${PcpController.prototype.setPrimaryCareProvider.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test(`Calls ${DashboardService.prototype.setPrimaryCareProvider.name}`, async () => {
        await repository.setPrimaryCareProvider(
          mockCareRequest.id,
          mockPrimaryCareProvider.clinicalProvider
        );

        expect(
          mockDashboardService.setPrimaryCareProvider
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.setPrimaryCareProvider(
            mockCareRequest.id,
            mockPrimaryCareProvider.clinicalProvider
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      test(`Does not call ${DashboardService.prototype.setPrimaryCareProvider.name}`, async () => {
        try {
          await repository.setPrimaryCareProvider(
            mockCareRequest.id,
            mockPrimaryCareProvider.clinicalProvider
          );
          // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(
          mockDashboardService.setPrimaryCareProvider
        ).toHaveBeenCalledTimes(0);
      });
    });
  });
});
