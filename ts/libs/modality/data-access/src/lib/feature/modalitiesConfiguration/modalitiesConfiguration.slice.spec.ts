import { mocked } from 'jest-mock';
import fetchMock from 'jest-fetch-mock';
import { QueryStatus } from '@reduxjs/toolkit/query';
import {
  mockedModalitiesList,
  selectModalities as domainSelectModalities,
  mockedMarketModalityConfig as domainMockedMarketModalityConfig,
  mockedModalityConfig as domainMockedModalityConfig,
  MODALITIES_MARKETS_CONFIGS_SEGMENT,
  modalitiesSlice,
} from '@*company-data-covered*/station/data-access';
import {
  selectModalities,
  initialModalitiesConfigurationState,
  modalityConfigurationsSlice,
  updateMarketModalityConfig,
  updateModalityConfig,
  selectMarketsModalityConfigs,
  selectSelectedMarketsModalityConfigs,
  selectModalityConfigs,
  selectSelectedModalityConfigs,
  patchUpdateModalityConfigurations,
  MODALITY_CONFIGURATIONS_KEY,
  selectModalityConfigurationsLoadingState,
  resetModalityConfigurationsState,
  setShowSuccessMessage,
} from './';
import {
  MARKETS_CONFIGURATION_KEY,
  initialMarketsConfigurationState,
} from '../marketsConfiguration';
import {
  transformModalitiesList,
  buildMarketsModalityConfigsHierarchy,
  buildModalityConfigsHierarchy,
  transformDomainMarketModalityConfig,
  transformDomainModalityConfig,
} from '../../utils/mappers';
import { setupStore } from '../../testUtils';

jest.mock('@*company-data-covered*/station/data-access', () => ({
  ...jest.requireActual('@*company-data-covered*/station/data-access'),
  selectModalities: jest.fn().mockImplementation(() => ({
    isError: false,
    isSuccess: true,
    isLoading: false,
    error: undefined,
    data: mockedModalitiesList,
  })),
}));

const mockedMarketModalityConfig = transformDomainMarketModalityConfig(
  domainMockedMarketModalityConfig
);

const mockedModalityConfig = transformDomainModalityConfig(
  domainMockedModalityConfig
);

