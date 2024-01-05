import { HttpStatus, INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { rest } from 'msw';
import { SetupServer, setupServer } from 'msw/node';
import {
  ATHENA_PREVIEW_MEDICATION_CONSENT_ERROR,
  DashboardService,
} from '../dashboard.service';
import { DashboardModule } from '../dashboard.module';
import { buildMockDashboardPatient } from '../mocks/dashboard-patient.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import {
  buildMockDashboardCareRequest,
  buildMockDashboardCareRequestNote,
} from '../mocks/dashboard-care-request.mock';
import { mockCache } from '../../common/mocks/cache.mock';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { DatabaseService } from '../../database/database.service';
import { mockAuthService } from '../../auth/mocks';
import { buildMockDriversLicenseUploadResponse } from '../mocks/drivers-license-upload-response.mock';
import { buildMockDashboardInsurance } from '../../dashboard/mocks/dashboard-insurance.mock';
import { DashboardInsurance } from '../../dashboard/types/dashboard-insurance';
import { mockDeep } from 'jest-mock-extended';
import { InsuranceCardType } from '../../insurances/interfaces/insurance_card_type.interface';
import { DashboardClinicalProvider } from '../types/dashboard-clinical-provider';
import { buildMockDashboardClinicalProvider } from '../mocks/dashboard-clinical-provider.mock';
import { buildMockClinicalProviderSearchDto } from '../../clinical-providers/mocks/clinical-providers.mocks';
import { buildMockDefaultPharmacy } from '../../pharmacies/mocks/pharmacy.mocks';
import { HttpService } from '@nestjs/axios';
import { buildMockDashboardPharmacy } from '../mocks/dashboard-pharmacy.mock';
import { buildMockDashboardPrimaryCareProvider } from '../mocks/dashboard-primary-care-provider.mock';
import { buildMockPrimaryCareProvider } from '../../pcp/mock/pcp.mock';
import { isAxiosError } from '@nestjs/terminus/dist/utils';
import { ClinicalProviderSearchRequest } from '../types/clinical-provider-request';
import { DriversLicenseUploadRequest } from '../types/drivers-license-upload-request';
import { buildMockConsent } from '../../consents/mocks/consent.mock';
import { buildMockDashboardMedicationHistoryConsentStatus } from '../mocks/dashboard-medication-history-consent-status.mock';
import { CommonModule } from '../../common/common.module';
import { buildMockQuestionAnswer } from '../../social-history/mocks/question-answer.mock';
import { QuestionTag } from '../../social-history/dto/question-answer.dto';
import { VALID_YES_ANSWER } from '../../social-history/common/constants';
import { buildMockDashboardSocialHistory } from '../mocks/social-history.mock';
import { AuthService } from '@*company-data-covered*/nest/auth';
import {
  DashboardCareRequestNoteUpsert,
  DashboardCareRequestNoteListResponse,
} from '../types/dashboard-care-request-note';
import {
  CARE_REQUEST_NOTE_DEFAULT_TITLE,
  CARE_REQUEST_NOTE_DEFAULT_TYPE,
} from '../../companion/common/companion.constants';
import { buildMockCareTeamEta } from '../mocks/care-team-eta.mock';

