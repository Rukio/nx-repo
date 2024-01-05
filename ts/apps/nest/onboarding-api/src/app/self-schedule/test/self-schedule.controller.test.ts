import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep, mockReset } from 'jest-mock-extended';
import SelfScheduleController from '../self-schedule.controller';
import SelfScheduleService from '../self-schedule.service';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import { CheckMarketAvailability } from '@*company-data-covered*/consumer-web-types';
import {
  checkFeasibilityRequestBody,
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
  MOCK_INSURANCE_CLASSIFICATION_RESPONSE,
  MOCK_INSURANCE_CLASSIFICATION,
} from './mocks/self-schedule.mock';
import { IOREDIS_CLIENT_TOKEN, RedisModule } from '@*company-data-covered*/nest/redis';
import { RedisConfigurationFactory } from '../../configuration/redis.configuration.factory';
import { MOCK_CHANNEL_ITEM } from '../../channel-items/test/mocks/channel-items.mock';
import { mockRedis } from '../../../testUtils/mocks/redis.mock';
import { mockLogger } from '../../logger/mocks/logger.mock';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CARE_REQUEST_RESPONSE_MOCK } from '../../station/test/mocks/station.mapper.mock';
import {
  MOCK_INSURANCE_NETWORKS_SERVICE_RESULT,
  MOCK_INSURANCE_PAYER_ALL_PARAMS,
  MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS,
  MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS,
  MOCK_SEARCH_INSURANCE_NETWORKS_RESULT,
} from '../../insurance-networks/test/mocks/insurance-networks.mock';