describe('ModalitiesConfiguration slice', () => {
  it('should initialize default reducer state', () => {
    const state = modalityConfigurationsSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(initialModalitiesConfigurationState);
  });

  describe('reducers', () => {
    it('updateMarketModalityConfig should update the state', () => {
      const store = setupStore({
        [MARKETS_CONFIGURATION_KEY]: {
          ...initialMarketsConfigurationState,
          selectedServiceLine: {
            id: 1,
            name: 'test',
            default: true,
          },
        },
      });

      const initialMarketsModalityConfigurations = selectMarketsModalityConfigs(
        store.getState()
      );
      const initialSelectedMarketsModalityConfigs =
        selectSelectedMarketsModalityConfigs(store.getState());
      expect(initialMarketsModalityConfigurations).toEqual(
        initialModalitiesConfigurationState.marketsModalityConfigs
      );
      expect(initialSelectedMarketsModalityConfigs).toEqual(
        buildMarketsModalityConfigsHierarchy(
          initialMarketsModalityConfigurations
        )
      );

      // will add new modality config to state
      store.dispatch(updateMarketModalityConfig(mockedMarketModalityConfig));
      const updatedMarketsModalityConfigurationsWithModalityConfigAdded =
        selectMarketsModalityConfigs(store.getState());
      const updatedSelectedMarketsModalityConfigsWithModalityConfigAdded =
        selectSelectedMarketsModalityConfigs(store.getState());
      expect(
        updatedMarketsModalityConfigurationsWithModalityConfigAdded
      ).toEqual([mockedMarketModalityConfig]);
      expect(
        updatedSelectedMarketsModalityConfigsWithModalityConfigAdded
      ).toEqual(
        buildMarketsModalityConfigsHierarchy([mockedMarketModalityConfig])
      );

      // will remove existing modality when toggle off
      store.dispatch(updateMarketModalityConfig(mockedMarketModalityConfig));
      const updatedMarketsModalityConfigurationsWithModalityConfigRemoved =
        selectMarketsModalityConfigs(store.getState());
      const updatedSelectedMarketsModalityConfigsWithModalityConfigRemoved =
        selectSelectedMarketsModalityConfigs(store.getState());
      expect(
        updatedMarketsModalityConfigurationsWithModalityConfigRemoved
      ).toEqual([]);
      expect(
        updatedSelectedMarketsModalityConfigsWithModalityConfigRemoved
      ).toEqual(buildMarketsModalityConfigsHierarchy());
    });

    it('updateModalityConfig should update the state', () => {
      const store = setupStore({
        [MARKETS_CONFIGURATION_KEY]: {
          ...initialMarketsConfigurationState,
          selectedServiceLine: {
            id: 1,
            name: 'test',
            default: true,
          },
        },
      });

      const initialModalityConfigurations = selectModalityConfigs(
        store.getState()
      );
      const initialSelectedModalityConfigs = selectSelectedModalityConfigs(
        store.getState()
      );
      expect(initialModalityConfigurations).toEqual(
        initialModalitiesConfigurationState.modalityConfigs
      );
      expect(initialSelectedModalityConfigs).toEqual(
        buildModalityConfigsHierarchy(initialModalityConfigurations)
      );

      // will add new modality config to state
      store.dispatch(updateModalityConfig(mockedModalityConfig));
      const updatedModalityConfigurationsWithModalityConfigAdded =
        selectModalityConfigs(store.getState());
      const updatedSelectedModalityConfigsWithModalityConfigAdded =
        selectSelectedModalityConfigs(store.getState());
      expect(updatedModalityConfigurationsWithModalityConfigAdded).toEqual([
        mockedModalityConfig,
      ]);
      expect(updatedSelectedModalityConfigsWithModalityConfigAdded).toEqual(
        buildModalityConfigsHierarchy([mockedModalityConfig])
      );

      // will remove existing modality when toggle off
      store.dispatch(updateModalityConfig(mockedModalityConfig));
      const updatedModalityConfigurationsWithModalityConfigRemoved =
        selectModalityConfigs(store.getState());
      const updatedSelectedModalityConfigsWithModalityConfigRemoved =
        selectSelectedModalityConfigs(store.getState());
      expect(updatedModalityConfigurationsWithModalityConfigRemoved).toEqual(
        []
      );
      expect(updatedSelectedModalityConfigsWithModalityConfigRemoved).toEqual(
        buildModalityConfigsHierarchy()
      );
    });

    it('setShowSuccessMessage should update the state', () => {
      const store = setupStore();

      const { showSuccessMessage: initialShowSuccessMessage } =
        selectModalityConfigurationsLoadingState(store.getState());
      expect(initialShowSuccessMessage).toEqual(
        initialModalitiesConfigurationState.showSuccessMessage
      );
      store.dispatch(setShowSuccessMessage({ showSuccessMessage: true }));
      const { showSuccessMessage: updatedShowSuccessMessage } =
        selectModalityConfigurationsLoadingState(store.getState());
      expect(updatedShowSuccessMessage).toEqual(true);
    });

    it('patchUpdateModalityConfigurations should update the state on fulfilled status', async () => {
      fetchMock.mockResponse((req) => {
        if (req.url.includes(MODALITIES_MARKETS_CONFIGS_SEGMENT)) {
          return Promise.resolve(
            JSON.stringify({
              configs: [domainMockedMarketModalityConfig],
            })
          );
        }

        return Promise.resolve(
          JSON.stringify({ configs: [domainMockedModalityConfig] })
        );
      });

      const store = setupStore({
        [MODALITY_CONFIGURATIONS_KEY]: {
          ...initialModalitiesConfigurationState,
          modalityConfigs: [mockedModalityConfig],
          marketsModalityConfigs: [mockedMarketModalityConfig],
        },
      });
      const initialLoadingState = selectModalityConfigurationsLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: initialModalitiesConfigurationState.isLoading,
        isError: initialModalitiesConfigurationState.isError,
        isSuccess: initialModalitiesConfigurationState.isSuccess,
        showSuccessMessage:
          initialModalitiesConfigurationState.showSuccessMessage,
        error: initialModalitiesConfigurationState.error,
      });

      await store.dispatch(patchUpdateModalityConfigurations(1));
      const fulfilledLoadingState = selectModalityConfigurationsLoadingState(
        store.getState()
      );
      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
        showSuccessMessage: true,
        error: undefined,
      });
    });

    it('patchUpdateModalityConfigurations should update the state on pending status', () => {
      fetchMock.mockResponse((req) => {
        if (req.url.includes(MODALITIES_MARKETS_CONFIGS_SEGMENT)) {
          return Promise.resolve(
            JSON.stringify({
              configs: [domainMockedMarketModalityConfig],
            })
          );
        }

        return Promise.resolve(
          JSON.stringify({ configs: [domainMockedModalityConfig] })
        );
      });

      const store = setupStore({
        [MODALITY_CONFIGURATIONS_KEY]: {
          ...initialModalitiesConfigurationState,
          modalityConfigs: [mockedModalityConfig],
          marketsModalityConfigs: [mockedMarketModalityConfig],
        },
      });
      const initialLoadingState = selectModalityConfigurationsLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: initialModalitiesConfigurationState.isLoading,
        isError: initialModalitiesConfigurationState.isError,
        isSuccess: initialModalitiesConfigurationState.isSuccess,
        showSuccessMessage:
          initialModalitiesConfigurationState.showSuccessMessage,
        error: initialModalitiesConfigurationState.error,
      });

      store.dispatch(patchUpdateModalityConfigurations(1));
      const pendingLoadingState = selectModalityConfigurationsLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: undefined,
        isSuccess: undefined,
        showSuccessMessage: false,
        error: undefined,
      });

      const modalityConfigs = selectModalityConfigs(store.getState());
      const marketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );
      expect(modalityConfigs).toEqual([mockedModalityConfig]);
      expect(marketsModalityConfigs).toEqual([mockedMarketModalityConfig]);
    });

    it('modalitiesSlice.endpoints.getMarketsModalityConfigs.matchFulfilled should update the state', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: [domainMockedMarketModalityConfig] })
      );

      const store = setupStore();
      const initialMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );
      expect(initialMarketsModalityConfigs).toEqual(
        initialModalitiesConfigurationState.marketsModalityConfigs
      );
      await store.dispatch(
        modalitiesSlice.endpoints.getMarketsModalityConfigs.initiate(1)
      );

      const updatedMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );
      expect(updatedMarketsModalityConfigs).toEqual([
        mockedMarketModalityConfig,
      ]);
    });

    it('modalitiesSlice.endpoints.getModalityConfigs.matchFulfilled should update the state', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ configs: [domainMockedModalityConfig] })
      );

      const store = setupStore();
      const initialModalityConfigs = selectModalityConfigs(store.getState());
      expect(initialModalityConfigs).toEqual(
        initialModalitiesConfigurationState.modalityConfigs
      );
      await store.dispatch(
        modalitiesSlice.endpoints.getModalityConfigs.initiate(1)
      );

      const updatedModalityConfigs = selectModalityConfigs(store.getState());
      expect(updatedModalityConfigs).toEqual([mockedModalityConfig]);
    });

    it('resetModalityConfigurationsState should update the state', async () => {
      fetchMock.mockResponse((req) => {
        if (req.url.includes(MODALITIES_MARKETS_CONFIGS_SEGMENT)) {
          return Promise.resolve(
            JSON.stringify({
              configs: [domainMockedMarketModalityConfig],
            })
          );
        }

        return Promise.resolve(
          JSON.stringify({ configs: [domainMockedModalityConfig] })
        );
      });
      const store = setupStore();

      await store.dispatch(
        modalitiesSlice.endpoints.getModalityConfigs.initiate(1)
      );
      await store.dispatch(
        modalitiesSlice.endpoints.getMarketsModalityConfigs.initiate(1)
      );

      const initialMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );
      const initialModalityConfigs = selectModalityConfigs(store.getState());
      expect(initialMarketsModalityConfigs).toEqual([
        mockedMarketModalityConfig,
      ]);
      expect(initialModalityConfigs).toEqual([mockedModalityConfig]);

      store.dispatch(
        updateMarketModalityConfig({
          ...mockedMarketModalityConfig,
          modalityId: mockedMarketModalityConfig.modalityId + 1,
        })
      );
      store.dispatch(
        updateModalityConfig({
          ...mockedModalityConfig,
          modalityId: mockedModalityConfig.modalityId + 1,
        })
      );

      const updatedMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );
      const updatedModalityConfigs = selectModalityConfigs(store.getState());
      expect(updatedMarketsModalityConfigs).toEqual([
        mockedMarketModalityConfig,
        {
          ...mockedMarketModalityConfig,
          modalityId: mockedMarketModalityConfig.modalityId + 1,
        },
      ]);
      expect(updatedModalityConfigs).toEqual([
        mockedModalityConfig,
        {
          ...mockedModalityConfig,
          modalityId: mockedModalityConfig.modalityId + 1,
        },
      ]);

      await store.dispatch(resetModalityConfigurationsState(1));

      const resetMarketsModalityConfigs = selectMarketsModalityConfigs(
        store.getState()
      );
      const resetModalityConfigs = selectModalityConfigs(store.getState());
      expect(resetMarketsModalityConfigs).toEqual([mockedMarketModalityConfig]);
      expect(resetModalityConfigs).toEqual([mockedModalityConfig]);
    });
  });

  describe('selectors', () => {
    it('should select all modalities', () => {
      const store = setupStore();
      const data = selectModalities(store.getState());
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        modalities: transformModalitiesList(mockedModalitiesList),
      });
    });

    it('should return empty array if query is rejected', () => {
      mocked(domainSelectModalities).mockImplementation(() => ({
        endpointName: 'getModalities',
        isUninitialized: false,
        isError: true,
        isSuccess: false,
        startedTimeStamp: 1673596907187,
        fulfilledTimeStamp: 1673596907914,
        isLoading: false,
        error: {
          error: 'test error',
          status: 'FETCH_ERROR',
        },
        originalArgs: undefined,
        requestId: 'test',
        status: QueryStatus.rejected,
      }));
      const store = setupStore();
      const data = selectModalities(store.getState());
      expect(data).toEqual({
        error: {
          error: 'test error',
          status: 'FETCH_ERROR',
        },
        isError: true,
        isLoading: false,
        isSuccess: false,
        modalities: [],
      });
    });
  });
});
