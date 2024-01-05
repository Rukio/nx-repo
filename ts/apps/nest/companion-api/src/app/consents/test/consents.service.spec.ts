import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { buildMockCompanionLinkWithTasks } from '../../companion/mocks/companion-link.mock';
import {
  buildMockCareRequest,
  mockCareRequestRepository,
} from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { ConsentsService } from '../consents.service';
import { ConsentsModule } from '../consents.module';
import { CareRequestRepository } from '../../care-request/care-request.repository';
import { ConsentsRepository } from '../consents.repository';
import { mockConsentsRepository } from '../mocks/consent.repository.mock';
import { buildMockConsentDefinition } from '../mocks/definition.mock';
import { ConsentDefinitionLanguage } from '../domain/definition';
import { ConsentDefinitionsQuery } from '../../caravan/types/consent-definition-query';
import { buildMockConsentCapture } from '../mocks/capture.mock';
import { mockDeep } from 'jest-mock-extended';
import { mockCompanionService } from '../../companion/mocks/companion.service.mock';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { CompanionService } from '../../companion/companion.service';
import { CompanionLinkNotFoundException } from '../../companion/common';
import { buildMockCompanionConsentsTask } from '../../tasks/mocks/companion-task.mock';
import { buildMockOptions } from '../mocks/options.mock';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { getQueueToken } from '@nestjs/bull';

