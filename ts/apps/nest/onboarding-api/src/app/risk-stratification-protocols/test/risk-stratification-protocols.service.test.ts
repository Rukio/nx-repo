import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import RiskStratificationProtocolsService from '../risk-stratification-protocols.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  RISK_STRATIFICATION_PROTOCOL_QUERY_MOCK,
  RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK,
  STATION_RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK,
} from './mocks/risk-stratification-protocols.mock';
import StationService from '../../station/station.service';
import {
  PROTOCOL_ID,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
} from '../../station/test/mocks/station.service.mock';
import { mockAuthService } from '../../common/mocks/auth.mock';

describe(`${RiskStratificationProtocolsService.name}`, () => {
  let app: INestApplication;
  let riskStratificationProtocolsService: RiskStratificationProtocolsService;
  let httpService: HttpService;
  let stationService: StationService;

  beforeAll(async () => {
    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [RiskStratificationProtocolsService, StationService],
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
    riskStratificationProtocolsService =
      module.get<RiskStratificationProtocolsService>(
        RiskStratificationProtocolsService
      );
    stationService = module.get<StationService>(StationService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${RiskStratificationProtocolsService.prototype.fetch.name}`, () => {
    it('fetch Risk Stratification Protocol from station by id', async () => {
      const fetchRiskStratificationProtocol = jest
        .spyOn(stationService, 'fetchRiskStratificationProtocol')
        .mockResolvedValue(RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK);

      const result = await riskStratificationProtocolsService.fetch(
        RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
        PROTOCOL_ID
      );

      expect(fetchRiskStratificationProtocol).toHaveBeenCalledWith(
        RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
        PROTOCOL_ID
      );
      expect(result).toEqual(RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK);
    });
  });

  describe(`${RiskStratificationProtocolsService.prototype.fetchAll.name}`, () => {
    it('fetch list of Risk Stratification Protocols from station', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(
            wrapInAxiosResponse(
              STATION_RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK
            )
          )
        );
      expect(
        await riskStratificationProtocolsService.fetchAll(
          RISK_STRATIFICATION_PROTOCOL_QUERY_MOCK
        )
      ).toEqual(RISK_STRATIFICATION_PROTOCOL_RESULT_MOCK);
    });
  });
});
