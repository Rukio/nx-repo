import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import StateService from '../state.service';
import StationService from '../../station/station.service';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { mockAuthService } from '../../common/mocks/auth.mock';
import { STATE_FETCH_RESPONSE_MOCK } from '../../station/test/mocks/station.service.mock';

describe(`${StateService.name}`, () => {
  let app: INestApplication;
  let stateService: StateService;
  let stationService: StationService;

  beforeAll(async () => {
    const mockOptions = buildMockAuthenticationModuleOptions();
    const module = await Test.createTestingModule({
      providers: [StateService, StationService],
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

    stateService = module.get<StateService>(StateService);
    stationService = module.get<StationService>(StationService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${StateService.prototype.fetchAllActive.name}`, () => {
    it(`get all active states`, async () => {
      jest
        .spyOn(stationService, 'fetchStates')
        .mockResolvedValue([STATE_FETCH_RESPONSE_MOCK]);

      const result = await stateService.fetchAllActive();
      expect(result).toEqual([STATE_FETCH_RESPONSE_MOCK]);
    });
  });
});
