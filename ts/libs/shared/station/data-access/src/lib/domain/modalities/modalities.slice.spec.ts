import { setupTestStore } from '../../../testUtils';
import {
  modalitiesSlice,
  MODALITIES_BASE_PATH,
  MODALITIES_CONFIGS_SEGMENT,
  PatchUpdateModalityConfigsPayload,
  PatchUpdateMarketsModalityConfigsPayload,
  MODALITIES_MARKETS_CONFIGS_SEGMENT,
  MODALITIES_NETWORKS_CONFIGS_SEGMENT,
  GetNetworksModalityConfigsQuery,
} from './modalities.slice';
import {
  mockedModalitiesList,
  mockedModalityConfigsList,
  mockedMarketsModalityConfigs,
  mockedNetworksModalityConfigs,
} from './mocks';
import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
  testApiUpdateSuccessResponse,
  testApiUpdateErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

const mockedPatchRequestData: PatchUpdateModalityConfigsPayload = {
  service_line_id: 1,
  configs: [
    {
      service_line_id: 1,
      market_id: 1,
      modality_id: 1,
      insurance_plan_id: 1,
    },
  ],
};

const mockedPatchMarketsModalitiesRequestData: PatchUpdateMarketsModalityConfigsPayload =
  {
    service_line_id: 1,
    configs: [
      {
        service_line_id: 1,
        market_id: 1,
        modality_id: 1,
      },
    ],
  };

describe('modalities.slice', () => {
  describe('getModalities', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ modalities: mockedModalitiesList })
      );
      const store = setupTestStore();
      await store
        .dispatch(modalitiesSlice.endpoints.getModalities.initiate())
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(`${stationURL}${MODALITIES_BASE_PATH}`);
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ modalities: mockedModalitiesList })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getModalities.initiate()
      );
      testApiSuccessResponse(action, mockedModalitiesList);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getModalities.initiate()
      );
      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('getModalityConfigs', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedModalityConfigsList));
      const store = setupTestStore();
      await store
        .dispatch(modalitiesSlice.endpoints.getModalityConfigs.initiate(1))
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(
            `${stationURL}${MODALITIES_BASE_PATH}${MODALITIES_CONFIGS_SEGMENT}?service_line_id=1`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedModalityConfigsList));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getModalityConfigs.initiate(1)
      );
      testApiSuccessResponse(action, mockedModalityConfigsList.configs);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getModalityConfigs.initiate(1)
      );
      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('patchModalityConfigs', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedModalityConfigsList));
      const store = setupTestStore();
      await store
        .dispatch(
          modalitiesSlice.endpoints.patchModalityConfigs.initiate(
            mockedPatchRequestData
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('PATCH');
          expect(url).toEqual(
            `${stationURL}${MODALITIES_BASE_PATH}${MODALITIES_CONFIGS_SEGMENT}?service_line_id=${mockedPatchRequestData.service_line_id}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedModalityConfigsList));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.patchModalityConfigs.initiate(
          mockedPatchRequestData
        )
      );
      testApiUpdateSuccessResponse(action, mockedModalityConfigsList.configs);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.patchModalityConfigs.initiate(
          mockedPatchRequestData
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getMarketsModalityConfigs', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedMarketsModalityConfigs));
      const store = setupTestStore();
      await store
        .dispatch(
          modalitiesSlice.endpoints.getMarketsModalityConfigs.initiate(1)
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(
            `${stationURL}${MODALITIES_BASE_PATH}${MODALITIES_MARKETS_CONFIGS_SEGMENT}?service_line_id=1`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedMarketsModalityConfigs));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getMarketsModalityConfigs.initiate(1)
      );
      testApiSuccessResponse(action, mockedMarketsModalityConfigs.configs);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getMarketsModalityConfigs.initiate(1)
      );
      testApiErrorResponse(action, 'Failed');
    });
  });

  describe('patchMarketsModalityConfigs', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedModalityConfigsList));
      const store = setupTestStore();
      await store
        .dispatch(
          modalitiesSlice.endpoints.patchMarketsModalityConfigs.initiate(
            mockedPatchRequestData
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('PATCH');
          expect(url).toEqual(
            `${stationURL}${MODALITIES_BASE_PATH}${MODALITIES_MARKETS_CONFIGS_SEGMENT}?service_line_id=${mockedPatchRequestData.service_line_id}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedModalityConfigsList));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.patchMarketsModalityConfigs.initiate(
          mockedPatchMarketsModalitiesRequestData
        )
      );
      testApiUpdateSuccessResponse(action, mockedModalityConfigsList.configs);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.patchMarketsModalityConfigs.initiate(
          mockedPatchMarketsModalitiesRequestData
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });

  describe('getNetworksModalityConfigs', () => {
    it('should make correct API call without params', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedNetworksModalityConfigs));
      const store = setupTestStore();
      await store.dispatch(
        modalitiesSlice.endpoints.getNetworksModalityConfigs.initiate()
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${MODALITIES_BASE_PATH}${MODALITIES_NETWORKS_CONFIGS_SEGMENT}`
      );
    });

    it('should make correct API call with params', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedNetworksModalityConfigs));
      const mockedParams: GetNetworksModalityConfigsQuery = {
        network_id: '1',
        service_line_id: '1',
      };
      const store = setupTestStore();
      await store.dispatch(
        modalitiesSlice.endpoints.getNetworksModalityConfigs.initiate(
          mockedParams
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${MODALITIES_BASE_PATH}${MODALITIES_NETWORKS_CONFIGS_SEGMENT}?network_id=${mockedParams.network_id}&service_line_id=${mockedParams.service_line_id}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedNetworksModalityConfigs));
      const store = setupTestStore();
      const action = await store.dispatch(
        modalitiesSlice.endpoints.getNetworksModalityConfigs.initiate()
      );

      testApiSuccessResponse(action, mockedNetworksModalityConfigs.configs);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();
      const action = await store.dispatch(
        modalitiesSlice.endpoints.getNetworksModalityConfigs.initiate()
      );

      testApiErrorResponse(action, 'Failed');
    });
  });
});
