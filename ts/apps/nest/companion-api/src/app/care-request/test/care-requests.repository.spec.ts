import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { CareRequestModule } from '../care-request.module';
import { CareRequestRepository } from '../care-request.repository';
import { buildMockCareRequest } from '../mocks/care-request.repository.mock';
import { CareRequestDto } from '../dto/care-request.dto';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { CommonModule } from '../../common/common.module';
import { CareRequestNotFoundException } from '../common';
import { CompanionLink } from '@prisma/client';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';

describe(`${CareRequestRepository.name}`, () => {
  let app: INestApplication;
  let careRequestService: CareRequestRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CareRequestModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .compile();

    careRequestService = moduleRef.get<CareRequestRepository>(
      CareRequestRepository
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCareRequest: CareRequestDto = buildMockCareRequest();

  describe(`${CareRequestRepository.prototype.getById.name}`, () => {
    beforeEach(() => {
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
    });

    test('should get care request from dashboard', async () => {
      await careRequestService.getById(mockCareRequest.id);

      expect(mockDashboardService.getCareRequestById).toHaveBeenCalledTimes(1);
    });

    test('should return care request', async () => {
      const result = await careRequestService.getById(mockCareRequest.id);

      expect(result).toStrictEqual(mockCareRequest);
    });
  });

  describe(`${CareRequestRepository.prototype.getByIdWithError.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test('should get care request from dashboard', async () => {
        await careRequestService.getByIdWithError(mockCareRequest.id);

        expect(mockDashboardService.getCareRequestById).toHaveBeenCalledTimes(
          1
        );
      });

      test('should return care request', async () => {
        const result = await careRequestService.getByIdWithError(
          mockCareRequest.id
        );

        expect(result).toStrictEqual(mockCareRequest);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(null);
      });

      test(`should throw ${NotFoundException.name}`, async () => {
        await expect(
          careRequestService.getByIdWithError(mockCareRequest.id)
        ).rejects.toBeInstanceOf(CareRequestNotFoundException);
      });
    });
  });

  describe(`${CareRequestRepository.prototype.getByLinkId.name}`, () => {
    const mockCompanionLink: CompanionLink = buildMockCompanionLink();

    describe('Link does exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test('should get care request from dashboard by link ID', async () => {
        await careRequestService.getByLinkId(mockCompanionLink.id);

        expect(mockDashboardService.getCareRequestById).toHaveBeenCalledTimes(
          1
        );
      });

      test('should return care request', async () => {
        const result = await careRequestService.getByLinkId(
          mockCompanionLink.id
        );

        expect(result).toStrictEqual(mockCareRequest);
      });
    });

    describe('Link does not exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test('should throw NotFoundException', async () => {
        await expect(
          careRequestService.getByLinkId(mockCompanionLink.id)
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });
});
