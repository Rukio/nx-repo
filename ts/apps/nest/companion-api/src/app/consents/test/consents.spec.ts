import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { CommonModule } from '../../common/common.module';
import { ConsentsModule } from '../consents.module';
import { ConsentsController } from '../consents.controller';
import {
  buildMockConsent,
  buildMockSignedConsentRequest,
} from '../mocks/consent.mock';
import {
  Signature,
  SignatureType,
  SignerRelationToPatient,
} from '../dto/signature.dto';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CompanionAuthGuard } from '../../companion/companion-auth.guard';
import { mockCompanionAuthGuard } from '../../companion/mocks/companion-auth.guard.mock';
import { ConsentType, SignedConsentDto } from '../dto/consent.dto';
import { ConsentsRepository } from '../consents.repository';
import { CompanionService } from '../../companion/companion.service';
import { buildMockCompanionMedicationConsentTask } from '../../tasks/mocks/companion-task.mock';
import { mockCaravanAdapter } from '../../caravan/mocks/caravan.adapter.mock';
import { CaravanAdapter } from '../../caravan/caravan.adapter';
import { buildMockCaravanConsentDefinition } from '../../caravan/mocks/caravan.definition.mock';
import { buildMockConsentDefinition } from '../mocks/definition.mock';
import { buildMockCaravanConsentCapture } from '../../caravan/mocks/caravan.capture.mock';
import { buildMockCaravanConsentOptions } from '../../caravan/mocks/caravan.consent-options.mock';
import { buildMockOptions } from '../mocks/options.mock';
import { buildMockCreateCaptureRequestWithoutFile } from '../mocks/capture.mock';
import { TasksService } from '../../tasks/tasks.service';
import { mockTasksService } from '../../tasks/mocks/tasks.service.mock';
import { IMAGE_UPLOAD_TIMEOUT } from '../../../testUtils/jest.setup';
import { ConsentDefinitionsQuery } from '../dto/consent-definition-query.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as faker from 'faker';
import { ConsentDefinitionsQueryDto } from '../dto/consent-definitons-query-dto';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../../companion/mocks/segment.service.mock';
type ConsentRequestTestCase = {
  name: string;
  request: ReturnType<typeof buildMockSignedConsentRequest>;
};

const invalidTypedConsents: ConsentRequestTestCase[] = [
  {
    name: 'Invalid Signature Type',
    request: buildMockSignedConsentRequest({
      signature: { type: 'FAKE' as SignatureType },
    }),
  },
  {
    name: 'Invalid Consent Type',
    request: buildMockSignedConsentRequest({ type: 'FAKE' as ConsentType }),
  },
  {
    name: 'Invalid Signer Relation to Patient',
    request: buildMockSignedConsentRequest({
      signature: { signerRelationToPatient: 'FAKE' as SignerRelationToPatient },
    }),
  },
  {
    name: 'Invalid Signer Name',
    request: buildMockSignedConsentRequest({
      signature: { signerName: [] as never },
    }),
  },
  {
    name: 'Invalid Signed At',
    request: buildMockSignedConsentRequest({
      signature: { signedAt: [] as never },
    }),
  },
];

