import { setupTestStore } from '../../../testUtils';
import {
  mockInsurancePayer,
  mockPlacesOfService,
  mockPlacesOfServiceQuery,
  mockSelfScheduleData,
  mockCheckMarketFeasibilityPayload,
  mockCheckMarketFeasibilityData,
  mockedInsuranceNetworksList,
  mockRiskStratificationProtocol,
  mockGetRiskStratificationProtocolQuery,
  mockCreateCareRequestPayload,
  mockCreateCareRequestResponse,
  mockCareRequest,
  mockEtaRange,
  mockedInsuranceClassifications,
  mockUpdateCareRequestPayload,
  mockChannelItem,
} from './mocks';
import {
  buildCachePath,
  buildPlacesOfServicePath,
  buildCheckMarketFeasibilityPath,
  selectCachedSelfScheduleData,
  selectCheckMarketFeasibilityData,
  selfScheduleSlice,
  buildNotificationJobPath,
  buildNotificationsPath,
  SELF_SCHEDULE_API_PATH,
  NOTIFICATION_SEGMENT,
  selectInsurancePayersDomain,
  buildInsurancePayersPath,
  buildInsuranceNetworksPath,
  selectInsuranceNetworks,
  INSURANCE_NETWORKS_SEGMENT,
  buildGetRiskStratificationProtocolPath,
  RISK_STRATIFICATION_PROTOCOL_SEGMENT,
  selectRiskStratificationProtocol,
  buildCareRequestPath,
  buildCareRequestStatusPath,
  buildEtaRangesPath,
  selectCareRequest,
  CARE_REQUEST_SEGMENT,
  CARE_REQUEST_STATUS_SEGMENT,
  ETA_RANGES_SEGMENT,
  buildInsuranceClassificationsPath,
  selectInsuranceClassifications,
  INSURANCE_CLASSIFICATIONS_SEGMENT,
  selectDomainChannelItem,
  buildChannelItemPath,
  CHANNEL_ITEMS_SEGMENT,
} from './selfSchedule.slice';
import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
  testApiUpdateErrorResponse,
  testApiUpdateSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import {
  CancelSelfScheduleNotificationJobResponse,
  CreateSelfScheduleNotificationJobResponse,
  ListNetworksPayload,
  PatchCareRequestStatusResponse,
  UpdateEtaRangesResponse,
} from '../../types';
import { RequestStatus } from '@*company-data-covered*/consumer-web-types';

const { serviceURL } = environment;

const mockCareRequestId = 1;
const mockJobId = '2';
const mockedInsurancePayerId = '1';
const mockRiskStratificationProtocolId = '1';

const mockedSearchInsuranceNetworksPayload: ListNetworksPayload = {
  payerIds: [mockedInsurancePayerId],
};

