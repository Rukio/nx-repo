import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { CompanionLink } from '@prisma/client';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { CommonModule } from '../../common/common.module';
import { CompanionAuthGuard } from '../../companion/companion-auth.guard';
import { mockCompanionAuthGuard } from '../../companion/mocks/companion-auth.guard.mock';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { ClinicalProvidersModule } from '../clinical-providers.module';
import { buildMockClinicalProviderSearchDto } from '../mocks/clinical-providers.mocks';
import { ClinicalProvidersController } from '../clinical-providers.controller';
import { buildMockDashboardClinicalProvider } from '../../dashboard/mocks/dashboard-clinical-provider.mock';
import { DashboardClinicalProvider } from '../../dashboard/types/dashboard-clinical-provider';
import { ClinicalProvidersRepository } from '../clinical-providers.repository';
import { mockClinicalProvidersRepository } from '../mocks/clinical-providers-repository.mock';
import { getQueueToken } from '@nestjs/bull';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { ClinicalProviderSearchResponseDto } from '../dto/clinical-provider-response.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ClinicalProviderSearchDto as ClinicalProviderSearchTermDto } from '../dto/clinical-provider-search.dto';
import * as faker from 'faker';

describe(`${ClinicalProvidersModule.name} API Tests`, () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ClinicalProvidersModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(ClinicalProvidersRepository)
      .useValue(mockClinicalProvidersRepository)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCompanionLink: CompanionLink = buildMockCompanionLink();

  const mockDashboardClinicalProvider = buildMockDashboardClinicalProvider();

  const mockDashboardClinicalProviders: DashboardClinicalProvider[] = [
    mockDashboardClinicalProvider,
  ];

  const basePath = `/companion/${mockCompanionLink.id}/clinical-providers`;

  describe(`${ClinicalProvidersController.prototype.searchClinicalProviders.name}`, () => {
    beforeEach(() => {
      mockDatabaseService.companionLink.findUnique.mockResolvedValue(
        mockCompanionLink
      );
      mockClinicalProvidersRepository.searchClinicalProviders.mockResolvedValue(
        mockDashboardClinicalProviders
      );
    });

    describe(`Link exists`, () => {
      describe('person search', () => {
        const minimumValidSearch = buildMockClinicalProviderSearchDto({
          clinicalProvider: {
            entityName: undefined,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            zip: faker.address.zipCode(),
          },
        });

        test(`should return as expected with person search`, async () => {
          return request(app.getHttpServer())
            .post(basePath)
            .send(minimumValidSearch)
            .expect(HttpStatus.CREATED)
            .expect((res) => {
              expect(res.body).toBeDefined();
            });
        });

        test(`Returns ${HttpStatus.BAD_REQUEST} with no first name`, () => {
          const data: ClinicalProviderSearchTermDto = {
            clinicalProvider: {
              ...minimumValidSearch,
              firstName: undefined,
            },
          };

          return request(app.getHttpServer())
            .post(basePath)
            .send(data)
            .expect(HttpStatus.BAD_REQUEST);
        });

        test(`Returns ${HttpStatus.BAD_REQUEST} with no last name`, () => {
          const data: ClinicalProviderSearchTermDto = {
            clinicalProvider: {
              ...minimumValidSearch,
              lastName: undefined,
            },
          };

          return request(app.getHttpServer())
            .post(basePath)
            .send(data)
            .expect(HttpStatus.BAD_REQUEST);
        });

        test(`Returns ${HttpStatus.BAD_REQUEST} with no zip`, () => {
          const data: ClinicalProviderSearchTermDto = {
            clinicalProvider: {
              ...minimumValidSearch,
              zip: undefined,
            },
          };

          return request(app.getHttpServer())
            .post(basePath)
            .send(data)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('entity search', () => {
        const minimumValidSearch = buildMockClinicalProviderSearchDto({
          clinicalProvider: {
            entityName: faker.company.companyName(),
            firstName: undefined,
            lastName: undefined,
            zip: faker.address.zipCode(),
          },
        });

        test(`should return as expected with entity search`, async () => {
          return request(app.getHttpServer())
            .post(basePath)
            .send(minimumValidSearch)
            .expect(HttpStatus.CREATED)
            .expect((res) => {
              expect(res.body).toBeDefined();
            });
        });

        test(`Returns ${HttpStatus.BAD_REQUEST} with no entityName`, () => {
          const data: ClinicalProviderSearchTermDto = {
            clinicalProvider: {
              ...minimumValidSearch,
              entityName: undefined,
            },
          };

          return request(app.getHttpServer())
            .post(basePath)
            .send(data)
            .expect(HttpStatus.BAD_REQUEST);
        });

        test(`Returns ${HttpStatus.BAD_REQUEST} with no zip`, () => {
          const data: ClinicalProviderSearchTermDto = {
            clinicalProvider: {
              ...minimumValidSearch,
              zip: undefined,
            },
          };

          return request(app.getHttpServer())
            .post(basePath)
            .send(data)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('phone search', () => {
        const minimumValidSearch = buildMockClinicalProviderSearchDto({
          clinicalProvider: {
            entityName: undefined,
            firstName: undefined,
            lastName: undefined,
            zip: undefined,
            phone: faker.phone.phoneNumber(),
          },
        });

        test(`should return as expected with phone search`, async () => {
          return request(app.getHttpServer())
            .post(basePath)
            .send(
              buildMockClinicalProviderSearchDto({
                clinicalProvider: {
                  entityName: undefined,
                  firstName: undefined,
                  lastName: undefined,
                  zip: undefined,
                  phone: faker.phone.phoneNumber(),
                },
              })
            )
            .expect(HttpStatus.CREATED)
            .expect((res) => {
              expect(res.body).toBeDefined();
            });
        });

        test(`Returns ${HttpStatus.BAD_REQUEST} with invalid phone`, () => {
          const data: ClinicalProviderSearchTermDto = {
            clinicalProvider: {
              ...minimumValidSearch,
              phone: undefined,
            },
          };

          return request(app.getHttpServer())
            .post(basePath)
            .send(data)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      test(`Returns ${HttpStatus.BAD_REQUEST} with no body`, () => {
        return request(app.getHttpServer())
          .post(basePath)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });
});

describe(`${ClinicalProviderSearchResponseDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        clinicalProviders: [],
      };
      const dto = plainToInstance(ClinicalProviderSearchResponseDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        clinicalProviders: null,
      };
      const dto = plainToInstance(ClinicalProviderSearchResponseDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain(
        'clinicalProviders must be an array'
      );
    });
  });
});

describe(`${ClinicalProviderSearchTermDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        clinicalProvider: {
          firstName: 'First',
          lastName: 'Last',
          entityName: 'Entity',
          zip: '80205',
          distanceMiles: 1,
          limit: 10,
          offset: 2,
        },
      };
      const dto = plainToInstance(ClinicalProviderSearchTermDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it passes without optional properties', async () => {
      const body = {
        clinicalProvider: {
          zip: '80205',
        },
      };
      const dto = plainToInstance(ClinicalProviderSearchTermDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });
});