describe('SelfScheduleController', () => {
  let controller: SelfScheduleController;
  const mockSelfScheduleService = mockDeep<SelfScheduleService>();

  beforeEach(() => {
    mockReset(mockSelfScheduleService);
  });

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SelfScheduleController],
      providers: [SelfScheduleService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
        RedisModule.registerAsync({ useClass: RedisConfigurationFactory }),
      ],
    })
      .overrideProvider(SelfScheduleService)
      .useValue(mockSelfScheduleService)
      .overrideProvider(IOREDIS_CLIENT_TOKEN)
      .useValue(mockRedis)
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .compile();

    controller = app.get<SelfScheduleController>(SelfScheduleController);
  });

  const mockError = new Error('error');

  describe(`${SelfScheduleController.prototype.cancelNotification.name}`, () => {
    it('Self Schedule cancel notification', async () => {
      mockSelfScheduleService.cancelNotification.mockResolvedValueOnce({
        success: true,
      });

      await expect(controller.cancelNotification('jobId')).resolves.toEqual({
        success: true,
      });
    });

    it('throw error on remove', async () => {
      mockSelfScheduleService.cancelNotification.mockRejectedValueOnce(
        mockError
      );

      await expect(controller.cancelNotification('jobId')).rejects.toThrow(
        HttpException
      );
    });
  });

  describe(`${SelfScheduleController.prototype.createNotification.name}`, () => {
    it('Self Schedule create notification', async () => {
      const mockedResponse = {
        success: true,
        jobId: 'uuid',
      };
      mockSelfScheduleService.createNotification.mockResolvedValue(
        mockedResponse
      );

      await expect(
        controller.createNotification({ careRequestId: 'careRequestId' })
      ).resolves.toEqual(mockedResponse);
    });

    it('throw error on create', async () => {
      mockSelfScheduleService.createNotification.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.createNotification({ careRequestId: 'careRequestId' })
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${SelfScheduleService.prototype.checkMarketFeasibility.name}`, () => {
    it('Self Schedule check market feasibility', async () => {
      const res: CheckMarketAvailability = {
        availability: 'available',
      };
      mockSelfScheduleService.checkMarketFeasibility.mockResolvedValue(res);

      const requestBody = {
        zipcode: '80205',
      };

      await expect(
        controller.checkMarketFeasibility(requestBody)
      ).resolves.toStrictEqual({ success: true, data: res });
      expect(
        mockSelfScheduleService.checkMarketFeasibility
      ).toHaveBeenCalledWith(requestBody);
    });

    it('throw error on check', async () => {
      mockSelfScheduleService.checkMarketFeasibility.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.checkMarketFeasibility(checkFeasibilityRequestBody)
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${SelfScheduleController.prototype.fetchPlacesOfService.name}`, () => {
    it(`gets places of service`, async () => {
      const mockBillingCityId = '19';
      mockSelfScheduleService.fetchPlacesOfService.mockResolvedValue(
        mockBillingCityPlaceOfService
      );

      await expect(
        controller.fetchPlacesOfService(mockBillingCityId)
      ).resolves.toStrictEqual({
        success: true,
        data: mockBillingCityPlaceOfService,
      });
      expect(mockSelfScheduleService.fetchPlacesOfService).toHaveBeenCalledWith(
        mockBillingCityId
      );
    });

    it('throws error', async () => {
      mockSelfScheduleService.fetchPlacesOfService.mockRejectedValueOnce(
        mockError
      );

      await expect(controller.fetchPlacesOfService('1234')).rejects.toThrow(
        HttpException
      );
    });
  });

  describe(`${SelfScheduleController.prototype.createCareRequest.name}`, () => {
    it('Self Schedule create Care Request', async () => {
      mockSelfScheduleService.createCareRequest.mockResolvedValue(
        OSS_CARE_REQUEST_MOCK
      );

      await expect(
        controller.createCareRequest(OSS_CARE_REQUEST_MOCK)
      ).resolves.toEqual({
        success: true,
        data: OSS_CARE_REQUEST_MOCK,
      });
    });

    it('throw error on create care request', async () => {
      mockSelfScheduleService.createCareRequest.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.createCareRequest(OSS_CARE_REQUEST_MOCK)
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${SelfScheduleController.prototype.createEta.name}`, () => {
    it('should return success for Eta range', async () => {
      mockSelfScheduleService.createEta.mockResolvedValue(
        CREATE_ETA_RANGE_RESPONSE
      );
      const response = {
        success: true,
        data: CREATE_ETA_RANGE_RESPONSE,
      };

      await expect(controller.createEta(ETA_RANGE_QUERY_MOCK)).resolves.toEqual(
        response
      );
    });

    it('throw httpException on createEta', async () => {
      mockSelfScheduleService.createEta.mockRejectedValueOnce(mockError);

      await expect(controller.createEta(ETA_RANGE_QUERY_MOCK)).rejects.toThrow(
        HttpException
      );
      expect(mockSelfScheduleService.createEta).toHaveBeenCalledWith(
        ETA_RANGE_QUERY_MOCK
      );
    });
  });

  describe(`${SelfScheduleController.prototype.fetchRiskStratificationProtocol.name}`, () => {
    it('Self Schedule get risk stratification protocol', async () => {
      mockSelfScheduleService.fetchRiskStratificationProtocol.mockResolvedValue(
        RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK
      );

      await expect(
        controller.fetchRiskStratificationProtocol(
          RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
          PROTOCOL_ID
        )
      ).resolves.toEqual({
        success: true,
        data: RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
      });
    });

    it('throw error on get risk stratification protocol', async () => {
      mockSelfScheduleService.fetchRiskStratificationProtocol.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.fetchRiskStratificationProtocol(
          RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
          PROTOCOL_ID
        )
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${SelfScheduleController.prototype.getInsurancePayers.name}`, () => {
    it('should return success for get Insurance Payers', async () => {
      mockSelfScheduleService.getInsurancePayers.mockResolvedValue([
        MOCK_INSURANCE_PAYER_ALL_PARAMS,
      ]);
      await expect(
        controller.getInsurancePayers(MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS)
      ).resolves.toEqual({
        success: true,
        data: [MOCK_INSURANCE_PAYER_ALL_PARAMS],
      });
    });

    it('throw httpException on getInsurancePayers', async () => {
      mockSelfScheduleService.getInsurancePayers.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.getInsurancePayers(MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS)
      ).rejects.toThrow(HttpException);
      expect(mockSelfScheduleService.getInsurancePayers).toHaveBeenCalledWith(
        MOCK_INSURANCE_PAYER_REQUEST_ALL_PARAMS
      );
    });
  });

  describe(`${SelfScheduleController.prototype.fetchCache.name}`, () => {
    it('returns stored cache', async () => {
      mockSelfScheduleService.fetchCache.mockResolvedValueOnce(
        MOCK_OSS_USER_CACHE
      );

      await expect(controller.fetchCache(MOCK_OSS_USER_ID)).resolves.toEqual({
        success: true,
        data: MOCK_OSS_USER_CACHE,
      });
      expect(mockSelfScheduleService.fetchCache).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID
      );
    });

    it('throws error if service method failed', async () => {
      mockSelfScheduleService.fetchCache.mockRejectedValueOnce(mockError);

      await expect(controller.fetchCache(MOCK_OSS_USER_ID)).rejects.toThrow(
        HttpException
      );
      expect(mockSelfScheduleService.fetchCache).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `SelfSchedule get user cache error: error`
      );
    });

    it('throws error if service method failed with undefined err', async () => {
      mockSelfScheduleService.fetchCache.mockRejectedValueOnce(undefined);

      await expect(controller.fetchCache(MOCK_OSS_USER_ID)).rejects.toThrow(
        HttpException
      );
      expect(mockSelfScheduleService.fetchCache).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `SelfSchedule get user cache error: undefined`
      );
    });
  });

  describe(`${SelfScheduleController.prototype.saveCache.name}`, () => {
    it('stores cache', async () => {
      mockSelfScheduleService.setCache.mockResolvedValueOnce();

      await expect(
        controller.saveCache(MOCK_OSS_USER_ID, MOCK_OSS_USER_CACHE)
      ).resolves.toEqual({
        success: true,
        data: null,
      });
      expect(mockSelfScheduleService.setCache).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID,
        MOCK_OSS_USER_CACHE
      );
    });

    it('throws error if service method failed', async () => {
      mockSelfScheduleService.setCache.mockRejectedValueOnce(mockError);

      await expect(
        controller.saveCache(MOCK_OSS_USER_ID, MOCK_OSS_USER_CACHE)
      ).rejects.toThrow(HttpException);
      expect(mockSelfScheduleService.setCache).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID,
        MOCK_OSS_USER_CACHE
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `SelfSchedule save user cache error: error`
      );
    });

    it('throws error if service method failed with undefined err', async () => {
      mockSelfScheduleService.setCache.mockRejectedValueOnce(undefined);

      await expect(
        controller.saveCache(MOCK_OSS_USER_ID, MOCK_OSS_USER_CACHE)
      ).rejects.toThrow(HttpException);
      expect(mockSelfScheduleService.setCache).toHaveBeenCalledWith(
        MOCK_OSS_USER_ID,
        MOCK_OSS_USER_CACHE
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `SelfSchedule save user cache error: undefined`
      );
    });
  });

  describe(`${SelfScheduleController.prototype.updateCareRequestStatus.name}`, () => {
    it('should return update care request status', async () => {
      mockSelfScheduleService.updateCareRequestStatus.mockResolvedValue(true);

      await expect(
        controller.updateCareRequestStatus(UPDATE_CARE_REQUEST_MOCK)
      ).resolves.toEqual({ data: true, success: true });
    });

    it('throw httpException on update care request status', async () => {
      mockSelfScheduleService.updateCareRequestStatus.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.updateCareRequestStatus(UPDATE_CARE_REQUEST_MOCK)
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${SelfScheduleController.prototype.searchInsuranceNetworks.name}`, () => {
    it('Self Schedule search insurance networks', async () => {
      mockSelfScheduleService.searchInsuranceNetworks.mockResolvedValue(
        MOCK_INSURANCE_NETWORKS_SERVICE_RESULT
      );

      await expect(
        controller.searchInsuranceNetworks(
          MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS
        )
      ).resolves.toEqual(MOCK_SEARCH_INSURANCE_NETWORKS_RESULT);
    });

    it('throw error on search insurance networks', async () => {
      mockSelfScheduleService.searchInsuranceNetworks.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.searchInsuranceNetworks(
          MOCK_SEARCH_INSURANCE_NETWORKS_PARAMS
        )
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${SelfScheduleController.prototype.getInsuranceClassifications.name}`, () => {
    it('Self Schedule get insurance classification list', async () => {
      mockSelfScheduleService.getClassifications.mockResolvedValue(
        MOCK_INSURANCE_CLASSIFICATION
      );

      await expect(controller.getInsuranceClassifications()).resolves.toEqual(
        MOCK_INSURANCE_CLASSIFICATION_RESPONSE
      );
    });

    it('throw error on get insurance classification list', async () => {
      mockSelfScheduleService.getClassifications.mockRejectedValueOnce(
        mockError
      );

      await expect(controller.getInsuranceClassifications()).rejects.toThrow(
        HttpException
      );
    });
  });

  describe(`${SelfScheduleController.prototype.getCareRequest.name}`, () => {
    it('Self Schedule get care request', async () => {
      mockSelfScheduleService.getCareRequest.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      await expect(controller.getCareRequest('123')).resolves.toEqual({
        data: CARE_REQUEST_RESPONSE_MOCK,
        success: true,
      });
    });

    it('throw error on get care request', async () => {
      mockSelfScheduleService.getCareRequest.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(controller.getCareRequest('123')).rejects.toThrow(
        HttpException
      );
    });
  });

  describe(`${SelfScheduleController.prototype.updateCareRequest.name}`, () => {
    it('Self Schedule update care request', async () => {
      mockSelfScheduleService.updateCareRequest.mockResolvedValue(
        CARE_REQUEST_RESPONSE_MOCK
      );

      await expect(
        controller.updateCareRequest('id', CARE_REQUEST_RESPONSE_MOCK)
      ).resolves.toEqual({ data: CARE_REQUEST_RESPONSE_MOCK, success: true });
    });

    it('throw error on update care request', async () => {
      mockSelfScheduleService.updateCareRequest.mockRejectedValueOnce(
        mockError
      );

      await expect(
        controller.updateCareRequest('id', CARE_REQUEST_RESPONSE_MOCK)
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${SelfScheduleController.prototype.fetchChannelItem.name}`, () => {
    it('should return channel item by id', async () => {
      const channelItemId = '159';
      mockSelfScheduleService.fetchChannelItem.mockResolvedValue(
        MOCK_CHANNEL_ITEM
      );
      expect(await controller.fetchChannelItem(channelItemId)).toEqual({
        data: { id: MOCK_CHANNEL_ITEM.id, name: MOCK_CHANNEL_ITEM.name },
        success: true,
      });
      expect(mockSelfScheduleService.fetchChannelItem).toBeCalled();
    });

    it('throw error on fetch channel item', async () => {
      mockSelfScheduleService.fetchChannelItem.mockRejectedValueOnce(mockError);

      await expect(controller.fetchChannelItem('id')).rejects.toThrow(
        HttpException
      );
    });
  });
});
