import { ReactElement, ReactNode } from 'react';
import {
  render,
  RenderOptions,
  RenderHookOptions,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';
import {
  careRequestsConfigurationSlice,
  requestSlice,
  RequestState,
  RootState,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { stationApiSlice } from '@*company-data-covered*/station/data-access';

// removes PersistPartial type from persisted reducer
type PreloadedState = Partial<
  Omit<RootState, 'request'> & { request: RequestState }
>;

const getStore = (initialState: Partial<PreloadedState> = {}) =>
  configureStore({
    reducer: {
      [stationApiSlice.reducerPath]: stationApiSlice.reducer,
      [careRequestsConfigurationSlice.name]:
        careRequestsConfigurationSlice.reducer,
      [requestSlice.name]: requestSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(stationApiSlice.middleware),
    preloadedState: initialState,
  });

export type CustomRenderOptions = {
  renderOptions?: Omit<RenderOptions, 'queries'>;
  userEventOptions?: Partial<UserEventSetupConfig>;
  withRouter?: boolean;
  preloadedState?: PreloadedState;
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {
    withRouter: true,
  }
) => {
  const { withRouter, userEventOptions, renderOptions, preloadedState } =
    options;

  const store = getStore(preloadedState);

  setupListeners(store.dispatch);

  const component = withRouter ? <MemoryRouter>{ui}</MemoryRouter> : ui;

  return {
    user: userEvent.setup(userEventOptions),
    store,
    ...render(<Provider store={store}>{component}</Provider>, renderOptions),
  };
};

const getHookWrapper = (
  data?: Omit<RenderHookOptions<unknown>, 'wrapper'> & {
    reduxState?: PreloadedState;
    withRouter?: boolean;
  }
) => {
  const store = getStore(data?.reduxState);

  if (data?.withRouter) {
    return ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  }

  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

export * from '@testing-library/react';
export { customRender as render, getHookWrapper, userEvent };