describe(`${ConsentsService.name}`, () => {
  let app: INestApplication;
  let service: ConsentsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConsentsModule, CommonModule],
    })
      .overrideProvider(CareRequestRepository)
      .useValue(mockCareRequestRepository)
      .overrideProvider(ConsentsRepository)
      .useValue(mockConsentsRepository)
      .overrideProvider(CompanionService)
      .useValue(mockCompanionService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    service = moduleRef.get<ConsentsService>(ConsentsService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink = buildMockCompanionLinkWithTasks();

  const mockCareRequest: CareRequestDto = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const mockCareRequestWithoutServiceLine: CareRequestDto =
    buildMockCareRequest({
      id: mockCompanionLink.careRequestId,
      serviceLine: undefined,
    });

  const mockDefinitionId = 1;
  const mockSigner = '1';
  const mockFile = mockDeep<Express.Multer.File>();

  describe(`${ConsentsService.prototype.getDefinitionsForCompanionLink.name}`, () => {
    describe('Care request exists', () => {
      describe('Care request has service line', () => {
        beforeEach(() => {
          mockCareRequestRepository.getByIdWithError.mockResolvedValue(
            mockCareRequest
          );
        });

        describe('Incomplete filter = false', () => {
          beforeEach(() => {
            mockConsentsRepository.getDefinitions.mockResolvedValue([
              buildMockConsentDefinition(),
            ]);
          });

          test(`should retrieve consent definition`, async () => {
            const expectedParams: ConsentDefinitionsQuery = {
              active: true,
              serviceLine: expect.any(Number),
              state: mockCareRequest.state,
              languageId: ConsentDefinitionLanguage.ENGLISH,
              signerIds: expect.any(Array),
            };

            await service.getDefinitionsForCompanionLink(
              mockCompanionLink,
              mockSigner
            );
            expect(mockConsentsRepository.getDefinitions).toHaveBeenCalledTimes(
              1
            );
            expect(mockConsentsRepository.getDefinitions).toHaveBeenCalledWith(
              expectedParams
            );
          });

          test(`should not filter output`, async () => {
            await service.getDefinitionsForCompanionLink(
              mockCompanionLink,
              mockSigner
            );
            expect(mockConsentsRepository.getCaptures).toHaveBeenCalledTimes(0);
          });
        });

        describe('Incomplete filter = true', () => {
          const incompleteDefinition = buildMockConsentDefinition();
          const completeDefinition = buildMockConsentDefinition();
          const completeCapture = buildMockConsentCapture({
            definitionId: completeDefinition.id,
          });

          beforeEach(() => {
            mockConsentsRepository.getDefinitions.mockResolvedValue([
              incompleteDefinition,
              completeDefinition,
            ]);
            mockConsentsRepository.getCaptures.mockResolvedValue([
              completeCapture,
            ]);
          });

          test(`should filter definitions using returned captures`, async () => {
            await service.getDefinitionsForCompanionLink(
              mockCompanionLink,
              mockSigner,
              true
            );
            expect(mockConsentsRepository.getDefinitions).toHaveBeenCalledTimes(
              1
            );
            expect(mockConsentsRepository.getCaptures).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe('Care request has no service line', () => {
        beforeEach(() => {
          mockCareRequestRepository.getByIdWithError.mockResolvedValue(
            mockCareRequestWithoutServiceLine
          );
        });

        test(`should throw ${BadRequestException.name}`, async () => {
          await expect(
            service.getDefinitionsForCompanionLink(
              mockCompanionLink,
              mockSigner
            )
          ).rejects.toBeInstanceOf(BadRequestException);
          expect(mockConsentsRepository.getDefinitions).toHaveBeenCalledTimes(
            0
          );
        });
      });
    });
  });

  describe(`${ConsentsService.prototype.createCaptureForCompanionLink.name}`, () => {
    describe('Care request exists', () => {
      describe('Care request has service line', () => {
        beforeEach(() => {
          mockCareRequestRepository.getByIdWithError.mockResolvedValue(
            mockCareRequest
          );
        });

        test(`should create a consent capture`, async () => {
          const captureInfo = {
            definitionId: mockDefinitionId,
            episodeId: mockCareRequest.id.toString(),
            visitId: mockCareRequest.id.toString(),
            patientId: mockCareRequest.patientId.toString(),
            serviceLine: mockCareRequest?.serviceLine?.id.toString(),
            signer: mockSigner,
            verbal: false,
          };

          await service.createCaptureForCompanionLink(
            mockCompanionLink,
            mockDefinitionId,
            mockSigner,
            mockFile
          );

          expect(mockConsentsRepository.createCapture).toHaveBeenCalledTimes(1);
          expect(mockConsentsRepository.createCapture).toHaveBeenCalledWith(
            captureInfo,
            mockFile
          );
        });
      });

      describe('Care request has no service line', () => {
        beforeEach(() => {
          mockCareRequestRepository.getByIdWithError.mockResolvedValue(
            mockCareRequestWithoutServiceLine
          );
        });

        test(`should throw ${BadRequestException.name}`, async () => {
          await expect(
            service.createCaptureForCompanionLink(
              mockCompanionLink,
              mockDefinitionId,
              mockSigner,
              mockFile
            )
          ).rejects.toBeInstanceOf(BadRequestException);
          expect(mockConsentsRepository.createCapture).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe(`${ConsentsService.prototype.applySignedConsents.name}`, () => {
    describe('Link exists', () => {
      const mockOptions = buildMockOptions();
      const mockRequiredCategories = mockOptions.categories.filter(
        (cat) => cat.required
      );

      const mockRequiredConsentDefinitions = mockRequiredCategories.map(
        (cat) => {
          return buildMockConsentDefinition({ categoryId: cat.id });
        }
      );

      const mockConsentDefinitions = mockRequiredConsentDefinitions.concat(
        buildMockConsentDefinition()
      );

      beforeEach(() => {
        mockCompanionService.findLinkById.mockResolvedValue(mockCompanionLink);
        mockCareRequestRepository.getByIdWithError.mockResolvedValue(
          mockCareRequest
        );
        mockConsentsRepository.getOptions.mockResolvedValue(mockOptions);
        mockConsentsRepository.getDefinitions.mockResolvedValue(
          mockConsentDefinitions
        );
        mockDashboardService.applySignedConsents.mockResolvedValue(undefined);
      });

      describe('All required consents forms have been signed', () => {
        const mockRequiredConsentDefinitionIds =
          mockRequiredConsentDefinitions.map((cat) => cat.id);

        const mockConsentsTask = buildMockCompanionConsentsTask({
          metadata: {
            completedDefinitionIds: mockRequiredConsentDefinitionIds,
          },
        });

        describe('Care request has a valid service line', () => {
          test(`should call applySignedConsents method in dashboard service`, async () => {
            await service.applySignedConsents(mockConsentsTask);

            expect(
              mockDashboardService.applySignedConsents
            ).toHaveBeenCalledTimes(1);
          });
        });

        describe('Care request has no service line', () => {
          beforeEach(() => {
            mockCareRequestRepository.getByIdWithError.mockResolvedValue(
              mockCareRequestWithoutServiceLine
            );
          });

          test(`should throw ${BadRequestException.name}`, async () => {
            await expect(
              service.applySignedConsents(mockConsentsTask)
            ).rejects.toBeInstanceOf(BadRequestException);
            expect(mockConsentsRepository.createCapture).toHaveBeenCalledTimes(
              0
            );
          });
        });
      });

      describe('A required consent forms has not been signed', () => {
        const mockRequiredConsentDefinitionIds =
          mockRequiredConsentDefinitions.map((cat) => cat.id);

        const completedDefinitionIds = mockRequiredConsentDefinitionIds.slice(
          0,
          1
        );

        const mockConsentsTask = buildMockCompanionConsentsTask({
          metadata: { completedDefinitionIds },
        });

        test(`should call applySignedConsents method in dashboard service`, async () => {
          await service.applySignedConsents(mockConsentsTask);

          expect(
            mockDashboardService.applySignedConsents
          ).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('Link does not exist', () => {
      const mockConsentsTask = buildMockCompanionConsentsTask();

      beforeEach(() => {
        mockCompanionService.findLinkById.mockResolvedValue(null);
      });

      test(`should call applySignedConsents method in dashboard service`, async () => {
        await expect(
          service.applySignedConsents(mockConsentsTask)
        ).rejects.toBeInstanceOf(CompanionLinkNotFoundException);
      });
    });
  });
});