describe(`${DashboardService.name}`, () => {
  let app: INestApplication;
  let dashboardService: DashboardService;
  let httpService: HttpService;
  let server: SetupServer;
  const basePath = process.env.STATION_URL;

  const mockDashboardPatient = buildMockDashboardPatient(true);

  const mockDashboardCareRequest = buildMockDashboardCareRequest({
    patient: mockDashboardPatient,
  });

  const mockCareRequest = mockDashboardCareRequest.toCareRequestDto();

  // setup module
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DashboardModule, CommonModule],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(mockCache)
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    dashboardService = moduleRef.get<DashboardService>(DashboardService);
    httpService = moduleRef.get<HttpService>(HttpService);

    jest.spyOn(httpService, 'post');
    jest.spyOn(httpService, 'patch');
    jest.spyOn(httpService, 'get');

    app = moduleRef.createNestApplication();
    await app.init();

    // Enable API mocking before tests.
    server = setupServer();
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterAll(async () => {
    await app.close();

    // Disable API mocking after the tests are done.
    server.close();
  });

  beforeEach(() => {
    mockDatabaseService.dashboardAuth.findFirst.mockResolvedValue({
      accessToken: 'abc123',
      expiration: new Date(),
    });
  });

  const mockDashboardDriversLicense = buildMockDriversLicenseUploadResponse();
  const mockSocialHistory = buildMockDashboardSocialHistory();

  const mockCareTeamEta = buildMockCareTeamEta();

  describe(`${DashboardService.prototype.markAsHealthy.name}`, () => {
    test(`Sets healthCacheKey to true`, async () => {
      await dashboardService.markAsHealthy();

      expect(mockCache.set).toHaveBeenCalledWith(
        dashboardService.healthCheckKey,
        true,
        {
          ttl: 0,
        }
      );
    });
  });

  describe(`${DashboardService.prototype.markAsUnhealthy.name}`, () => {
    test(`Sets healthCacheKey to false`, async () => {
      await dashboardService.markAsUnhealthy();

      expect(mockCache.set).toHaveBeenCalledWith(
        dashboardService.healthCheckKey,
        false,
        {
          ttl: 0,
        }
      );
    });
  });

  describe(`${DashboardService.prototype.isHealthy.name}`, () => {
    test(`Gets healthCacheKey from cache`, async () => {
      await dashboardService.isHealthy();

      expect(mockCache.get).toHaveBeenCalledWith(
        dashboardService.healthCheckKey
      );
    });
  });

  describe(`basePath getter`, () => {
    test(`returns base path`, async () => {
      expect(dashboardService.basePath).toStrictEqual(basePath);
    });
  });

  describe(`isProdDashboard getter`, () => {
    test(`returns true for prod URL`, async () => {
      jest
        .spyOn(dashboardService, 'basePath', 'get')
        .mockReturnValueOnce('https://admin.*company-data-covered*.com');
      expect(dashboardService.isProdDashboard).toStrictEqual(true);
    });

    test(`returns false for non-prod URL`, async () => {
      jest
        .spyOn(dashboardService, 'basePath', 'get')
        .mockReturnValueOnce('https://qa.*company-data-covered*.com');
      expect(dashboardService.isProdDashboard).toStrictEqual(false);
    });
  });

  describe(`${DashboardService.prototype.getCareRequestById.name}`, () => {
    const mockPath = `${basePath}/api/care_requests/:careRequestId`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockDashboardCareRequest)
            );
          })
        );
      });

      test('Returns care request', async () => {
        const result = await dashboardService.getCareRequestById(
          mockCareRequest.id
        );

        expect(result).toStrictEqual(
          JSON.parse(JSON.stringify(mockCareRequest))
        ); // need to stringify and parse because of Date.
      });
    });

    describe(`Dashboard responds with ${HttpStatus.BAD_REQUEST}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.BAD_REQUEST));
          })
        );
      });

      test('Throws error', async () => {
        await expect(
          dashboardService.getCareRequestById(mockCareRequest.id)
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('Returns null', async () => {
        const result = await dashboardService.getCareRequestById(
          mockCareRequest.id
        );

        expect(result).toBeNull();
      });
    });
  });

  describe(`${DashboardService.prototype.getDriversLicenseByPatientId.name}`, () => {
    const mockPath = `${basePath}/api/patients/:patientId/driver_licenses`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockDashboardDriversLicense)
            );
          })
        );
      });

      test('Returns drivers license model', async () => {
        const result = await dashboardService.getDriversLicenseByPatientId(
          mockDashboardPatient.id
        );

        expect(result).toStrictEqual(mockDashboardDriversLicense);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.BAD_REQUEST}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.BAD_REQUEST));
          })
        );
      });

      test('Throws error', async () => {
        await expect(
          dashboardService.getDriversLicenseByPatientId(mockDashboardPatient.id)
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('Returns null', async () => {
        const result = await dashboardService.getDriversLicenseByPatientId(
          mockDashboardPatient.id
        );

        expect(result).toBeNull();
      });
    });
  });

  describe(`${DashboardService.prototype.uploadPatientDriversLicense.name}`, () => {
    const mockFile = mockDeep<Express.Multer.File>();
    const mockGetPath = `${basePath}/api/patients/:patientId/driver_licenses`;
    const mockCreatePath = mockGetPath;
    const mockUpdatePath = `${basePath}/api/patients/:patientId/driver_licenses/:driversLicenseId`;

    describe('Drivers license does not exist', () => {
      beforeEach(() => {
        server.use(
          rest.get(mockGetPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.OK));
          })
        );
      });

      describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
        beforeEach(() => {
          server.use(
            rest.post(mockCreatePath, (req, res, ctx) => {
              return res.once(
                ctx.status(HttpStatus.OK),
                ctx.json(mockDashboardDriversLicense)
              );
            })
          );
        });

        test('should use create endpoint', async () => {
          await dashboardService.uploadPatientDriversLicense(
            mockDashboardPatient.id,
            mockFile
          );

          expect(httpService.post).toBeCalledTimes(1);
        });
      });
    });

    describe('Drivers license exists', () => {
      beforeEach(() => {
        server.use(
          rest.get(mockGetPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockDashboardDriversLicense)
            );
          })
        );
      });

      describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
        beforeEach(() => {
          server.use(
            rest.patch(mockUpdatePath, (req, res, ctx) => {
              return res.once(
                ctx.status(HttpStatus.OK),
                ctx.json(mockDashboardDriversLicense)
              );
            })
          );
        });

        test('Returns nothing', async () => {
          const result = await dashboardService.uploadPatientDriversLicense(
            mockDashboardPatient.id,
            mockFile
          );

          expect(result).toBeUndefined();
        });

        test('should use update endpoint', async () => {
          const expectedBody: DriversLicenseUploadRequest = {
            driver_license: {
              license: expect.any(String),
              image_requires_verification: true,
            },
          };

          await dashboardService.uploadPatientDriversLicense(
            mockDashboardPatient.id,
            mockFile
          );

          expect(httpService.patch).toHaveBeenLastCalledWith(
            expect.any(String),
            expectedBody,
            expect.any(Object)
          );
        });
      });

      describe(`Dashboard responds with ${HttpStatus.BAD_REQUEST}`, () => {
        beforeEach(() => {
          server.use(
            rest.patch(mockUpdatePath, (req, res, ctx) => {
              return res.once(ctx.status(HttpStatus.BAD_REQUEST));
            })
          );
        });

        test('Throws error', async () => {
          await expect(
            dashboardService.uploadPatientDriversLicense(
              mockDashboardPatient.id,
              mockFile
            )
          ).rejects.toBeInstanceOf(Error);
        });
      });

      describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
        beforeEach(() => {
          server.use(
            rest.patch(mockUpdatePath, (req, res, ctx) => {
              return res.once(ctx.status(HttpStatus.NOT_FOUND));
            })
          );
        });

        test('Returns null', async () => {
          const result = await dashboardService.uploadPatientDriversLicense(
            mockDashboardPatient.id,
            mockFile
          );

          expect(result).toBeNull();
        });
      });
    });
  });

  describe(`${DashboardService.prototype.deleteDriversLicenseById.name}`, () => {
    const mockPath = `${basePath}/api/patients/:patientId/driver_licenses/:driversLicenseId`;

    describe(`Dashboard responds with ${HttpStatus.NO_CONTENT}`, () => {
      beforeEach(() => {
        server.use(
          rest.delete(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      test('Returns nothing', async () => {
        const result = await dashboardService.deleteDriversLicenseById(
          mockDashboardPatient.id,
          mockDashboardDriversLicense.id
        );

        expect(result).toBeUndefined();
      });
    });

    describe(`Dashboard responds with ${HttpStatus.BAD_REQUEST}`, () => {
      beforeEach(() => {
        server.use(
          rest.delete(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.BAD_REQUEST));
          })
        );
      });

      test('Throws error', async () => {
        await expect(
          dashboardService.deleteDriversLicenseById(
            mockDashboardPatient.id,
            mockDashboardDriversLicense.id
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${DashboardService.prototype.getPatientInsurances.name}`, () => {
    const mockDashboardInsurance: DashboardInsurance =
      buildMockDashboardInsurance();
    const mockDashboardInsurances: DashboardInsurance[] = [
      mockDashboardInsurance,
    ];
    const mockPath = `${basePath}/api/patients/:patientId/insurances`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockDashboardInsurances)
            );
          })
        );
      });

      test('Returns insurances', async () => {
        const result = await dashboardService.getPatientInsurances(
          mockDashboardPatient.id
        );

        expect(result).toStrictEqual(mockDashboardInsurances);
      });
    });
  });

  describe(`${DashboardService.prototype.uploadInsurance.name}`, () => {
    const mockCareRequest = buildMockCareRequest();
    const mockDashboardInsurance: DashboardInsurance =
      buildMockDashboardInsurance();
    const mockPath = `${basePath}/api/patients/:patientId/care_requests/:careRequestId/insurances/:insuranceId`;
    const mockFile = mockDeep<Express.Multer.File>();
    const image_requires_verification = true;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.OK));
          })
        );
      });

      test('should send both images to dashboard', async () => {
        const result = await dashboardService.uploadInsurance(
          mockDashboardPatient.id,
          mockCareRequest.id,
          mockDashboardInsurance.id,
          mockFile,
          mockFile
        );

        expect(result).toBeUndefined();
        expect(httpService.patch).toHaveBeenLastCalledWith(
          expect.any(String),
          {
            insurance: {
              card_front: expect.any(String),
              card_back: expect.any(String),
              image_requires_verification,
            },
          },
          expect.any(Object)
        );
      });

      test('should send just back image to station', async () => {
        const result = await dashboardService.uploadInsurance(
          mockDashboardPatient.id,
          mockCareRequest.id,
          mockDashboardInsurance.id,
          undefined,
          mockFile
        );

        expect(result).toBeUndefined();
        expect(httpService.patch).toHaveBeenLastCalledWith(
          expect.any(String),
          {
            insurance: {
              card_front: undefined,
              card_back: expect.any(String),
              image_requires_verification,
            },
          },
          expect.any(Object)
        );
      });

      test('should send just front image to station', async () => {
        const result = await dashboardService.uploadInsurance(
          mockDashboardPatient.id,
          mockCareRequest.id,
          mockDashboardInsurance.id,
          mockFile,
          undefined
        );

        expect(result).toBeUndefined();
        expect(httpService.patch).toHaveBeenLastCalledWith(
          expect.any(String),
          {
            insurance: {
              card_front: expect.any(String),
              card_back: undefined,
              image_requires_verification,
            },
          },
          expect.any(Object)
        );
      });
    });
  });

  describe(`${DashboardService.prototype.deleteInsuranceImageByType.name}`, () => {
    const mockDashboardInsurance: DashboardInsurance =
      buildMockDashboardInsurance();
    const mockPath = `${basePath}/api/patients/:patientId/care_requests/:careRequestId/insurances/:insuranceId`;

    describe(`Dashboard responds with ${HttpStatus.NO_CONTENT}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      test('should delete card back only', async () => {
        const result = await dashboardService.deleteInsuranceImageByType(
          mockDashboardPatient.id,
          mockCareRequest.id,
          mockDashboardInsurance.id,
          InsuranceCardType.RemoveCardBack
        );

        expect(httpService.patch).toHaveBeenLastCalledWith(
          expect.any(String),
          {
            insurance: {
              remove_card_front: false,
              remove_card_back: true,
            },
          },
          expect.any(Object)
        );
        expect(result).toBeUndefined();
      });

      test('should delete card front only', async () => {
        const result = await dashboardService.deleteInsuranceImageByType(
          mockDashboardPatient.id,
          mockCareRequest.id,
          mockDashboardInsurance.id,
          InsuranceCardType.RemoveCardFront
        );

        expect(httpService.patch).toHaveBeenLastCalledWith(
          expect.any(String),
          {
            insurance: {
              remove_card_front: true,
              remove_card_back: false,
            },
          },
          expect.any(Object)
        );
        expect(result).toBeUndefined();
      });

      test('should delete both card images', async () => {
        const result = await dashboardService.deleteInsuranceImageByType(
          mockDashboardPatient.id,
          mockCareRequest.id,
          mockDashboardInsurance.id,
          InsuranceCardType.RemoveBothCards
        );

        expect(httpService.patch).toHaveBeenLastCalledWith(
          expect.any(String),
          {
            insurance: {
              remove_card_front: true,
              remove_card_back: true,
            },
          },
          expect.any(Object)
        );
        expect(result).toBeUndefined();
      });
    });
  });

  describe(`${DashboardService.prototype.setDefaultPharmacy.name}`, () => {
    const mockDefaultPharmacy = buildMockDefaultPharmacy();
    const mockPath = `${basePath}/api/patients/:patientId/default_pharmacy`;

    describe(`Dashboard responds with ${HttpStatus.NO_CONTENT}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      test('Returns nothing', async () => {
        const result = await dashboardService.setDefaultPharmacy(
          mockDashboardPatient.id,
          mockDefaultPharmacy.defaultPharmacy
        );

        expect(result).toBeUndefined();
      });
    });
  });

  describe(`${DashboardService.prototype.getDefaultPharmacyByPatientId.name}`, () => {
    const mockDashboardPharmacy = buildMockDashboardPharmacy();
    const mockPath = `${basePath}/api/patients/:patientId/default_pharmacy`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockDashboardPharmacy)
            );
          })
        );
      });

      test('Returns pharmacy', async () => {
        const result = await dashboardService.getDefaultPharmacyByPatientId(
          mockDashboardPatient.id
        );

        expect(result).toStrictEqual(mockDashboardPharmacy);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.BAD_REQUEST}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.BAD_REQUEST));
          })
        );
      });

      test('Throws error', async () => {
        await expect(
          dashboardService.getDefaultPharmacyByPatientId(
            mockDashboardPatient.id
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('Returns null', async () => {
        const result = await dashboardService.getDefaultPharmacyByPatientId(
          mockDashboardPatient.id
        );

        expect(result).toBeNull();
      });
    });
  });

  describe(`${DashboardService.prototype.searchClinicalProviders.name}`, () => {
    const mockClinicalProvider = buildMockClinicalProviderSearchDto();
    const mockDashboardClinicalProvider: DashboardClinicalProvider =
      buildMockDashboardClinicalProvider();
    const mockDashboardClinicalProviders: DashboardClinicalProvider[] = [
      mockDashboardClinicalProvider,
    ];
    const mockPath = `${basePath}/api/clinical_providers/search`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      const status = HttpStatus.OK;

      describe(`Search has results`, () => {
        beforeEach(() => {
          server.use(
            rest.post(mockPath, (req, res, ctx) => {
              return res.once(
                ctx.status(status),
                ctx.json(mockDashboardClinicalProviders)
              );
            })
          );
        });

        test('Returns clinical providers information.', async () => {
          const {
            entityName,
            firstName,
            lastName,
            zip,
            limit,
            offset,
            distanceMiles,
          } = mockClinicalProvider.clinicalProvider;
          const expectedBody: ClinicalProviderSearchRequest = {
            clinical_provider: {
              name: entityName,
              first_name: firstName,
              last_name: lastName,
              zip,
              distance_mi: distanceMiles,
              limit,
              offset,
            },
          };

          const result = await dashboardService.searchClinicalProviders(
            mockClinicalProvider.clinicalProvider
          );

          expect(result).toStrictEqual(mockDashboardClinicalProviders);
          expect(httpService.post).toHaveBeenLastCalledWith(
            expect.any(String),
            expectedBody,
            expect.any(Object)
          );
        });
      });

      describe(`Search has empty results`, () => {
        beforeEach(() => {
          server.use(
            rest.post(mockPath, (req, res, ctx) => {
              return res.once(ctx.status(status), ctx.json([]));
            })
          );
        });

        test('Returns an empty response.', async () => {
          const result = await dashboardService.searchClinicalProviders(
            mockClinicalProvider.clinicalProvider
          );

          expect(result).toStrictEqual([]);
        });
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.post(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND), ctx.json([]));
          })
        );
      });

      test('Returns an empty response.', async () => {
        const result = await dashboardService.searchClinicalProviders(
          mockClinicalProvider.clinicalProvider
        );

        expect(result).toStrictEqual([]);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.FORBIDDEN}`, () => {
      beforeEach(() => {
        server.use(
          rest.post(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.FORBIDDEN),
              ctx.json('You are not authorized to access this page')
            );
          })
        );
      });

      test('Returns an forbidden exception from Station.', async () => {
        let errMsg = '';

        try {
          await dashboardService.searchClinicalProviders(
            mockClinicalProvider.clinicalProvider
          );
        } catch (error) {
          if (error && isAxiosError(error) && error.response) {
            errMsg = error.response.data;
          }
        }
        expect(errMsg).toStrictEqual(
          'You are not authorized to access this page'
        );
      });
    });
  });

  describe(`${DashboardService.prototype.setPrimaryCareProvider.name}`, () => {
    const mockPrimaryCareProvider = buildMockPrimaryCareProvider();
    const mockPath = `${basePath}/api/patients/:patientId/care_requests/:careRequestId/care_team/save_primary_care_provider/:clinicalProviderId`;

    describe(`Dashboard responds with ${HttpStatus.UNPROCESSABLE_ENTITY}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.UNPROCESSABLE_ENTITY));
          })
        );
      });

      test('Returns nothing', async () => {
        let statusCode = 0;

        try {
          await dashboardService.setPrimaryCareProvider(
            mockCareRequest.id,
            mockCareRequest.patientId,
            mockPrimaryCareProvider.clinicalProvider
          );
        } catch (error) {
          if (error && isAxiosError(error) && error.response) {
            statusCode = error.response.status;
          }
        }
        expect(statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NO_CONTENT}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      test('Returns nothing', async () => {
        const result = await dashboardService.setPrimaryCareProvider(
          mockCareRequest.id,
          mockCareRequest.patientId,
          mockPrimaryCareProvider.clinicalProvider
        );

        expect(result).toBeUndefined();
      });
    });
  });

  describe(`${DashboardService.prototype.getPrimaryCareProviderEhrIdByPatientId.name}`, () => {
    const mockPcp = buildMockDashboardPrimaryCareProvider();
    const mockPath = `${basePath}/api/patients/:patientId/primary_care_provider`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      const responseStatus = HttpStatus.OK;

      describe('Patient has PCP', () => {
        beforeEach(() => {
          server.use(
            rest.get(mockPath, (req, res, ctx) => {
              return res.once(ctx.status(responseStatus), ctx.json(mockPcp));
            })
          );
        });

        test('should return primary care provider', async () => {
          const result =
            await dashboardService.getPrimaryCareProviderEhrIdByPatientId(
              mockDashboardPatient.id
            );

          expect(result).toStrictEqual(
            mockPcp.primaryCareProvider.clinicalProviderId
          );
        });
      });

      describe('Patient does not have PCP', () => {
        const mockEmptyPcpCases = [
          buildMockDashboardPrimaryCareProvider({
            patient_has_pcp: null,
            primaryCareProvider: {},
          }),
          buildMockDashboardPrimaryCareProvider({
            patient_has_pcp: null,
            primaryCareProvider: undefined,
          }),
        ];

        for (const mockEmptyPcp of mockEmptyPcpCases) {
          beforeEach(() => {
            server.use(
              rest.get(mockPath, (req, res, ctx) => {
                return res.once(
                  ctx.status(responseStatus),
                  ctx.json(mockEmptyPcp)
                );
              })
            );
          });

          describe(`response is ${JSON.stringify(mockEmptyPcp)}`, () => {
            test('should return null', async () => {
              const result =
                await dashboardService.getPrimaryCareProviderEhrIdByPatientId(
                  mockDashboardPatient.id
                );

              expect(result).toBeNull();
            });
          });
        }
      });
    });

    describe(`Dashboard responds with ${HttpStatus.BAD_REQUEST}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.BAD_REQUEST));
          })
        );
      });

      test('Throws error', async () => {
        await expect(
          dashboardService.getPrimaryCareProviderEhrIdByPatientId(
            mockDashboardPatient.id
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('Returns null', async () => {
        const result =
          await dashboardService.getPrimaryCareProviderEhrIdByPatientId(
            mockDashboardPatient.id
          );

        expect(result).toBeNull();
      });
    });
  });

  describe(`${DashboardService.prototype.applyPatientMedicationHistoryConsent.name}`, () => {
    const mockSignedConsentDto = buildMockConsent();
    const mockPath = `${basePath}/api/patients/:patientId/consent_to_medication_history`;

    describe(`Dashboard responds with ${HttpStatus.NO_CONTENT}`, () => {
      beforeEach(() => {
        server.use(
          rest.put(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      test('Returns nothing', async () => {
        const result =
          await dashboardService.applyPatientMedicationHistoryConsent(
            mockCareRequest.patientId,
            mockSignedConsentDto
          );

        expect(result).toBeUndefined();
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      describe('Is AthenaPreview error', () => {
        beforeEach(() => {
          server.use(
            rest.put(mockPath, (req, res, ctx) => {
              return res.once(
                ctx.status(HttpStatus.INTERNAL_SERVER_ERROR),
                ctx.json({ error: ATHENA_PREVIEW_MEDICATION_CONSENT_ERROR })
              );
            })
          );
        });

        describe('Is prod dashboard', () => {
          beforeEach(() => {
            jest
              .spyOn(dashboardService, 'isProdDashboard', 'get')
              .mockReturnValueOnce(true);
          });

          test('should throw error', async () => {
            await expect(
              dashboardService.applyPatientMedicationHistoryConsent(
                mockCareRequest.patientId,
                mockSignedConsentDto
              )
            ).rejects.toBeInstanceOf(Error);
          });
        });

        describe('Is non-prod dashboard', () => {
          beforeEach(() => {
            jest
              .spyOn(dashboardService, 'isProdDashboard', 'get')
              .mockReturnValueOnce(false);
          });

          test('should throw error', async () => {
            const result =
              await dashboardService.applyPatientMedicationHistoryConsent(
                mockCareRequest.patientId,
                mockSignedConsentDto
              );

            expect(result).toBeUndefined();
          });
        });
      });

      describe('Is not AthenaPreview error', () => {
        beforeEach(() => {
          server.use(
            rest.put(mockPath, (req, res, ctx) => {
              return res.once(
                ctx.status(HttpStatus.INTERNAL_SERVER_ERROR),
                ctx.json({ error: 'ahhhhhhhhh error oh no' })
              );
            })
          );
        });

        describe('Is prod dashboard', () => {
          beforeEach(() => {
            jest
              .spyOn(dashboardService, 'isProdDashboard', 'get')
              .mockReturnValueOnce(true);
          });

          test('should throw error', async () => {
            await expect(
              dashboardService.applyPatientMedicationHistoryConsent(
                mockCareRequest.patientId,
                mockSignedConsentDto
              )
            ).rejects.toBeInstanceOf(Error);
          });
        });

        describe('Is non-prod dashboard', () => {
          beforeEach(() => {
            jest
              .spyOn(dashboardService, 'isProdDashboard', 'get')
              .mockReturnValueOnce(false);
          });

          test('should throw error', async () => {
            await expect(
              dashboardService.applyPatientMedicationHistoryConsent(
                mockCareRequest.patientId,
                mockSignedConsentDto
              )
            ).rejects.toBeInstanceOf(Error);
          });
        });
      });
    });

    const errorStates = [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNPROCESSABLE_ENTITY,
    ];

    for (const errorState of errorStates) {
      describe(`Dashboard responds with ${errorState}`, () => {
        beforeEach(() => {
          server.use(
            rest.put(mockPath, (req, res, ctx) => {
              return res.once(ctx.status(errorState));
            })
          );
        });

        test('should throw error', async () => {
          await expect(
            dashboardService.applyPatientMedicationHistoryConsent(
              mockDashboardPatient.id,
              mockSignedConsentDto
            )
          ).rejects.toBeInstanceOf(Error);
        });
      });
    }
  });

  describe(`${DashboardService.prototype.getPatientMedicationHistoryConsentStatus.name}`, () => {
    const status = false;
    const mockMedicationHistoryStatus =
      buildMockDashboardMedicationHistoryConsentStatus({
        medication_history_consent: status,
      });
    const mockPath = `${basePath}/api/patients/:patientId/consent_to_medication_history`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockMedicationHistoryStatus)
            );
          })
        );
      });

      test('should return medication history status value', async () => {
        const result =
          await dashboardService.getPatientMedicationHistoryConsentStatus(
            mockDashboardPatient.id
          );

        expect(result).toStrictEqual(status);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.BAD_REQUEST}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.BAD_REQUEST));
          })
        );
      });

      test('should throw error', async () => {
        await expect(
          dashboardService.getPatientMedicationHistoryConsentStatus(
            mockDashboardPatient.id
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('should return null', async () => {
        const result =
          await dashboardService.getPatientMedicationHistoryConsentStatus(
            mockDashboardPatient.id
          );

        expect(result).toBeNull();
      });
    });
  });

  describe(`${DashboardService.prototype.updatePatientSocialHistory.name}`, () => {
    const mockCareRequest = buildMockCareRequest();
    const mockPath = `${basePath}/api/patients/:patientId/social_history/update`;
    const questionKey = 'LOCAL.227';

    describe(`Dashboard responds with ${HttpStatus.NO_CONTENT}`, () => {
      const mockQuestionAnswer = buildMockQuestionAnswer(
        QuestionTag.HAS_PCP,
        VALID_YES_ANSWER
      );

      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      test('Returns nothing', async () => {
        const result = await dashboardService.updatePatientSocialHistory(
          mockCareRequest.patientId,
          questionKey,
          mockQuestionAnswer.answer
        );

        expect(result).toBeUndefined();
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      const mockInvalidQuestionAnswer = buildMockQuestionAnswer(
        QuestionTag.HAS_PCP,
        'Maybe'
      );
      const invalidAnswerError = {
        error: "The answer to 'LOCAL.247' must be: Y or N",
      };

      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.INTERNAL_SERVER_ERROR),
              ctx.json(invalidAnswerError)
            );
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.updatePatientSocialHistory(
            mockCareRequest.patientId,
            questionKey,
            mockInvalidQuestionAnswer.answer
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${DashboardService.prototype.getPatientSocialHistory.name}`, () => {
    const mockCareRequest = buildMockCareRequest();
    const mockPath = `${basePath}/api/patients/:patientId/social_history`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockSocialHistory)
            );
          })
        );
      });

      test('Returns social history', async () => {
        const result = await dashboardService.getPatientSocialHistory(
          mockCareRequest.patientId
        );

        expect(result).toStrictEqual(mockSocialHistory);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.INTERNAL_SERVER_ERROR));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.getPatientSocialHistory(mockCareRequest.patientId)
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${DashboardService.prototype.applySignedConsents.name}`, () => {
    const mockCareRequest = buildMockCareRequest();
    const mockPath = `${basePath}/api/care_requests/${mockCareRequest.id}/apply_signed_consents`;

    describe(`Dashboard responds with ${HttpStatus.NO_CONTENT}`, () => {
      beforeEach(() => {
        server.use(
          rest.post(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      test('Returns nothing', async () => {
        const result = await dashboardService.applySignedConsents(
          mockCareRequest.id
        );

        expect(result).toBeUndefined();
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.INTERNAL_SERVER_ERROR));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.applySignedConsents(mockCareRequest.id)
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${DashboardService.prototype.createNoteForCareRequest.name}`, () => {
    const mockCareRequestID = 123;
    const mockPath = `${basePath}/api/care_requests/${mockCareRequestID}/notes`;
    const note: DashboardCareRequestNoteUpsert = {
      meta_data: {
        companionTasks: [
          'ID',
          'Consents',
          'Insurance',
          'PCP',
          'Pharmacy',
          'Medication History Consent',
        ],
        completeCompanionTasks: ['Consents'],
      },
      care_request_id: mockCareRequestID,
      note: CARE_REQUEST_NOTE_DEFAULT_TITLE,
      note_type: CARE_REQUEST_NOTE_DEFAULT_TYPE,
    };

    describe(`Dashboard responds with ${HttpStatus.CREATED}`, () => {
      beforeEach(() => {
        server.use(
          rest.post(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.CREATED));
          })
        );
      });

      test('Returns nothing', async () => {
        const result = await dashboardService.createNoteForCareRequest(
          mockCareRequestID,
          note
        );

        expect(result).toBeUndefined();
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      beforeEach(() => {
        server.use(
          rest.post(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.INTERNAL_SERVER_ERROR));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.createNoteForCareRequest(mockCareRequestID, note)
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.post(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.createNoteForCareRequest(mockCareRequestID, note)
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${DashboardService.prototype.getNotesForCareRequest.name}`, () => {
    const mockCareRequestID = 123;
    const mockPath = `${basePath}/api/care_requests/${mockCareRequestID}/notes`;
    const mockCareRequestNoteList: DashboardCareRequestNoteListResponse = [
      buildMockDashboardCareRequestNote(),
    ];

    describe(`Care request has notes`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockCareRequestNoteList)
            );
          })
        );
      });

      test('Returns a list of notes', async () => {
        const result = await dashboardService.getNotesForCareRequest(
          mockCareRequestID
        );

        expect(result).not.toBeNull();
        expect(result?.length).toBe(1);
      });
    });

    describe(`Care request has no notes`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.OK), ctx.json([]));
          })
        );
      });

      test('Returns an empty response', async () => {
        const result = await dashboardService.getNotesForCareRequest(
          mockCareRequestID
        );

        expect(result).toStrictEqual([]);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.INTERNAL_SERVER_ERROR));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.getNotesForCareRequest(mockCareRequestID)
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.getNotesForCareRequest(mockCareRequestID)
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${DashboardService.prototype.updateNoteForCareRequest.name}`, () => {
    const mockCareRequestID = 123;
    const mockNoteID = 321;
    const mockPath = `${basePath}/api/care_requests/${mockCareRequestID}/notes/${mockNoteID}`;

    const note: DashboardCareRequestNoteUpsert = {
      meta_data: {
        companionTasks: ['ID', 'Insurance', 'PCP', 'Pharmacy'],
        completeCompanionTasks: ['PCP'],
      },
      care_request_id: mockCareRequestID,
      note: CARE_REQUEST_NOTE_DEFAULT_TITLE,
      note_type: CARE_REQUEST_NOTE_DEFAULT_TYPE,
    };

    describe(`Dashboard responds with ${HttpStatus.CREATED}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.CREATED));
          })
        );
      });

      test('Returns nothing', async () => {
        const result = await dashboardService.updateNoteForCareRequest(
          mockCareRequestID,
          mockNoteID,
          note
        );

        expect(result).toBeUndefined();
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.INTERNAL_SERVER_ERROR));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.updateNoteForCareRequest(
            mockCareRequestID,
            mockNoteID,
            note
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.NOT_FOUND}`, () => {
      beforeEach(() => {
        server.use(
          rest.patch(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NOT_FOUND));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.updateNoteForCareRequest(
            mockCareRequestID,
            mockNoteID,
            note
          )
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });

  describe(`${DashboardService.prototype.getCareTeamEta.name}`, () => {
    const mockCareRequest = buildMockCareRequest();
    const mockPath = `${basePath}/api/care_requests/${mockCareRequest.id}/eta`;

    describe(`Dashboard responds with ${HttpStatus.OK}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(
              ctx.status(HttpStatus.OK),
              ctx.json(mockCareTeamEta)
            );
          })
        );
      });

      test('should return care team ETA', async () => {
        const result = await dashboardService.getCareTeamEta(
          mockCareRequest.patientId
        );

        expect(result).toStrictEqual(mockCareTeamEta);
      });
    });

    describe(`Dashboard responds with ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
      beforeEach(() => {
        server.use(
          rest.get(mockPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.INTERNAL_SERVER_ERROR));
          })
        );
      });

      test('should return error', async () => {
        await expect(
          dashboardService.getPatientSocialHistory(mockCareRequest.patientId)
        ).rejects.toBeInstanceOf(Error);
      });
    });
  });
});
