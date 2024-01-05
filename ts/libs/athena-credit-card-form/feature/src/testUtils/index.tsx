import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { authSlice } from '@*company-data-covered*/auth0/data-access';
import {
  athenaCreditCardFormApiSlice,
  collectPaymentSlice,
  creditCardSlice,
  RootState,
} from '@*company-data-covered*/athena-credit-card-form/data-access';
import { setupListeners } from '@reduxjs/toolkit/query';
import { Provider } from 'react-redux';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

type CustomRenderOptions = {
  renderOptions?: Omit<RenderOptions, 'queries'>;
  userEventOptions?: Omit<UserEventSetupConfig, 'delay'>;
  withRouter?: boolean;
  routerProps?: MemoryRouterProps;
  preloadedState?: ConfigureStoreOptions<RootState>['preloadedState'];
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {
    withRouter: true,
  }
) => {
  const {
    withRouter,
    routerProps = {},
    userEventOptions,
    renderOptions,
    preloadedState,
  } = options;

  const store = configureStore({
    reducer: {
      [authSlice.name]: authSlice.reducer,
      [athenaCreditCardFormApiSlice.reducerPath]:
        athenaCreditCardFormApiSlice.reducer,
      [collectPaymentSlice.name]: collectPaymentSlice.reducer,
      [creditCardSlice.name]: creditCardSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(athenaCreditCardFormApiSlice.middleware),
    preloadedState,
  });

  setupListeners(store.dispatch);

  const component = withRouter ? (
    <MemoryRouter {...routerProps}>{ui}</MemoryRouter>
  ) : (
    ui
  );

  return {
    user: userEvent.setup({ ...userEventOptions, delay: null }),
    ...render(<Provider store={store}>{component}</Provider>, renderOptions),
  };
};

export * from '@testing-library/react';
export { customRender as render, userEvent };
