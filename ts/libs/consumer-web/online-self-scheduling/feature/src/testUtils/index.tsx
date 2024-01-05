import { ReactElement } from 'react';
import {
  render,
  RenderOptions,
  renderHook,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import {
  combineReducers,
  configureStore,
  ConfigureStoreOptions,
} from '@reduxjs/toolkit';
import { authSlice } from '@*company-data-covered*/auth0/data-access';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  onlineSelfSchedulingApiSlice,
  manageSelfScheduleSlice,
  preLoginSlice,
  PreLoginState,
  RootState,
  managePatientDemographicsSlice,
  manageInsurancesSlice,
  managePatientAddressSlice,
  ManageSelfScheduleState,
  manageConsentSlice,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { setupListeners } from '@reduxjs/toolkit/query';
import { Provider } from 'react-redux';
import { SegmentProvider } from '@*company-data-covered*/segment/feature';

type RootTestState = Omit<RootState, 'preLogin' | 'manageSelfSchedule'> & {
  [preLoginSlice.name]: PreLoginState;
  [manageSelfScheduleSlice.name]: ManageSelfScheduleState;
};

type CustomRenderOptions = {
  renderOptions?: Omit<RenderOptions, 'queries'>;
  userEventOptions?: Partial<UserEventSetupConfig>;
  withRouter?: boolean;
  routerProps?: MemoryRouterProps;
  preloadedState?: ConfigureStoreOptions<RootTestState>['preloadedState'];
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
    reducer: combineReducers({
      [authSlice.name]: authSlice.reducer,
      [preLoginSlice.name]: preLoginSlice.reducer,
      [onlineSelfSchedulingApiSlice.reducerPath]:
        onlineSelfSchedulingApiSlice.reducer,
      [manageSelfScheduleSlice.name]: manageSelfScheduleSlice.reducer,
      [managePatientDemographicsSlice.name]:
        managePatientDemographicsSlice.reducer,
      [manageInsurancesSlice.name]: manageInsurancesSlice.reducer,
      [managePatientAddressSlice.name]: managePatientAddressSlice.reducer,
      [manageConsentSlice.name]: manageConsentSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(onlineSelfSchedulingApiSlice.middleware),
    preloadedState,
  });

  setupListeners(store.dispatch);

  const component = withRouter ? (
    <MemoryRouter {...routerProps}>{ui}</MemoryRouter>
  ) : (
    ui
  );

  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...render(
      <Provider store={store}>
        <SegmentProvider loadOptions={{ writeKey: 'test-key' }}>
          {component}
        </SegmentProvider>
      </Provider>,
      renderOptions
    ),
  };
};

const customRenderHook: typeof renderHook = (hook, options) => {
  return renderHook(hook, {
    ...options,
    wrapper: ({ children }: { children: ReactElement }) => {
      const WrapperComponent = options?.wrapper || 'div';

      return (
        <SegmentProvider loadOptions={{ writeKey: 'test-key' }}>
          <WrapperComponent>{children}</WrapperComponent>
        </SegmentProvider>
      );
    },
  });
};

export const testSegmentPageView = async (eventName: string) => {
  const { result: segmentHook } = customRenderHook(() => useSegment());

  await waitFor(() => {
    expect(segmentHook.current.pageView).toBeCalledWith(eventName);
  });

  await waitFor(() => {
    expect(segmentHook.current.pageView).toBeCalledTimes(1);
  });
};

export * from '@testing-library/react';
export { customRender as render, customRenderHook as renderHook };
