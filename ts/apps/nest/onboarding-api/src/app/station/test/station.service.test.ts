import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import StationService from '../station.service';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { mockAuthService } from '../../common/mocks/auth.mock';
import {
  checkMarketAvailabilityResponse,
  checkFeasibilityRequestBody,
  mockStationBillingCityPlaceOfService,
  mockBillingCityPlaceOfService,
  CREATE_CARE_REQUEST_RESPONSE,
  STATION_CARE_REQUEST_RESPONSE,
  STATION_CREATE_NOTIFICATION_MOCK,
  STATE_FETCH_RESPONSE_MOCK,
  STATION_STATE_FETCH_MOCK,
  STATION_ASSIGN_TEAM_CREATE_ETA_RESPONSE,
  CREATE_ETA_RANGE_RESPONSE,
  ETA_RANGE_QUERY_MOCK,
  STATION_RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
  PROTOCOL_ID,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
} from './mocks/station.service.mock';
import mapper from '../station.mapper';
import { AxiosResponse } from 'axios';
import {
  ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK,
  MOCK_INSURANCE_CLASSIFICATION,
  OSS_CARE_REQUEST_MOCK,
  UPDATE_CARE_REQUEST_MOCK,
} from '../../self-schedule/test/mocks/self-schedule.mock';
import {
  CARE_REQUEST_MOCK,
  CARE_REQUEST_RESPONSE_MOCK,
  STATION_CARE_REQUEST_RESPONSE_MOCK,
  STATION_TIME_WINDOWS_AVAILABILITIES_MOCK,
  TIME_WINDOWS_AVAILABILITIES_MOCK,
} from './mocks/station.mapper.mock';
import {
  MOCK_CHANNEL_ITEM,
  MOCK_STATION_CHANNEL_ITEM,
} from '../../channel-items/test/mocks/channel-items.mock';