describe(`${ConsentsModule.name} API Tests`, () => {
  let app: INestApplication;
  let consentsRepository: ConsentsRepository;
  let companionService: CompanionService;
  let applySignedConsentSpy: jest.SpyInstance;
  let getDefinitionsSpy: jest.SpyInstance;
  let markMedicationHistoryConsentAppliedSpy: jest.SpyInstance;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConsentsModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideProvider(TasksService)
      .useValue(mockTasksService)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .overrideProvider(CaravanAdapter)
      .useValue(mockCaravanAdapter)
      .compile();

    consentsRepository = moduleRef.get<ConsentsRepository>(ConsentsRepository);
    applySignedConsentSpy = jest.spyOn(
      consentsRepository,
      'applySignedConsent'
    );
    getDefinitionsSpy = jest.spyOn(consentsRepository, 'getDefinitions');

    companionService = moduleRef.get<CompanionService>(CompanionService);
    markMedicationHistoryConsentAppliedSpy = jest.spyOn(
      companionService,
      'markMedicationHistoryConsentApplied'
    );

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true })); // < this is new
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    applySignedConsentSpy.mockClear();
    getDefinitionsSpy.mockClear();
    markMedicationHistoryConsentAppliedSpy.mockClear();
  });

  const mockCompanionLink = buildMockCompanionLink();

  const mockCareRequest = buildMockCareRequest({
    id: mockCompanionLink.careRequestId,
  });

  const basePath = `/companion/${mockCompanionLink.id}/consents`;
  const mockTypedConsent = buildMockConsent({
    signature: { type: SignatureType.TYPED },
  });
  const mockTypedConsentRequest =
    buildMockSignedConsentRequest(mockTypedConsent);
  const mockCompanionTask = buildMockCompanionMedicationConsentTask();

  describe(`${ConsentsController.prototype.submitSignedConsent.name}`, () => {
    const buildPath = (): string => `${basePath}/signed-consents`;

    beforeEach(() => {
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDatabaseService.companionTask.findMany.mockResolvedValue([
        mockCompanionTask,
      ]);
      mockDashboardService.applyPatientMedicationHistoryConsent.mockResolvedValue();
    });

    describe('Link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`should return ${HttpStatus.CREATED} for typed consent`, () => {
        return request(app.getHttpServer())
          .post(buildPath())
          .field(mockTypedConsentRequest)
          .expect(HttpStatus.CREATED)
          .expect(() => {
            expect(consentsRepository.applySignedConsent).toHaveBeenCalledTimes(
              1
            );
            expect(
              companionService.markMedicationHistoryConsentApplied
            ).toHaveBeenCalledTimes(1);
          });
      });

      for (const tc of invalidTypedConsents) {
        test(`should return ${HttpStatus.BAD_REQUEST} for ${tc.name}`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .field(tc.request)
            .expect(HttpStatus.BAD_REQUEST);
        });
      }

      describe(`${ConsentsRepository.prototype.applySignedConsent.name} throws error`, () => {
        beforeEach(() => {
          applySignedConsentSpy.mockRejectedValue(new Error());
        });

        test(`should throw ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .field(mockTypedConsentRequest)
            .expect(HttpStatus.INTERNAL_SERVER_ERROR)
            .expect(() => {
              expect(
                consentsRepository.applySignedConsent
              ).toHaveBeenCalledTimes(1);
              expect(
                companionService.markMedicationHistoryConsentApplied
              ).toHaveBeenCalledTimes(0);
            });
        });
      });

      describe(`${CompanionService.prototype.markMedicationHistoryConsentApplied.name} throws error`, () => {
        beforeEach(() => {
          applySignedConsentSpy.mockResolvedValue(undefined);
          markMedicationHistoryConsentAppliedSpy.mockRejectedValue(new Error());
        });

        test(`should throw ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .field(mockTypedConsentRequest)
            .expect(HttpStatus.INTERNAL_SERVER_ERROR)
            .expect(() => {
              expect(
                consentsRepository.applySignedConsent
              ).toHaveBeenCalledTimes(1);
              expect(
                companionService.markMedicationHistoryConsentApplied
              ).toHaveBeenCalledTimes(1);
            });
        });
      });
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns ${HttpStatus.NOT_FOUND} when companion link is not found`, () => {
        return request(app.getHttpServer())
          .post(buildPath())
          .field(mockTypedConsentRequest)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });

  describe(`${ConsentsController.prototype.getDefinitions.name}`, () => {
    const buildPath = (
      { signerId, incomplete }: { signerId?: number; incomplete?: boolean } = {
        signerId: 1,
      }
    ): string => {
      let path = `${basePath}/definitions?signerId=${signerId}`;

      if (typeof incomplete === 'boolean') {
        path += `&incomplete=${incomplete}`;
      }

      return path;
    };
    const incompleteDefinition = buildMockConsentDefinition();
    const completeDefinition = buildMockConsentDefinition();
    const incompleteCaravanDefinition =
      buildMockCaravanConsentDefinition(incompleteDefinition);
    const completeCaravanDefinition =
      buildMockCaravanConsentDefinition(completeDefinition);
    const completeCaravanCapture = buildMockCaravanConsentCapture({
      definitionId: completeDefinition.id,
    });

    beforeEach(() => {
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDatabaseService.companionTask.findMany.mockResolvedValue([
        mockCompanionTask,
      ]);
      mockCaravanAdapter.consents.getDefinitions.mockResolvedValue([
        incompleteCaravanDefinition,
        completeCaravanDefinition,
      ]);
      mockCaravanAdapter.consents.getCaptures.mockResolvedValue([
        completeCaravanCapture,
      ]);
    });

    describe('Link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
      });

      test(`should not filter out completed definitions with undefined incomplete query param`, () => {
        return request(app.getHttpServer())
          .get(buildPath())
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body).toHaveLength(2);
            expect(res.body).toStrictEqual(
              expect.arrayContaining([
                expect.objectContaining(completeDefinition),
              ])
            );
            expect(res.body).toStrictEqual(
              expect.arrayContaining([
                expect.objectContaining(incompleteDefinition),
              ])
            );
          });
      });

      test(`should not filter out completed definitions with incomplete query param as false`, () => {
        return request(app.getHttpServer())
          .get(buildPath({ incomplete: false, signerId: 1 }))
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body).toHaveLength(2);
            expect(res.body).toStrictEqual(
              expect.arrayContaining([
                expect.objectContaining(completeDefinition),
              ])
            );
            expect(res.body).toStrictEqual(
              expect.arrayContaining([
                expect.objectContaining(incompleteDefinition),
              ])
            );
          });
      });

      test(`should filter out completed definitions with incomplete query param as true`, () => {
        return request(app.getHttpServer())
          .get(buildPath({ incomplete: true, signerId: 1 }))
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body).toHaveLength(1);
            expect(res.body).toStrictEqual([
              expect.objectContaining(incompleteDefinition),
            ]);
          });
      });

      describe('Errors', () => {
        describe('Query parameters', () => {
          test(`should throw ${HttpStatus.BAD_REQUEST} for non-numeric signerId`, () => {
            return request(app.getHttpServer())
              .get(buildPath({ signerId: 'string' as never }))
              .expect(HttpStatus.BAD_REQUEST)
              .expect(() => {
                expect(consentsRepository.getDefinitions).toHaveBeenCalledTimes(
                  0
                );
              });
          });

          test(`should throw ${HttpStatus.BAD_REQUEST} for undefined signerId`, () => {
            return request(app.getHttpServer())
              .get(buildPath({}))
              .expect(HttpStatus.BAD_REQUEST)
              .expect(() => {
                expect(consentsRepository.getDefinitions).toHaveBeenCalledTimes(
                  0
                );
              });
          });
        });

        describe(`${ConsentsRepository.prototype.getDefinitions.name} throws error`, () => {
          beforeEach(() => {
            getDefinitionsSpy.mockRejectedValueOnce(new Error());
          });

          test(`should throw ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
            return request(app.getHttpServer())
              .get(buildPath())
              .expect(HttpStatus.INTERNAL_SERVER_ERROR)
              .expect(() => {
                expect(consentsRepository.getDefinitions).toHaveBeenCalledTimes(
                  1
                );
              });
          });
        });
      });
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns ${HttpStatus.NOT_FOUND} when companion link is not found`, () => {
        return request(app.getHttpServer())
          .get(buildPath())
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });

  describe(`${ConsentsController.prototype.getOptions.name}`, () => {
    const buildPath = (): string => `${basePath}/options`;
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
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockDatabaseService.companionTask.findMany.mockResolvedValue([
        mockCompanionTask,
      ]);
      mockCaravanAdapter.consents.getOptions.mockResolvedValue(
        mockCaravanOptions
      );
    });

    test(`should return options`, () => {
      return request(app.getHttpServer())
        .get(buildPath())
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(mockCaravanAdapter.consents.getOptions).toHaveBeenCalledTimes(
            1
          );
          expect(res.body).toStrictEqual(expect.objectContaining(mockOptions));
        });
    });
  });

  describe(`${ConsentsController.prototype.createConsentCapture.name}`, () => {
    const buildPath = (): string => `${basePath}/captures`;
    const captureRequestBody = buildMockCreateCaptureRequestWithoutFile();
    const mockCapturePlain = buildMockCaravanConsentCapture();
    const signaturePath =
      './ts/apps/nest/companion-api/src/testUtils/data/signature.jpg';
    const signatureMimeType = 'image/jpeg';

    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
      mockCaravanAdapter.consents.createCapture.mockResolvedValue(
        mockCapturePlain
      );
    });

    describe('Capture created successfully', () => {
      describe('Signature attached', () => {
        test(
          `should return created capture`,
          () => {
            return request(app.getHttpServer())
              .post(buildPath())
              .field(captureRequestBody)
              .attach('signatureImage', signaturePath, {
                contentType: signatureMimeType,
              })
              .expect(HttpStatus.CREATED)
              .expect(() => {
                expect(
                  mockCaravanAdapter.consents.createCapture
                ).toHaveBeenCalledTimes(1);
                expect(
                  mockTasksService.onConsentCaptured
                ).toHaveBeenCalledTimes(1);
              });
          },
          IMAGE_UPLOAD_TIMEOUT
        );
      });

      describe('Signature not attached', () => {
        test(`should raise an error`, () => {
          return request(app.getHttpServer())
            .post(buildPath())
            .field(captureRequestBody)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });
    });
  });
});

describe(`${ConsentDefinitionsQuery.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        active: true,
        state: 'CO',
        signerIds: ['1'],
        serviceLine: faker.datatype.number(),
        languageId: 1,
      };
      const dto = plainToInstance(ConsentDefinitionsQuery, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const body = {
        state: 'CO',
        signerIds: ['1'],
        serviceLine: faker.datatype.number(),
        languageId: 1,
      };
      const dto = plainToInstance(ConsentDefinitionsQuery, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        active: 'true',
        state: 'CO',
        signerIds: ['1'],
        serviceLine: faker.datatype.number(),
        languageId: 1,
      };
      const dto = plainToInstance(ConsentDefinitionsQuery, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'active must be a boolean value'
      );
    });
  });
});

