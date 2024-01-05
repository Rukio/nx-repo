import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpService, HttpModule } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import {
  AdvancedCarePatient,
  CMAdvancedCarePatient,
} from '@*company-data-covered*/consumer-web-types';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { mockAuthService } from '../../common/mocks/auth.mock';
import { CacheConfigService } from '../../common/cache.config.service';
import AdvancedCareService from '../advanced-care.service';
import {
  MOCK_ADVANCED_CARE_PATIENT_DATA,
  MOCK_CM_ADVANCED_CARE_PATIENT_DATA,
} from './mocks/advanced-care.mock';

describe('AdvancedCareService', () => {
  let app: INestApplication;
  let advancedCareService: AdvancedCareService;
  let httpService: HttpService;
  const OLD_ENV = process.env;

  beforeAll(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';

    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [AdvancedCareService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        AuthModule.register(mockOptions),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    httpService = module.get<HttpService>(HttpService);
    advancedCareService = module.get<AdvancedCareService>(AdvancedCareService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    process.env = OLD_ENV;
    await app.close();
  });

  describe(`${AdvancedCareService.prototype.getActivePatients.name}`, () => {
    it('should return active advanced care patients after get call', async () => {
      const mockResult: AdvancedCarePatient[] = MOCK_ADVANCED_CARE_PATIENT_DATA;
      const cmAdvancedCarePatient: CMAdvancedCarePatient[] =
        MOCK_CM_ADVANCED_CARE_PATIENT_DATA;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ patients: cmAdvancedCarePatient }))
        );
      const response = await advancedCareService.getActivePatients('3239');
      expect(response).toEqual(mockResult);
    });

    it('should return empty array since there are no advanced care patients after get call', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ patients: [] }))
        );
      const response = await advancedCareService.getActivePatients('32393');
      expect(response).toEqual([]);
    });
  });
});
