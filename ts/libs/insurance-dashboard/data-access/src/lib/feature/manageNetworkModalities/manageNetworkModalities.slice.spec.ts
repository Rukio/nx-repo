import { setupTestStore } from '../../../testUtils';
import {
  mockedNetworkModalityConfigs,
  mockedNetworkModalityConfig,
  mockedNetworkModalityConfigPatchPayload,
  networkModalitiesSlice,
  mockedStateAbbrs,
  buildNetworkModalityConfigsPath,
  buildNetworkStatesPath,
} from '../../domain';
import {
  manageNetworkModalitiesInitialState,
  manageNetworkModalitiesSlice,
  resetNetworkModalityConfigs,
  selectNetworkModalityConfigs,
  selectNetworkModalitiesLoadingState,
  selectSelectedNetworkModalityConfigs,
  updateNetworkModalityConfigs,
  MANAGE_NETWORK_MODALITIES_KEY,
  patchUpdateNetworkStatesAndModalityConfigurations,
} from './manageNetworkModalities.slice';
import { buildBillingCitiesModalityConfigsHierarchy } from '../../utils/mappers';
import { NetworkModalityConfigWithOptionalId } from '../../types';

const mockedNetworkId = '1';

describe('manageNetworkModalitites.slice', () => {
  it('should initialize default reducer state', () => {
    const state = manageNetworkModalitiesSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(manageNetworkModalitiesInitialState);
  });

  describe('reducers', () => {
    it('updateNetworkModalitiesConfigs should update the state', () => {
      const store = setupTestStore();

      const initialModalityConfigurations = selectNetworkModalityConfigs(
        store.getState()
      );
      const initialSelectedModalityConfigs =
        selectSelectedNetworkModalityConfigs(store.getState());
      expect(initialModalityConfigurations).toEqual(
        manageNetworkModalitiesInitialState.configs
      );
      expect(initialSelectedModalityConfigs).toEqual(
        buildBillingCitiesModalityConfigsHierarchy(
          initialModalityConfigurations
        )
      );

      // will add new modality config to state
      store.dispatch(updateNetworkModalityConfigs(mockedNetworkModalityConfig));
      const updatedModalityConfigurationsWithModalityConfigAdded =
        selectNetworkModalityConfigs(store.getState());
      const updatedSelectedModalityConfigsWithModalityConfigAdded =
        selectSelectedNetworkModalityConfigs(store.getState());
      expect(updatedModalityConfigurationsWithModalityConfigAdded).toEqual([
        mockedNetworkModalityConfig,
      ]);
      expect(updatedSelectedModalityConfigsWithModalityConfigAdded).toEqual(
        buildBillingCitiesModalityConfigsHierarchy([
          mockedNetworkModalityConfig,
        ])
      );

      // will remove existing modality when toggle off
      store.dispatch(updateNetworkModalityConfigs(mockedNetworkModalityConfig));

      const updatedModalityConfigurationsWithModalityConfigRemoved =
        selectNetworkModalityConfigs(store.getState());
      const updatedSelectedModalityConfigsWithModalityConfigRemoved =
        selectSelectedNetworkModalityConfigs(store.getState());
      expect(updatedModalityConfigurationsWithModalityConfigRemoved).toEqual(
        []
      );
      expect(updatedSelectedModalityConfigsWithModalityConfigRemoved).toEqual(
        buildBillingCitiesModalityConfigsHierarchy([])
      );
    });

    it('getNetworkModalitiesConfigs should get the network modalities configs once it is loaded', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          configs: [mockedNetworkModalityConfig],
        })
      );
      const store = setupTestStore();
      await store.dispatch(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfig.networkId
        )
      );
      const configs = selectNetworkModalityConfigs(store.getState());
      expect(configs).toEqual([
        {
          id: mockedNetworkModalityConfig.id,
          networkId: mockedNetworkModalityConfig.networkId,
          billingCityId: mockedNetworkModalityConfig.billingCityId,
          modalityId: mockedNetworkModalityConfig.modalityId,
          serviceLineId: mockedNetworkModalityConfig.serviceLineId,
        },
      ]);
    });

    it('patchNetworkModalityConfigs should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
      const store = setupTestStore();

      const initialLoadingState = selectNetworkModalitiesLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworkModalitiesInitialState.isLoading,
        isError: manageNetworkModalitiesInitialState.isError,
        isSuccess: manageNetworkModalitiesInitialState.isSuccess,
        error: manageNetworkModalitiesInitialState.error,
      });

      await store.dispatch(
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfigPatchPayload
        )
      );
      const fulfilledLoadingState = selectNetworkModalitiesLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('patchNetworkModalityConfigs should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore();

      const initialLoadingState = selectNetworkModalitiesLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworkModalitiesInitialState.isLoading,
        isError: manageNetworkModalitiesInitialState.isError,
        isSuccess: manageNetworkModalitiesInitialState.isSuccess,
        error: manageNetworkModalitiesInitialState.error,
      });

      await store.dispatch(
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfigPatchPayload
        )
      );
      const rejectedLoadingState = selectNetworkModalitiesLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('patchNetworkModalityConfigs should update the state on pending status', async () => {
      fetchMock.mockResponse(JSON.stringify({}));
      const store = setupTestStore();

      const initialLoadingState = selectNetworkModalitiesLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: manageNetworkModalitiesInitialState.isLoading,
        isError: manageNetworkModalitiesInitialState.isError,
        isSuccess: manageNetworkModalitiesInitialState.isSuccess,
        error: manageNetworkModalitiesInitialState.error,
      });

      store.dispatch(
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
          mockedNetworkModalityConfigPatchPayload
        )
      );
      const pendingLoadingState = selectNetworkModalitiesLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });
  });

  it('resetNetworkModalityConfigs should update the state', async () => {
    fetchMock.mockResponse(() => {
      return Promise.resolve(
        JSON.stringify({ configs: mockedNetworkModalityConfigs })
      );
    });

    const store = setupTestStore();

    await store.dispatch(
      networkModalitiesSlice.endpoints.getNetworkModalityConfigs.initiate(
        mockedNetworkModalityConfig.networkId
      )
    );

    const initialMarketsModalityConfigs = selectNetworkModalityConfigs(
      store.getState()
    );
    expect(initialMarketsModalityConfigs).toEqual(mockedNetworkModalityConfigs);

    const newNetworkModalityConfig: NetworkModalityConfigWithOptionalId = {
      networkId: mockedNetworkModalityConfig.networkId,
      billingCityId: '999',
      serviceLineId: '999',
      modalityId: '999',
    };

    store.dispatch(updateNetworkModalityConfigs(newNetworkModalityConfig));

    const updatedMarketsModalityConfigs = selectNetworkModalityConfigs(
      store.getState()
    );
    expect(updatedMarketsModalityConfigs).toEqual([
      ...mockedNetworkModalityConfigs,
      newNetworkModalityConfig,
    ]);

    await store.dispatch(
      resetNetworkModalityConfigs(mockedNetworkModalityConfig.networkId)
    );

    const resetMarketsModalityConfigs = selectNetworkModalityConfigs(
      store.getState()
    );
    expect(resetMarketsModalityConfigs).toEqual(mockedNetworkModalityConfigs);
  });

  it('patchUpdateNetworkStatesAndModalityConfigurations should update the state on pending status', () => {
    fetchMock.mockOnceIf(
      new RegExp(buildNetworkModalityConfigsPath(mockedNetworkId)),
      JSON.stringify({
        configs: mockedNetworkModalityConfigs,
      })
    );
    fetchMock.mockOnceIf(
      new RegExp(buildNetworkStatesPath(mockedNetworkId)),
      JSON.stringify({ state_abbrs: mockedStateAbbrs })
    );

    const store = setupTestStore({
      [MANAGE_NETWORK_MODALITIES_KEY]: {
        ...manageNetworkModalitiesInitialState,
        configs: mockedNetworkModalityConfigs,
      },
    });
    const initialLoadingState = selectNetworkModalitiesLoadingState(
      store.getState()
    );
    expect(initialLoadingState).toEqual({
      isLoading: manageNetworkModalitiesInitialState.isLoading,
      isError: manageNetworkModalitiesInitialState.isError,
      isSuccess: manageNetworkModalitiesInitialState.isSuccess,
      error: manageNetworkModalitiesInitialState.error,
    });

    store.dispatch(
      patchUpdateNetworkStatesAndModalityConfigurations({
        networkId: mockedNetworkId,
        stateAbbrs: mockedStateAbbrs,
      })
    );
    const pendingLoadingState = selectNetworkModalitiesLoadingState(
      store.getState()
    );
    expect(pendingLoadingState).toEqual({
      isLoading: true,
      isError: false,
      isSuccess: false,
      error: undefined,
    });

    const networkModalityConfigs = selectNetworkModalityConfigs(
      store.getState()
    );
    expect(networkModalityConfigs).toEqual(mockedNetworkModalityConfigs);
  });

  it('patchUpdateNetworkStatesAndModalityConfigurations should update the state on fulfilled status', async () => {
    fetchMock.mockOnceIf(
      new RegExp(buildNetworkModalityConfigsPath(mockedNetworkId)),
      JSON.stringify({
        configs: mockedNetworkModalityConfigs,
      })
    );
    fetchMock.mockOnceIf(
      new RegExp(buildNetworkStatesPath(mockedNetworkId)),
      JSON.stringify({ state_abbrs: mockedStateAbbrs })
    );

    const store = setupTestStore({
      [MANAGE_NETWORK_MODALITIES_KEY]: {
        ...manageNetworkModalitiesInitialState,
        configs: mockedNetworkModalityConfigs,
      },
    });
    const initialLoadingState = selectNetworkModalitiesLoadingState(
      store.getState()
    );
    expect(initialLoadingState).toEqual({
      isLoading: manageNetworkModalitiesInitialState.isLoading,
      isError: manageNetworkModalitiesInitialState.isError,
      isSuccess: manageNetworkModalitiesInitialState.isSuccess,
      error: manageNetworkModalitiesInitialState.error,
    });

    await store.dispatch(
      patchUpdateNetworkStatesAndModalityConfigurations({
        networkId: mockedNetworkId,
        stateAbbrs: mockedStateAbbrs,
      })
    );
    const fulfilledLoadingState = selectNetworkModalitiesLoadingState(
      store.getState()
    );
    expect(fulfilledLoadingState).toEqual({
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: undefined,
    });
  });
});