describe(`${StationService.name}`, () => {
  let app: INestApplication;
  let stationService: StationService;
  let httpService: HttpService;

  beforeAll(async () => {
    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [StationService],
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
    stationService = module.get<StationService>(StationService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${StationService.prototype.cancelNotification.name}`, () => {
    it('Station cancel notification', async () => {
      jest
        .spyOn(httpService, 'delete')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ success: true }))
        );
      expect(await stationService.cancelNotification('jobId')).toEqual({
        success: true,
      });
    });
  });

  describe(`${StationService.prototype.createNotification.name}`, () => {
    it('Station create notification', async () => {
      const careRequestId = '321';

      jest
        .spyOn(httpService, 'post')
        .mockImplementation(() =>
          of(wrapInAxiosResponse(STATION_CREATE_NOTIFICATION_MOCK))
        );

      const result = await stationService.createNotification(careRequestId);
      expect(result).toEqual({
        success: true,
        jobId: '123',
      });
    });
  });

  describe(`${StationService.prototype.createOssCareRequest.name}`, () => {
    it('Station create care request', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementation(() =>
          of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE))
        );

      const result = await stationService.createOssCareRequest(
        OSS_CARE_REQUEST_MOCK
      );

      expect(result).toEqual(CREATE_CARE_REQUEST_RESPONSE);
    });
  });

  describe(`${StationService.prototype.checkMarketFeasibility.name}`, () => {
    it('check market feasibility', async () => {
      const httpPostSpy = jest.spyOn(httpService, 'post');
      httpPostSpy.mockImplementationOnce(() =>
        of(wrapInAxiosResponse(checkMarketAvailabilityResponse))
      );

      const mapperSpy = jest.spyOn(
        mapper,
        'CheckMarketFeasibilityBodyToStationCheckMarketFeasibilityBody'
      );

      const actualResponse = await stationService.checkMarketFeasibility(
        checkFeasibilityRequestBody
      );
      expect(actualResponse).toEqual(checkMarketAvailabilityResponse);

      expect(mapperSpy).toHaveBeenCalledTimes(1);
      expect(mapperSpy).toHaveBeenCalledWith(checkFeasibilityRequestBody);
    });
  });

  describe(`${StationService.prototype.fetchPlacesOfService.name}`, () => {
    it(`fetch places of service for a billing city`, async () => {
      const response: AxiosResponse = wrapInAxiosResponse(
        mockStationBillingCityPlaceOfService
      );

      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));

      const result = await stationService.fetchPlacesOfService('19');

      expect(result).toStrictEqual(mockBillingCityPlaceOfService);
    });

    it(`throws error when we received non existing billing city id`, async () => {
      const response: AxiosResponse = wrapInAxiosResponse([]);

      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));

      const result = await stationService.fetchPlacesOfService('18');

      expect(result).toStrictEqual([]);
    });

    it(`should return empty even when response from station is undefined`, async () => {
      const response: AxiosResponse = wrapInAxiosResponse(undefined);

      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));

      const result = await stationService.fetchPlacesOfService('18');

      expect(result).toStrictEqual([]);
    });

    describe(`${StationService.prototype.createEta.name}`, () => {
      it('should return success for Eta range', async () => {
        jest
          .spyOn(httpService, 'post')
          .mockImplementationOnce(() =>
            of(wrapInAxiosResponse(STATION_ASSIGN_TEAM_CREATE_ETA_RESPONSE))
          );
        expect(await stationService.createEta(ETA_RANGE_QUERY_MOCK)).toEqual(
          CREATE_ETA_RANGE_RESPONSE
        );
      });
    });
  });

  describe(`${StationService.prototype.fetchStates.name}`, () => {
    it(`get all active states`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ active: [STATION_STATE_FETCH_MOCK] }))
        );

      const result = await stationService.fetchStates();
      expect(result).toEqual([STATE_FETCH_RESPONSE_MOCK]);
    });
  });

  describe(`${StationService.prototype.fetchRiskStratificationProtocol.name}`, () => {
    it('should fetch Risk Stratification Protocol from station', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(
            wrapInAxiosResponse(
              STATION_RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK
            )
          )
        );

      const result = await stationService.fetchRiskStratificationProtocol(
        RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
        PROTOCOL_ID
      );
      expect(result).toEqual(RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK);
    });

    it('should throw error when there is no Risk Stratification Protocol from station', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse({})));

      await expect(
        stationService.fetchRiskStratificationProtocol(
          RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
          PROTOCOL_ID
        )
      ).rejects.toThrow(
        `Failed to get risk stratification protocol with id: ${PROTOCOL_ID}`
      );
    });
  });

  describe(`${StationService.prototype.updateCareRequestStatus.name}`, () => {
    it(`update care request status`, async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(true)));

      const result = await stationService.updateCareRequestStatus(
        UPDATE_CARE_REQUEST_MOCK
      );
      expect(result).toEqual(true);
    });
  });

  describe(`${StationService.prototype.updateCareRequestStatus.name}`, () => {
    it('accept care request if feasible', async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(true)));

      const result = await stationService.accepCareRequesttIfFeasible(
        ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK
      );
      expect(result).toEqual(true);
    });
  });

  describe(`${StationService.prototype.getClassifications.name}`, () => {
    it(`get insurance classification list`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_INSURANCE_CLASSIFICATION))
        );

      const result = await stationService.getClassifications();
      expect(result).toEqual(MOCK_INSURANCE_CLASSIFICATION);
    });
  });

  describe(`${StationService.prototype.getCareRequest.name}`, () => {
    it(`get care request`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE_MOCK))
        );

      const result = await stationService.getCareRequest('123');
      expect(result).toEqual(CARE_REQUEST_RESPONSE_MOCK);
    });
  });

  describe(`${StationService.prototype.updateCareRequest.name}`, () => {
    it(`update care request`, async () => {
      jest.spyOn(httpService, 'put').mockImplementationOnce(() =>
        of(
          wrapInAxiosResponse({
            ...STATION_CARE_REQUEST_RESPONSE_MOCK,
            id: 1,
          })
        )
      );

      await expect(
        stationService.updateCareRequest('1', CARE_REQUEST_MOCK)
      ).resolves.toEqual(CARE_REQUEST_RESPONSE_MOCK);
    });
  });

  describe(`${StationService.prototype.getTimeWindowsAvailability.name}`, () => {
    it('get care request time windows availability', async () => {
      jest.spyOn(httpService, 'get').mockImplementationOnce(() =>
        of(
          wrapInAxiosResponse({
            time_windows_availability: STATION_TIME_WINDOWS_AVAILABILITIES_MOCK,
          })
        )
      );

      const result = await stationService.getTimeWindowsAvailability('777');
      expect(result).toEqual(TIME_WINDOWS_AVAILABILITIES_MOCK);
    });

    it('get care request empty time windows availability', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse({})));

      const result = await stationService.getTimeWindowsAvailability('777');
      expect(result).toEqual([]);
    });
  });

  describe(`${StationService.prototype.fetchChannelItem.name}`, () => {
    it('should return channel item with id', async () => {
      const channelItemId = '159';
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_STATION_CHANNEL_ITEM))
        );
      const response = await stationService.fetchChannelItem(channelItemId);
      expect(response).toEqual(MOCK_CHANNEL_ITEM);
    });
  });
});