describe('selfSchedule.slice', () => {
  describe('getCachedSelfScheduleData', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockSelfScheduleData }));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getCachedSelfScheduleData.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(serviceURL + buildCachePath());
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockSelfScheduleData }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getCachedSelfScheduleData.initiate()
      );
      testApiSuccessResponse(action, mockSelfScheduleData);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getCachedSelfScheduleData.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('cacheSelfScheduleData', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ success: true }));
      const { store } = setupTestStore();
      await store
        .dispatch(
          selfScheduleSlice.endpoints.cacheSelfScheduleData.initiate(
            mockSelfScheduleData
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('POST');
          expect(url).toEqual(`${serviceURL}${buildCachePath()}`);
        });
    });

    it('successful response', async () => {
      const mockResponse = { success: true };
      fetchMock.mockResponse(JSON.stringify(mockResponse));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.cacheSelfScheduleData.initiate(
          mockSelfScheduleData
        )
      );
      testApiUpdateSuccessResponse(action, mockResponse);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.cacheSelfScheduleData.initiate(
          mockSelfScheduleData
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getPlacesOfService', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPlacesOfService }));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getPlacesOfService.initiate(
          mockPlacesOfServiceQuery
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      const placesOfServicePath = buildPlacesOfServicePath(
        mockPlacesOfServiceQuery.billingCityId
      );

      expect(method).toEqual('GET');
      expect(url).toEqual(`${serviceURL}${placesOfServicePath}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockPlacesOfService }));
      const store = setupTestStore();

      const action = await store.store.dispatch(
        selfScheduleSlice.endpoints.getPlacesOfService.initiate(
          mockPlacesOfServiceQuery
        )
      );
      testApiSuccessResponse(action, mockPlacesOfService);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.store.dispatch(
        selfScheduleSlice.endpoints.getPlacesOfService.initiate(
          mockPlacesOfServiceQuery
        )
      );
      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('createNotificationJob', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ success: true, jobId: mockJobId })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.createNotificationJob.initiate(
          mockCareRequestId
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(`${serviceURL}${buildNotificationsPath()}`);
    });

    it('successful response', async () => {
      const mockResponse: CreateSelfScheduleNotificationJobResponse = {
        success: true,
        jobId: mockJobId,
      };
      fetchMock.mockResponse(JSON.stringify(mockResponse));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.createNotificationJob.initiate(
          mockCareRequestId
        )
      );
      testApiUpdateSuccessResponse(action, mockResponse);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.createNotificationJob.initiate(
          mockCareRequestId
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('cancelNotificationJob', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ success: true }));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.cancelNotificationJob.initiate(mockJobId)
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('DELETE');
      expect(url).toEqual(
        `${serviceURL}${buildNotificationJobPath(mockJobId)}`
      );
    });

    it('successful response', async () => {
      const mockResponse: CancelSelfScheduleNotificationJobResponse = {
        success: true,
      };
      fetchMock.mockResponse(JSON.stringify(mockResponse));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.cancelNotificationJob.initiate(mockJobId)
      );
      testApiUpdateSuccessResponse(action, mockResponse);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.cancelNotificationJob.initiate(mockJobId)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('checkMarketFeasibility', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockCheckMarketFeasibilityData })
      );

      const { store } = setupTestStore();

      await store
        .dispatch(
          selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
            mockCheckMarketFeasibilityPayload
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('POST');
          expect(url).toEqual(
            `${serviceURL}${buildCheckMarketFeasibilityPath()}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockCheckMarketFeasibilityData })
      );

      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
          mockCheckMarketFeasibilityPayload
        )
      );

      testApiSuccessResponse(action, mockCheckMarketFeasibilityData);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));

      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
          mockCheckMarketFeasibilityPayload
        )
      );

      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('getInsurancePayers', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: [mockInsurancePayer] }));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getInsurancePayers.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${serviceURL}${buildInsurancePayersPath()}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: [mockInsurancePayer] }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getInsurancePayers.initiate()
      );
      testApiSuccessResponse(action, [mockInsurancePayer]);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getInsurancePayers.initiate()
      );

      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('searchNetworksList', () => {
    it('should make correct API call to get the networks that fall under that specific payer', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockedInsuranceNetworksList })
      );
      const { store } = setupTestStore();
      await store.dispatch(
        selfScheduleSlice.endpoints.listNetworks.initiate(
          mockedSearchInsuranceNetworksPayload
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(`${serviceURL}${buildInsuranceNetworksPath()}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockedInsuranceNetworksList })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.listNetworks.initiate(
          mockedSearchInsuranceNetworksPayload
        )
      );
      testApiSuccessResponse(action, mockedInsuranceNetworksList);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.listNetworks.initiate(
          mockedSearchInsuranceNetworksPayload
        )
      );
      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('getRiskStratificationProtocol', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockRiskStratificationProtocol })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getRiskStratificationProtocol.initiate(
          mockGetRiskStratificationProtocolQuery
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${buildGetRiskStratificationProtocolPath(
          mockGetRiskStratificationProtocolQuery.id
        )}?${new URLSearchParams({
          gender: mockGetRiskStratificationProtocolQuery.gender,
          dob: mockGetRiskStratificationProtocolQuery.dob,
        }).toString()}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockRiskStratificationProtocol })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getRiskStratificationProtocol.initiate(
          mockGetRiskStratificationProtocolQuery
        )
      );
      testApiSuccessResponse(action, mockRiskStratificationProtocol);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getRiskStratificationProtocol.initiate(
          mockGetRiskStratificationProtocolQuery
        )
      );

      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('createCareRequest', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockCreateCareRequestResponse })
      );
      const { store } = setupTestStore();
      await store
        .dispatch(
          selfScheduleSlice.endpoints.createCareRequest.initiate(
            mockCreateCareRequestPayload
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('POST');
          expect(url).toEqual(`${serviceURL}${buildCareRequestPath()}`);
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockCreateCareRequestResponse })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.createCareRequest.initiate(
          mockCreateCareRequestPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockCreateCareRequestResponse);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.createCareRequest.initiate(
          mockCreateCareRequestPayload
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getCareRequest', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockCareRequest }));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getCareRequest.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${serviceURL}${buildCareRequestPath()}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockCareRequest }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getCareRequest.initiate()
      );
      testApiSuccessResponse(action, mockCareRequest);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getCareRequest.initiate()
      );
      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('updateCareRequestStatus', () => {
    it('should make correct API call', async () => {
      const mockResponse: PatchCareRequestStatusResponse = { success: true };
      fetchMock.mockResponse(JSON.stringify(mockResponse));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.updateCareRequestStatus.initiate({
          careRequestId: String(mockCareRequest.id),
          status: RequestStatus.complete,
        })
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(`${serviceURL}${buildCareRequestStatusPath()}`);
    });

    it('successful response', async () => {
      const mockResponse: PatchCareRequestStatusResponse = { success: true };
      fetchMock.mockResponse(JSON.stringify(mockResponse));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.updateCareRequestStatus.initiate({
          careRequestId: String(mockCareRequest.id),
          status: RequestStatus.complete,
        })
      );
      testApiUpdateSuccessResponse(action, mockResponse);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.updateCareRequestStatus.initiate({
          careRequestId: String(mockCareRequest.id),
          status: RequestStatus.complete,
        })
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('updateEtaRanges', () => {
    it('should make correct API call', async () => {
      const mockResponse: UpdateEtaRangesResponse = {
        success: true,
        data: mockEtaRange,
      };
      fetchMock.mockResponse(JSON.stringify(mockResponse));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.updateEtaRanges.initiate(mockEtaRange)
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('POST');
      expect(url).toEqual(`${serviceURL}${buildEtaRangesPath()}`);
    });

    it('successful response', async () => {
      const mockResponse: UpdateEtaRangesResponse = {
        success: true,
        data: mockEtaRange,
      };
      fetchMock.mockResponse(JSON.stringify(mockResponse));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.updateEtaRanges.initiate(mockEtaRange)
      );
      testApiUpdateSuccessResponse(action, mockResponse);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.updateEtaRanges.initiate(mockEtaRange)
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getInsuranceClassifications', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockedInsuranceClassifications })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getInsuranceClassifications.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${buildInsuranceClassificationsPath()}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockedInsuranceClassifications })
      );
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getInsuranceClassifications.initiate()
      );
      testApiSuccessResponse(action, mockedInsuranceClassifications);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getInsuranceClassifications.initiate()
      );

      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('updateCareRequest', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockCareRequest }));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.updateCareRequest.initiate(
          mockUpdateCareRequestPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PUT');
      expect(url).toEqual(`${serviceURL}${buildCareRequestPath()}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockCareRequest }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.updateCareRequest.initiate(
          mockUpdateCareRequestPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockCareRequest);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.updateCareRequest.initiate(
          mockUpdateCareRequestPayload
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getChannelItem', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockChannelItem }));
      const { store } = setupTestStore();

      await store.dispatch(
        selfScheduleSlice.endpoints.getChannelItem.initiate(mockChannelItem.id)
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${buildChannelItemPath(mockChannelItem.id)}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockChannelItem }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getChannelItem.initiate(mockChannelItem.id)
      );
      testApiSuccessResponse(action, mockChannelItem);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        selfScheduleSlice.endpoints.getChannelItem.initiate(mockChannelItem.id)
      );

      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('selectors', () => {
    describe('selectCachedSelfScheduleData', () => {
      it('should select cached care request from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockSelfScheduleData }));
        const { store } = setupTestStore();
        await store.dispatch(
          selfScheduleSlice.endpoints.getCachedSelfScheduleData.initiate()
        );

        const { data: cachedSelfScheduleData } = selectCachedSelfScheduleData()(
          store.getState()
        );
        expect(cachedSelfScheduleData).toEqual(mockSelfScheduleData);
      });
    });

    describe('selectPlacesOfService', () => {
      it('should select place of service details from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockSelfScheduleData }));
        const { store } = setupTestStore();
        await store.dispatch(
          selfScheduleSlice.endpoints.getCachedSelfScheduleData.initiate()
        );

        const { data: cachedSelfScheduleData } = selectCachedSelfScheduleData()(
          store.getState()
        );
        expect(cachedSelfScheduleData).toEqual(mockSelfScheduleData);
      });
    });

    describe('selectCheckMarketFeasibilityData', () => {
      it('should select check market feasibility from store', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: mockCheckMarketFeasibilityData })
        );
        const { store } = setupTestStore();
        await store.dispatch(
          selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
            mockCheckMarketFeasibilityPayload
          )
        );

        const { data: checkMarketFeasibilityData } =
          selectCheckMarketFeasibilityData(mockCheckMarketFeasibilityPayload)(
            store.getState()
          );

        expect(checkMarketFeasibilityData).toEqual(
          mockCheckMarketFeasibilityData
        );
      });
    });

    describe('selectInsurancePayersDomain', () => {
      it('should select payers from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: [mockInsurancePayer] }));
        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.getInsurancePayers.initiate()
        );

        const { data: payerDetailsFromState } = selectInsurancePayersDomain(
          store.getState()
        );
        expect(payerDetailsFromState).toEqual([mockInsurancePayer]);
      });
    });

    describe('selectInsuranceNetworks', () => {
      it('should select payers from store', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: mockedInsuranceNetworksList })
        );
        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.listNetworks.initiate(
            mockedSearchInsuranceNetworksPayload
          )
        );

        const { data: insuranceNetworksList } = selectInsuranceNetworks(
          mockedSearchInsuranceNetworksPayload
        )(store.getState());
        expect(insuranceNetworksList).toEqual(mockedInsuranceNetworksList);
      });
    });

    describe('selectRiskStratificationProtocol', () => {
      it('should select risk stratification protocol from store', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: mockRiskStratificationProtocol })
        );
        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.getRiskStratificationProtocol.initiate(
            mockGetRiskStratificationProtocolQuery
          )
        );

        const { data: riskStratificationProtocol } =
          selectRiskStratificationProtocol(
            mockGetRiskStratificationProtocolQuery
          )(store.getState());
        expect(riskStratificationProtocol).toEqual(
          mockRiskStratificationProtocol
        );
      });
    });

    describe('selectCareRequest', () => {
      it('should select care request from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockCareRequest }));
        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.getCareRequest.initiate()
        );

        const { data: careRequest } = selectCareRequest(store.getState());
        expect(careRequest).toEqual(mockCareRequest);
      });
    });

    describe('selectInsuranceClassifications', () => {
      it('should select classifications from store', async () => {
        fetchMock.mockResponse(
          JSON.stringify({ data: mockedInsuranceClassifications })
        );
        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.getInsuranceClassifications.initiate()
        );

        const { data: insuranceClassificationsList } =
          selectInsuranceClassifications()(store.getState());
        expect(insuranceClassificationsList).toEqual(
          mockedInsuranceClassifications
        );
      });
    });

    describe('selectDomainChannelItem', () => {
      it('should select channel item from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockChannelItem }));
        const { store } = setupTestStore();

        await store.dispatch(
          selfScheduleSlice.endpoints.getChannelItem.initiate(
            mockChannelItem.id
          )
        );

        const { data: stateChannelItem } = selectDomainChannelItem(
          mockChannelItem.id
        )(store.getState());
        expect(stateChannelItem).toEqual(mockChannelItem);
      });
    });
  });

  describe('url builders', () => {
    describe('buildNotificationsPath', () => {
      it('should build correct path', () => {
        expect(buildNotificationsPath()).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${NOTIFICATION_SEGMENT}`
        );
      });
    });

    describe('buildNotificationJobPath', () => {
      it('should build correct path', () => {
        expect(buildNotificationJobPath(mockJobId)).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${NOTIFICATION_SEGMENT}/${mockJobId}`
        );
      });
    });

    describe('buildInsuranceNetworksPath', () => {
      it('should build correct path', () => {
        expect(buildInsuranceNetworksPath()).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${INSURANCE_NETWORKS_SEGMENT}`
        );
      });
    });

    describe('buildGetRiskStratificationProtocolPath', () => {
      it('should build correct path', () => {
        expect(
          buildGetRiskStratificationProtocolPath(
            mockRiskStratificationProtocolId
          )
        ).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${RISK_STRATIFICATION_PROTOCOL_SEGMENT}/${mockRiskStratificationProtocolId}`
        );
      });
    });

    describe('buildCareRequestPath', () => {
      it('should build correct path', () => {
        expect(buildCareRequestPath()).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${CARE_REQUEST_SEGMENT}`
        );
      });
    });

    describe('buildCareRequestStatusPath', () => {
      it('should build correct path', () => {
        expect(buildCareRequestStatusPath()).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${CARE_REQUEST_STATUS_SEGMENT}`
        );
      });
    });

    describe('buildEtaRangesPath', () => {
      it('should build correct path', () => {
        expect(buildEtaRangesPath()).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${ETA_RANGES_SEGMENT}`
        );
      });
    });

    describe('buildInsuranceClassificationsPath', () => {
      it('should build correct path', () => {
        expect(buildInsuranceClassificationsPath()).toEqual(
          `${SELF_SCHEDULE_API_PATH}/${INSURANCE_CLASSIFICATIONS_SEGMENT}`
        );
      });
    });

    it('buildChannelItemPath - should build correct path', () => {
      expect(buildChannelItemPath(mockChannelItem.id)).toEqual(
        `${SELF_SCHEDULE_API_PATH}/${CHANNEL_ITEMS_SEGMENT}/${mockChannelItem.id}`
      );
    });
  });
});
