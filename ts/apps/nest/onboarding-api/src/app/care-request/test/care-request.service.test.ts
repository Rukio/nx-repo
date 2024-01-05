import { HttpModule, HttpService } from '@nestjs/axios';
import { INestApplication, InternalServerErrorException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import CareRequestService from '../care-request.service';
import {
  PARTNER_REFERRAL_MOCK,
  STATION_PARTNER_REFERRAL_MOCK,
} from './mocks/care-request.service.mock';
import mapper from '../care-request.mapper';
import stationMapper from '../../station/station.mapper';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { mockLogger } from '../../logger/mocks/logger.mock';
import StationService from '../../station/station.service';
import { mockAuthService } from '../../common/mocks/auth.mock';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import {
  CARE_REQUEST_MOCK,
  CARE_REQUEST_RESPONSE_MOCK,
  STATION_CARE_REQUEST_RESPONSE_MOCK,
  TIME_WINDOWS_AVAILABILITIES_MOCK,
} from '../../station/test/mocks/station.mapper.mock';

describe(`${CareRequestService.name}`, () => {
  let app: INestApplication;
  let careRequestService: CareRequestService;
  let httpService: HttpService;
  let stationService: StationService;
  const spyMapperResponse = jest.spyOn(
    stationMapper,
    'StationCareRequestToCareRequest'
  );

  beforeAll(async () => {
    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [CareRequestService, StationService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        AuthModule.register(mockOptions),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    httpService = module.get<HttpService>(HttpService);
    careRequestService = module.get<CareRequestService>(CareRequestService);
    stationService = module.get<StationService>(StationService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${CareRequestService.prototype.updateStatus.name}`, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update the CR status even if no shift team', async () => {
      const requestBody = {
        status: 'archived',
        comment: 'Test',
        shiftTeamId: 0,
        reassignmentReasonText: '',
        reassignmentReasonOtherText: '',
      };
      const httpPatchSpy = jest.spyOn(httpService, 'patch');
      httpPatchSpy.mockImplementationOnce(() => of(wrapInAxiosResponse(true)));

      expect(httpPatchSpy).toHaveBeenCalledTimes(0);

      const actualResponse = await careRequestService.updateStatus(
        'id',
        requestBody
      );
      expect(actualResponse).toEqual(true);

      expect(httpPatchSpy).toHaveBeenCalledTimes(1);
      expect(httpPatchSpy).toHaveBeenCalledWith(
        // URL endpoint
        expect.any(String),
        {
          comment: 'Test',
          meta_data: undefined,
          reassignment_reason: '',
          reassignment_reason_other: '',
          request_status: 'archived',
        },
        // Headers
        expect.any(Object)
      );
    });

    it('should update the CR status with shift team Id', async () => {
      const requestBody = {
        status: 'accepted',
        comment: 'Test',
        shiftTeamId: 34343,
        reassignmentReasonText: 'Patient Time Window needs adjustment',
        reassignmentReasonOtherText: '',
      };
      const mockUpdateCareRequestStatus = jest
        .spyOn(stationService, 'updateCareRequestStatus')
        .mockResolvedValue(true);

      expect(mockUpdateCareRequestStatus).toHaveBeenCalledTimes(0);

      const actualResponse = await careRequestService.updateStatus(
        'id',
        requestBody
      );
      expect(actualResponse).toEqual(true);

      expect(mockUpdateCareRequestStatus).toHaveBeenCalledTimes(1);
    });

    it('should accept the CR if feasible', async () => {
      const requestBody = {
        comment: 'Foo Bar',
        shiftTeamId: 7777,
        reassignmentReasonText: 'Accepted',
        reassignmentReasonOtherText: '',
      };
      const mockAcceptCareRequestIfFeasible = jest
        .spyOn(stationService, 'accepCareRequesttIfFeasible')
        .mockResolvedValue(true);

      expect(mockAcceptCareRequestIfFeasible).toHaveBeenCalledTimes(0);

      const actualResponse = await careRequestService.acceptIfFeasible(
        'id',
        requestBody
      );
      expect(actualResponse).toEqual(true);

      expect(mockAcceptCareRequestIfFeasible).toHaveBeenCalledTimes(1);
    });

    it('fetch time windows availability by Care Request id', async () => {
      const mockGetTimeWindowsAvailability = jest
        .spyOn(stationService, 'getTimeWindowsAvailability')
        .mockResolvedValue(TIME_WINDOWS_AVAILABILITIES_MOCK);

      expect(mockGetTimeWindowsAvailability).toHaveBeenCalledTimes(0);

      const actualResponse =
        await careRequestService.getTimeWindowsAvailability('id');
      expect(actualResponse).toEqual(TIME_WINDOWS_AVAILABILITIES_MOCK);

      expect(mockGetTimeWindowsAvailability).toHaveBeenCalledTimes(1);
    });

    it('should create care request', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE_MOCK))
        );
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await careRequestService.create(CARE_REQUEST_MOCK);
      expect(response).toEqual(CARE_REQUEST_RESPONSE_MOCK);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        STATION_CARE_REQUEST_RESPONSE_MOCK
      );
    });

    it('fetch Care Request by id', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE_MOCK))
        );
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await careRequestService.fetch('id');
      expect(response).toEqual(CARE_REQUEST_RESPONSE_MOCK);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        STATION_CARE_REQUEST_RESPONSE_MOCK
      );
    });

    it('update Care Request', async () => {
      jest
        .spyOn(httpService, 'put')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE_MOCK))
        );
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await careRequestService.update('id', CARE_REQUEST_MOCK);
      expect(response).toEqual(CARE_REQUEST_RESPONSE_MOCK);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        STATION_CARE_REQUEST_RESPONSE_MOCK
      );
    });

    it('patch Care Request', async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE_MOCK))
        );
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await careRequestService.patch('id', CARE_REQUEST_MOCK);
      expect(response).toEqual(CARE_REQUEST_RESPONSE_MOCK);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        STATION_CARE_REQUEST_RESPONSE_MOCK
      );
    });

    it('update care request channel item', async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE_MOCK))
        );
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await careRequestService.assignChannelItem('id', 1);
      expect(response).toEqual(CARE_REQUEST_RESPONSE_MOCK);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        STATION_CARE_REQUEST_RESPONSE_MOCK
      );
    });

    it('update Care Request and patch Partner referral', async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_PARTNER_REFERRAL_MOCK))
        );
      const httpPutSpy = jest.spyOn(httpService, 'put');
      httpPutSpy.mockImplementationOnce(() =>
        of(wrapInAxiosResponse(STATION_CARE_REQUEST_RESPONSE_MOCK))
      );
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await careRequestService.update('id', {
        ...CARE_REQUEST_MOCK,
        partnerReferral: PARTNER_REFERRAL_MOCK,
      });
      expect(response).toEqual(CARE_REQUEST_RESPONSE_MOCK);
      expect(spyMapperResponse).toHaveBeenCalledWith(
        STATION_CARE_REQUEST_RESPONSE_MOCK
      );
    });

    it('patch partner referral and CR', async () => {
      const EXTENDED_STATION_CARE_REQUEST_MOCK = {
        ...STATION_CARE_REQUEST_RESPONSE_MOCK,
        partner_referral_id: 15,
        partner_referral_name: 'James Star',
        partner_referral_phone: '+18003213132',
        partner_referral_relationship: 'friend',
      };
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_PARTNER_REFERRAL_MOCK))
        );
      const httpPatchSpy = jest.spyOn(httpService, 'patch');
      httpPatchSpy.mockImplementationOnce(() =>
        of(wrapInAxiosResponse(EXTENDED_STATION_CARE_REQUEST_MOCK))
      );

      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await careRequestService.patch('id', {
        ...CARE_REQUEST_MOCK,
        partnerReferral: PARTNER_REFERRAL_MOCK,
      });
      expect(response).toEqual({
        ...CARE_REQUEST_RESPONSE_MOCK,
        partnerReferral: {
          id: 15,
          relationship: 'friend',
          phone: '+18003213132',
          firstName: 'James',
          lastName: 'Star',
        },
      });
      expect(spyMapperResponse).toHaveBeenCalledWith(
        EXTENDED_STATION_CARE_REQUEST_MOCK
      );
    });

    it('Patch partner referral', async () => {
      const data = {
        relationship: 'friend',
        phone: '+18003213132',
        firstName: 'James',
        lastName: 'Star',
      };
      const ppMapper = jest.spyOn(
        mapper,
        'StationPartnerReferraltoPartnerReferral'
      );
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_PARTNER_REFERRAL_MOCK))
        );
      expect(ppMapper).toHaveBeenCalledTimes(0);
      const response = await careRequestService.patchPartnerReferral(
        15,
        data,
        'test'
      );
      expect(response).toEqual(data);
      expect(ppMapper).toHaveBeenCalledWith(STATION_PARTNER_REFERRAL_MOCK);
    });

    it('Patch partner referral - missing partner name', async () => {
      const data = {
        relationship: 'friend',
        phone: '+18003213132',
      };
      const stationRes = {
        ...STATION_PARTNER_REFERRAL_MOCK,
        contact_name: undefined,
      };
      const ppMapper = jest.spyOn(
        mapper,
        'StationPartnerReferraltoPartnerReferral'
      );
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(stationRes)));
      expect(ppMapper).toHaveBeenCalledTimes(0);
      const response = await careRequestService.patchPartnerReferral(
        15,
        data,
        'test'
      );
      expect(response).toEqual(data);
      expect(ppMapper).toHaveBeenCalledWith(stationRes);
    });

    it('Patch partner referral internal server error', async () => {
      const data = {
        id: 15,
        relationship: 'friend',
        phone: '+18003213132',
        firstName: 'James',
        lastName: 'Star',
      };
      const httpPatchSpy = jest.spyOn(httpService, 'patch');
      httpPatchSpy.mockImplementationOnce(() => {
        throw new InternalServerErrorException();
      });

      expect(mockLogger.error).toHaveBeenCalledTimes(0);

      const response = await careRequestService.patchPartnerReferral(15, data);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Partner Referral update error: Internal Server Error',
        [data.id]
      );

      expect(response).toEqual(null);
    });
  });
});
