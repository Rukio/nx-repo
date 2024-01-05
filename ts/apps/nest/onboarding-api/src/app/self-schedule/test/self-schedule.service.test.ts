import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import SelfScheduleService, { USER_CACHE_EXP } from '../self-schedule.service';
import StationService from '../../station/station.service';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { mockAuthService } from '../../common/mocks/auth.mock';
import {
  checkFeasibilityRequestBody,
  checkMarketAvailabilityResponse,
  mockBillingCityPlaceOfService,
  CREATE_ETA_RANGE_RESPONSE,
  ETA_RANGE_QUERY_MOCK,
  PROTOCOL_ID,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
} from '../../station/test/mocks/station.service.mock';
import {
  OSS_CARE_REQUEST_MOCK,
  UPDATE_CARE_REQUEST_MOCK,
  MOCK_OSS_USER_CACHE,
  MOCK_OSS_USER_ID,
  MOCK_STRINGIFIED_USER_CACHE,
  MOCK_INSURANCE_CLASSIFICATION,
} from './mocks/self-schedule.mock';
import { IOREDIS_CLIENT_TOKEN, RedisModule } from '@*company-data-covered*/nest/redis';
import { RedisConfigurationFactory } from '../../configuration/redis.configuration.factory';
import InsuranceNetworksService from '../../insurance-networks/insurance-networks.service';
import { mockRedis } from '../../../testUtils/mocks/redis.mock';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { CARE_REQUEST_RESPONSE_MOCK } from '../../station/test/mocks/station.mapper.mock';
import {
  MOCK_INSURANCE_NETWORKS_SERVICE_RESULT,
  MOCK_INSURANCE_PAYER_ALL_PARAMS,
  MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS,
  MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS,
} from '../../insurance-networks/test/mocks/insurance-networks.mock';