describe(`${ConsentDefinitionsQueryDto.name}`, () => {
  describe('transformers', () => {
    test('it converts string "true" to boolean', async () => {
      const body = {
        incomplete: 'true',
        signerId: faker.datatype.number().toString(),
      };
      const dto = plainToInstance(ConsentDefinitionsQueryDto, body);

      expect(dto.incomplete).toEqual(true);
    });
  });

  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        incomplete: true,
        signerId: faker.datatype.number().toString(),
      };
      const dto = plainToInstance(ConsentDefinitionsQueryDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const body = {
        signerId: faker.datatype.number().toString(),
      };
      const dto = plainToInstance(ConsentDefinitionsQueryDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        incomplete: true,
        signerId: 'non-number string',
      };
      const dto = plainToInstance(ConsentDefinitionsQueryDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'signerId must be a number string'
      );
    });
  });
});

describe(`${SignedConsentDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        type: 'MEDICATION_HISTORY_AUTHORITY',
        signature: {
          type: 'TYPED',
          signerName: 'First Last',
          signerRelationToPatient: 'PATIENT',
          signedAt: '2021-07-08T20:39:08.305Z',
        },
      };
      const dto = plainToInstance(SignedConsentDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        type: 'MEDICATION_HISTORY_AUTHORITY',
      };
      const dto = plainToInstance(SignedConsentDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('signature must be an object');
    });
  });
});

describe(`${Signature.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        type: 'TYPED',
        signerName: 'First Last',
        signerRelationToPatient: 'PATIENT',
        signedAt: '2021-07-08T20:39:08.305Z',
      };
      const dto = plainToInstance(Signature, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        type: 'INVALID',
        signerName: 'First Last',
        signerRelationToPatient: 'PATIENT',
        signedAt: '2021-07-08T20:39:08.305Z',
      };
      const dto = plainToInstance(Signature, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'type must be one of the following values'
      );
    });
  });
});
