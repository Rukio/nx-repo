import {
  testApiSuccessResponse,
  testApiErrorResponse,
  testApiUpdateErrorResponse,
  testApiUpdateSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import {
  MODALITY_CONFIGS_API_FRAGMENT,
  buildNetworkModalityConfigsPath,
  networkModalitiesSlice,
  selectDomainNetworkModalityConfigs,
} from './networkModalities.slice';
import { setupTestStore } from '../../../testUtils';
import {
  mockedNetworkModalityConfigPatchPayload,
  mockedNetworkModalityConfigs,
  mockedNetworkModalityConfig,
} from './mocks';
import { environment } from '../../../environments/environment';
import { NETWORKS_API_PATH } from '../networksSlice';

const { serviceURL } = environment;

describe('networkModalitiesSlice.slice', () => {
  describe('build api urls', () => {
    it('buildNetworkPath build correct api url', () => {
      const networkId = mockedNetworkModalityConfig.networkId;

      const path = buildNetworkModalityConfigsPath(networkId);

      expect(path).toEqual(
        `${NETWORKS_API_PATH}/${networkId}/${MODALITY_CONFIGS_API_FRAGMENT}`
      );
    });
  });

  describe('getNetworkModalityConfigs', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
      const store = setupTestStore();

      await store.dispatch(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfig.networkId
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        serviceURL +
          buildNetworkModalityConfigsPath(mockedNetworkModalityConfig.networkId)
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfig.networkId
        )
      );
      testApiSuccessResponse(action, mockedNetworkModalityConfigs);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfig.networkId
        )
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('patchNetworkModalityConfigs', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
      const store = setupTestStore();

      await store.dispatch(
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfigPatchPayload
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('PATCH');
      expect(url).toEqual(
        serviceURL +
          buildNetworkModalityConfigsPath(mockedNetworkModalityConfig.networkId)
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfigPatchPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockedNetworkModalityConfigs);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfigPatchPayload
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });

    it('should select modalities from store', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
      const store = setupTestStore();
      await store.dispatch(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfig.networkId
        )
      );

      const { data: networkModalitiesConfigs } =
        selectDomainNetworkModalityConfigs(
          mockedNetworkModalityConfig.networkId
        )(store.getState());
      expect(networkModalitiesConfigs).toEqual(mockedNetworkModalityConfigs);
    });
  });
});
