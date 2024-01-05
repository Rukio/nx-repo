import { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import {
  RootState,
  marketsConfigurationSlice,
  MARKETS_CONFIGURATION_KEY,
  INSURANCES_CONFIGURATION_KEY,
  insurancesConfigurationSlice,
  MODALITY_CONFIGURATIONS_KEY,
  modalityConfigurationsSlice,
  NETWORKS_CONFIGURATION_KEY,
  networksConfigurationSlice,
} from '@*company-data-covered*/modality/data-access';
import { authSlice } from '@*company-data-covered*/auth0/data-access';
import { stationApiSlice } from '@*company-data-covered*/station/data-access';

const customRender = (
  ui: ReactElement,
  preloadedState?: Partial<RootState>
) => {
  const store = configureStore({
    reducer: {
      auth: authSlice.reducer,
      station: stationApiSlice.reducer,
      [MARKETS_CONFIGURATION_KEY]: marketsConfigurationSlice.reducer,
      [INSURANCES_CONFIGURATION_KEY]: insurancesConfigurationSlice.reducer,
      [MODALITY_CONFIGURATIONS_KEY]: modalityConfigurationsSlice.reducer,
      [NETWORKS_CONFIGURATION_KEY]: networksConfigurationSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(stationApiSlice.middleware),
    preloadedState: {
      auth: {
        authToken: 'test-token',
      },
      ...preloadedState,
    },
  });

  setupListeners(store.dispatch);

  return {
    // delay: null is required to make it work with jest.useFakeTimers
    user: userEvent.setup({ delay: null }),
    ...render(ui, {
      wrapper: (props) => <Provider {...props} store={store} />,
    }),
    store,
  };
};

export * from '@testing-library/react';
export { customRender as render };