describe(`${SelfScheduleService.name}`, () => {
  let app: INestApplication;
  let selfScheduleService: SelfScheduleService;
  const mockStationService = mockDeep<StationService>();
  const mockInsuranceNetworksService = mockDeep<InsuranceNetworksService>();

  beforeEach(() => {
    mockReset(mockStationService);
    mockReset(mockInsuranceNetworksService);
  });

  beforeAll(async () => {
    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [
        SelfScheduleService,
        StationService,
        InsuranceNetworksService,
      ],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        AuthModule.register(mockOptions),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
        RedisModule.registerAsync({ useClass: RedisConfigurationFactory }),
      ],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(IOREDIS_CLIENT_TOKEN)
      .useValue(mockRedis)
      .overrideProvider(StationService)
      .useValue(mockStationService)
      .overrideProvider(InsuranceNetworksService)
      .useValue(mockInsuranceNetworksService)
      .compile();

    selfScheduleService = module.get<SelfScheduleService>(SelfScheduleService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${SelfScheduleService.prototype.cancelNotification.name}`, () => {
    it('should cancel a notification successfully', async () => {
      mockStationService.cancelNotification.mockResolvedValue({
        success: true,
      });

      await expect(
        selfScheduleService.cancelNotification('test_job_id')
      ).resolves.toEqual({ success: true });
    });
  });

  describe(`${SelfScheduleService.prototype.createNotification.name}`, () => {
    it('should create a notification successfully', async () => {
      mockStationService.createNotification.mockResolvedValue({
        success: true,
        jobId: 'uuid',
      });

      await expect(
        selfScheduleService.createNotification('test_cr_id')
      ).resolves.toEqual({ success: true, jobId: 'uuid' });
    });
  });

  describe(`${SelfScheduleService.prototype.checkMarketFeasibility.name}`, () => {
    it('should check market feasibility successfully', async () => {
      mockStationService.checkMarketFeasibility.mockResolvedValue(
        checkMarketAvailabilityResponse
      );

      await expect(
        selfScheduleService.checkMarketFeasibility(checkFeasibilityRequestBody)
      ).resolves.toEqual(checkMarketAvailabilityResponse);
    });
  });

  describe(`${SelfScheduleService.prototype.fetchPlacesOfService.name}`, () => {
    it(`fetch places of service for a billing city`, async () => {
      mockStationService.fetchPlacesOfService.mockResolvedValue(
        mockBillingCityPlaceOfService
      );

      await expect(
        mockStationService.fetchPlacesOfService('test_billing_city_id')
      ).resolves.toStrictEqual(mockBillingCityPlaceOfService);
    });
  });

  describe(`${SelfScheduleService.prototype.createCareRequest.name}`, () => {
    it('should create a care request successfully', async () => {
      mockStationService.createOssCareRequest.mockResolvedValue(
        OSS_CARE_REQUEST_MOCK
      );

      await expect(
        selfScheduleService.createCareRequest(OSS_CARE_REQUEST_MOCK)
      ).resolves.toEqual(OSS_CARE_REQUEST_MOCK);
    });
  });

  describe(`${SelfScheduleService.prototype.createEta.name}`, () => {
    it(`should return success for Eta range`, async () => {
      mockStationService.createEta.mockResolvedValue(CREATE_ETA_RANGE_RESPONSE);

      await expect(
        mockStationService.createEta(ETA_RANGE_QUERY_MOCK)
      ).resolves.toStrictEqual(CREATE_ETA_RANGE_RESPONSE);
    });
  });

  describe(`${SelfScheduleService.prototype.fetchRiskStratificationProtocol.name}`, () => {
    it('should get risk stratification protocol', async () => {
      mockStationService.fetchRiskStratificationProtocol.mockResolvedValue(
        RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK
      );

      await expect(
        selfScheduleService.fetchRiskStratificationProtocol(
          RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
          PROTOCOL_ID
        )
      ).resolves.toEqual(RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK);
    });
  });

  describe(`${SelfScheduleService.prototype.getInsurancePayers.name}`, () => {
    it(`should return success for get Insurance Payers`, async () => {
      mockInsuranceNetworksService.listInsurancePayers.mockResolvedValue([
        MOCK_INSURANCE_PAYER_ALL_PARAMS,
      ]);

      await expect(
        mockInsuranceNetworksService.listInsurancePayers(
          MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS
        )
      ).resolves.toStrictEqual([MOCK_INSURANCE_PAYER_ALL_PARAMS]);
    });
  });

  describe(`${SelfScheduleService.prototype.fetchCache.name}`, () => {
    const invalidJSON = '{"careRequestId":12,#4_./+&,;=';

    it('returns user cache', async () => {
      mockRedis.get.mockResolvedValueOnce(MOCK_STRINGIFIED_USER_CACHE);
      const userCache = await selfScheduleService.fetchCache(MOCK_OSS_USER_ID);
      expect(userCache).toEqual(MOCK_OSS_USER_CACHE);
      expect(mockRedis.get).toHaveBeenCalledWith(MOCK_OSS_USER_ID);
    });

    it('returns null if user has no cache', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      const userCache = await selfScheduleService.fetchCache(MOCK_OSS_USER_ID);
      expect(userCache).toEqual(null);
      expect(mockRedis.get).toHaveBeenCalledWith(MOCK_OSS_USER_ID);
    });

    it('throws error if saved cache is not a valid JSON', async () => {
      mockRedis.get.mockResolvedValueOnce(invalidJSON);
      await expect(
        selfScheduleService.fetchCache(MOCK_OSS_USER_ID)
      ).rejects.toBeInstanceOf(Error);
      expect(mockRedis.get).toHaveBeenCalledWith(MOCK_OSS_USER_ID);
    });
  });

  describe(`${SelfScheduleService.prototype.setCache.name}`, () => {
    it('saves the user cache', async () => {
      mockRedis.set.mockResolvedValueOnce('OK');
      await selfScheduleService.setCache(MOCK_OSS_USER_ID, MOCK_OSS_USER_CACHE);
      expect(mockRedis.set).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID,
        MOCK_STRINGIFIED_USER_CACHE,
        'EX',
        USER_CACHE_EXP
      );
    });

    it('throws error if redis response is not "OK"', async () => {
      const mockBadResponse = 'NOT OK';
      mockRedis.set.mockResolvedValueOnce(mockBadResponse);
      await expect(
        selfScheduleService.setCache(MOCK_OSS_USER_ID, MOCK_OSS_USER_CACHE)
      ).rejects.toThrow(
        `Redis returned unexpected response: ${mockBadResponse}`
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID,
        MOCK_STRINGIFIED_USER_CACHE,
        'EX',
        USER_CACHE_EXP
      );
    });
  });

  describe(`${SelfScheduleService.prototype.updateCareRequestStatus.name}`, () => {
    it('should return success for update care request status', async () => {
      mockStationService.updateCareRequestStatus.mockResolvedValue(true);

      await expect(
        selfScheduleService.updateCareRequestStatus(UPDATE_CARE_REQUEST_MOCK)
      ).resolves.toStrictEqual(true);
    });
  });

  describe(`${SelfScheduleService.prototype.searchInsuranceNetworks.name}`, () => {
    it('should search insurance networks', async () => {
      mockInsuranceNetworksService.search.mockResolvedValue(
        MOCK_INSURANCE_NETWORKS_SERVICE_RESULT
      );

      await expect(
        selfScheduleService.searchInsuranceNetworks(
          MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS
        )
      ).resolves.toEqual(MOCK_INSURANCE_NETWORKS_SERVICE_RESULT);
    });
  });

  describe(`${SelfScheduleService.prototype.getClassifications.name}`, () => {
    it('should get insurance classification list', async () => {
      mockStationService.getClassifications.mockResolvedValue(
        MOCK_INSURANCE_CLASSIFICATION
      );

      await expect(
        selfScheduleService.getClassifications()
      ).resolves.toStrictEqual(MOCK_INSURANCE_CLASSIFICATION);
    });
  });

  describe(`${SelfScheduleService.prototype.getCareRequest.name}`, () => {
    it('should get care request', async () => {
      jest
        .spyOn(mockStationService, 'getCareRequest')
        .mockResolvedValue(CARE_REQUEST_RESPONSE_MOCK);
      const result = await selfScheduleService.getCareRequest('123');

      expect(result).toStrictEqual(CARE_REQUEST_RESPONSE_MOCK);
    });
  });

  describe(`${SelfScheduleService.prototype.updateCareRequest.name}`, () => {
    it('should update care request', async () => {
      mockStationService.updateCareRequest.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      await expect(
        selfScheduleService.updateCareRequest('id', CARE_REQUEST_RESPONSE_MOCK)
      ).resolves.toStrictEqual(CARE_REQUEST_RESPONSE_MOCK);
    });
  });
});
