import { ReactElement } from 'react';
import { ReducersMapObject, Middleware } from 'redux';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';

type CustomRenderOptions<RootState> = {
  renderOptions?: Omit<RenderOptions, 'queries'>;
  userEventOptions?: UserEventSetupConfig;
  withRouter?: boolean;
  routerProps?: MemoryRouterProps;
  preloadedState?: ConfigureStoreOptions<RootState>['preloadedState'];
};

export const createRenderFunction = (
  reducer: ReducersMapObject,
  middleware: Middleware[] = []
) => {
  return (
    ui: ReactElement,
    options: CustomRenderOptions<typeof reducer> = {
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
      reducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }).concat(middleware),
      preloadedState,
    });

    const component = withRouter ? (
      <MemoryRouter {...routerProps}>{ui}</MemoryRouter>
    ) : (
      ui
    );

    setupListeners(store.dispatch);

    return {
      store,
      user: userEvent.setup(userEventOptions),
      ...render(<Provider store={store}>{component}</Provider>, renderOptions),
    };
  };
};
