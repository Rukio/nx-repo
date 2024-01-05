import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { CommonModule } from '../../common/common.module';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import {
  buildMockCareRequest,
  mockCareRequestRepository,
} from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { ConsentsRepository } from '../consents.repository';
import { ConsentsModule } from '../consents.module';
import { buildMockConsent } from '../mocks/consent.mock';
import { ConsentType } from '../dto/consent.dto';
import { CareRequestRepository } from '../../care-request/care-request.repository';
import { CaravanAdapter } from '../../caravan/caravan.adapter';
import { mockCaravanAdapter } from '../../caravan/mocks/caravan.adapter.mock';
import { buildMockCaravanConsentDefinition } from '../../caravan/mocks/caravan.definition.mock';
import { buildMockConsentDefinition } from '../mocks/definition.mock';
import { buildMockConsentCapture } from '../mocks/capture.mock';
import { buildMockCaravanConsentCapture } from '../../caravan/mocks/caravan.capture.mock';
import { buildMockConsentCapturesQuery } from '../../caravan/mocks/consent-captures-query.mock';
import { buildMockConsentDefinitionsQuery } from '../mocks/consent-definition-query.mock';
import { buildMockOptions } from '../mocks/options.mock';
import { buildMockCaravanConsentOptions } from '../../caravan/mocks/caravan.consent-options.mock';
import { mockDeep } from 'jest-mock-extended';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';

describe(`${ConsentsRepository.name}`, () => {
  let app: INestApplication;
  let repository: ConsentsRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConsentsModule, CommonModule],
    })
      .overrideProvider(CareRequestRepository)
      .useValue(mockCareRequestRepository)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(CaravanAdapter)
      .useValue(mockCaravanAdapter)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    repository = moduleRef.get<ConsentsRepository>(ConsentsRepository);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink = buildMockCompanionLink();

  const mockTypedConsent = buildMockConsent();

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  describe(`${ConsentsRepository.prototype.applySignedConsent.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockCareRequestRepository.getById.mockResolvedValue(mockCareRequest);
        mockDashboardService.applyPatientMedicationHistoryConsent.mockResolvedValue();
      });

      test(`should send consent to dashboard`, async () => {
        await repository.applySignedConsent(
          mockCareRequest.id,
          mockTypedConsent
        );
        expect(
          mockDashboardService.applyPatientMedicationHistoryConsent
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockCareRequestRepository.getById.mockResolvedValue(null);
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.applySignedConsent(mockCareRequest.id, mockTypedConsent)
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });

  describe(`${ConsentsRepository.prototype.getConsentStatusByType.name}`, () => {
    describe('Care request exists', () => {
      beforeEach(() => {
        mockCareRequestRepository.getById.mockResolvedValue(mockCareRequest);
        mockDashboardService.applyPatientMedicationHistoryConsent.mockResolvedValue();
      });

      test(`should call ${DashboardService.prototype.getPatientMedicationHistoryConsentStatus.name} for ${ConsentType.MEDICATION_HISTORY_AUTHORITY} consents`, async () => {
        await repository.getConsentStatusByType(
          mockCareRequest.id,
          mockTypedConsent.type
        );
        expect(
          mockDashboardService.getPatientMedicationHistoryConsentStatus
        ).toHaveBeenCalledTimes(1);
      });

      test(`should throw error for unknown type`, async () => {
        await expect(
          repository.getConsentStatusByType(
            mockCareRequest.id,
            'FAKE' as ConsentType
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe('Care request does not exist', () => {
      beforeEach(() => {
        mockCareRequestRepository.getById.mockResolvedValue(null);
      });

      test(`Throws ${NotFoundException.name}`, async () => {
        await expect(
          repository.getConsentStatusByType(
            mockCareRequest.id,
            mockTypedConsent.type
          )
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });

  describe(`${ConsentsRepository.prototype.getDefinitions.name}`, () => {
    const mockConsentDefinition = buildMockConsentDefinition();
    const mockCaravanConsentDefinition = buildMockCaravanConsentDefinition(
      mockConsentDefinition
    );

    beforeEach(() => {
      mockCaravanAdapter.consents.getDefinitions.mockResolvedValue([
        mockCaravanConsentDefinition,
      ]);
    });

    test(`should return array of consent captures`, async () => {
      const mockQuery = buildMockConsentDefinitionsQuery();

      const definitions = await repository.getDefinitions(mockQuery);

      expect(definitions).toStrictEqual([mockConsentDefinition]);

      expect(mockCaravanAdapter.consents.getDefinitions).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe(`${ConsentsRepository.prototype.getCaptures.name}`, () => {
    const mockConsentCapture = buildMockConsentCapture();
    const mockCaravanConsentCapture =
      buildMockCaravanConsentCapture(mockConsentCapture);

    beforeEach(() => {
      mockCaravanAdapter.consents.getCaptures.mockResolvedValue([
        mockCaravanConsentCapture,
      ]);
    });

    test(`should return array of consent captures`, async () => {
      const mockQuery = buildMockConsentCapturesQuery();

      const captures = await repository.getCaptures(mockQuery);

      expect(captures).toStrictEqual([mockConsentCapture]);

      expect(mockCaravanAdapter.consents.getCaptures).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${ConsentsRepository.prototype.getCaptures.name}`, () => {
    const mockConsentCapture = buildMockConsentCapture();
    const mockCaravanConsentCapture =
      buildMockCaravanConsentCapture(mockConsentCapture);

    beforeEach(() => {
      mockCaravanAdapter.consents.getCaptures.mockResolvedValue([
        mockCaravanConsentCapture,
      ]);
    });

    test(`should return create consent`, async () => {
      const result = await repository.createCapture(
        mockConsentCapture,
        mockDeep<Express.Multer.File>()
      );

      expect(result).toBeUndefined();
      expect(mockCaravanAdapter.consents.createCapture).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe(`${ConsentsRepository.prototype.getOptions.name}`, () => {
    const mockOptions = buildMockOptions();
    const { signers, frequencies, captureMethods, categories, languages } =
      mockOptions;
    const mockCaravanOptions = buildMockCaravanConsentOptions({
      signers,
      frequencies,
      capture_methods: captureMethods,
      categories,
      languages,
    });

    beforeEach(() => {
      mockCaravanAdapter.consents.getOptions.mockResolvedValue(
        mockCaravanOptions
      );
    });

    test(`should return consent options`, async () => {
      const definitions = await repository.getOptions();

      expect(definitions).toStrictEqual(mockOptions);

      expect(mockCaravanAdapter.consents.getOptions).toHaveBeenCalledTimes(1);
    });
  });
});
