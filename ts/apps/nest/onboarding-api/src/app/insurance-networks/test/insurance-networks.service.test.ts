import InsuranceNetworksService from '../insurance-networks.service';
import LoggerModule from '../../logger/logger.module';
import mapper from '../insurance-networks.mapper';
import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../../common/cache.config.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  MOCK_INSURANCE_NETWORK_ID,
  MOCK_INSURANCE_PAYER_ALL_PARAMS,
  MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS,
  MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS,
  MOCK_SERVICES_INSURANCE_NETWORKS,
  MOCK_SERVICES_INSURANCE_NETWORK_RESPONSE,
  MOCK_SERVICES_INSURANCE_NETWORKS_RESPONSE,
  MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES,
  MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES_RESPONSE,
  MOCK_INSURANCE_NETWORK,
  MOCK_INSURANCE_NETWORKS_SERVICE_RESULT,
} from './mocks/insurance-networks.mock';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { mockAuthService } from '../../common/mocks/auth.mock';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { mockLogger } from '../../logger/mocks/logger.mock';

describe(`${InsuranceNetworksService.name}`, () => {
  let app: INestApplication;
  let httpService: HttpService;
  let insuranceNetworksService: InsuranceNetworksService;

  const mockOptions = buildMockAuthenticationModuleOptions();

  const spyMapperQueryParams = jest.spyOn(
    mapper,
    'SearchInsuranceNetworkToServiceInsuranceNetwork'
  );
  const spyMapperResponse = jest.spyOn(
    mapper,
    'ServicesInsuranceNetworkToInsuranceNetwork'
  );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [InsuranceNetworksService],
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
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .compile();

    httpService = module.get<HttpService>(HttpService);
    insuranceNetworksService = module.get<InsuranceNetworksService>(
      InsuranceNetworksService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${InsuranceNetworksService.prototype.fetch.name}`, () => {
    it('get an insurance network by id', async () => {
      const insuranceNetworkResponse: AxiosResponse = wrapInAxiosResponse(
        MOCK_SERVICES_INSURANCE_NETWORK_RESPONSE
      );

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(insuranceNetworkResponse));

      const result = await insuranceNetworksService.fetch(
        MOCK_INSURANCE_NETWORK_ID
      );

      expect(result).toEqual(MOCK_INSURANCE_NETWORK);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        MOCK_SERVICES_INSURANCE_NETWORKS
      );
    });
  });

  describe(`${InsuranceNetworksService.prototype.search.name}`, () => {
    it('search insurance networks', async () => {
      const insuranceNetworkResponse: AxiosResponse = wrapInAxiosResponse(
        MOCK_SERVICES_INSURANCE_NETWORKS_RESPONSE
      );

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(insuranceNetworkResponse));

      const result = await insuranceNetworksService.search(
        MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS
      );

      expect(result).toEqual(MOCK_INSURANCE_NETWORKS_SERVICE_RESULT);
      expect(spyMapperQueryParams).toHaveBeenCalledWith(
        MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS
      );
    });
  });

  describe(`${InsuranceNetworksService.prototype.listInsurancePayers.name}`, () => {
    it('list insurance payers', async () => {
      const insuranceNetworkResponse: AxiosResponse = wrapInAxiosResponse({
        payers: [MOCK_INSURANCE_PAYER_ALL_PARAMS],
      });

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(insuranceNetworkResponse));

      const result = await insuranceNetworksService.listInsurancePayers(
        MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS
      );

      expect(result).toEqual([MOCK_INSURANCE_PAYER_ALL_PARAMS]);
    });
  });

  describe(`${InsuranceNetworksService.prototype.listNetworkCreditCardRules.name}`, () => {
    it('list insurance network credit card rules', async () => {
      const insuranceNetworkCreditCardRulesResponse: AxiosResponse =
        wrapInAxiosResponse(MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES_RESPONSE);

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(insuranceNetworkCreditCardRulesResponse)
        );

      const result = await insuranceNetworksService.listNetworkCreditCardRules(
        MOCK_INSURANCE_NETWORK_ID
      );

      expect(result).toEqual(MOCK_INSURANCE_NETWORKS_CREDIT_CARD_RULES);
    });
  });
});
