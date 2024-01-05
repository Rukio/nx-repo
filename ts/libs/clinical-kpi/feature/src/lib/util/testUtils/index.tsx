import { DefaultBodyType, DelayMode, rest } from 'msw';
import {
  render as rtlRender,
  RenderOptions as RTLRenderOptions,
} from '@testing-library/react';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/dist/query';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import {
  RootState,
  store as clinicalKpiStore,
  AUTH_FEATURE_KEY,
  authSlice,
  CLINICAL_KPI_API_SLICE_KEY,
  clinicalKpiApiSlice,
  PEER_RANKINGS_KEY,
  peerRankingsSlice,
  PROVIDER_VISITS_TABLE_KEY,
  providerVisitsTableSlice,
  CARE_TEAM_RANKINGS_KEY,
  careTeamRankingsSlice,
  PROVIDER_SHIFTS_KEY,
  providerShiftsTableSlice,
  INDIVIDUAL_PERFORMANCE_POSITION_KEY,
  individualPerformancePositionSlice,
} from '@*company-data-covered*/clinical-kpi/data-access';
import UserProvider from '../../UserProvider';
import { server } from './server';

type RenderOptions = RTLRenderOptions & {
  preloadedState?: Partial<RootState>;
  store?: typeof clinicalKpiStore;
};

export function render(
  ui: React.ReactElement,
  {
    preloadedState,
    store = configureStore({
      reducer: {
        [AUTH_FEATURE_KEY]: authSlice.reducer,
        [CLINICAL_KPI_API_SLICE_KEY]: clinicalKpiApiSlice.reducer,
        [PEER_RANKINGS_KEY]: peerRankingsSlice.reducer,
        [PROVIDER_VISITS_TABLE_KEY]: providerVisitsTableSlice.reducer,
        [CARE_TEAM_RANKINGS_KEY]: careTeamRankingsSlice.reducer,
        [PROVIDER_SHIFTS_KEY]: providerShiftsTableSlice.reducer,
        [INDIVIDUAL_PERFORMANCE_POSITION_KEY]:
          individualPerformancePositionSlice.reducer,
      },
      preloadedState,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          immutableCheck: false,
          serializableCheck: false,
        }).concat(clinicalKpiApiSlice.middleware),
    }),
    ...renderOptions
  }: RenderOptions = {}
) {
  setupListeners(store.dispatch);
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
      <BrowserRouter>
        <Provider store={store}>{children}</Provider>
      </BrowserRouter>
    );
  };

  return {
    user: userEvent.setup({ delay: null }),
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
}

export const renderWithUserProvider = (
  component?: React.ReactNode,
  renderOptions?: RenderOptions
) => {
  return {
    ...render(<UserProvider>{component}</UserProvider>, renderOptions),
  };
};

type InterceptQueryProps = {
  url: string;
  data?: DefaultBodyType;
  delay?: DelayMode | number;
  statusCode?: number;
};
// TODO: [PT-1289] find a way to make mock intercept builders type-safe for each endpoint
export const interceptQuery = ({
  url,
  data,
  delay,
  statusCode,
}: InterceptQueryProps) => {
  server.use(
    rest.get(url, (_req, res, ctx) =>
      res.once(ctx.status(statusCode || 200), ctx.delay(delay), ctx.json(data))
    )
  );
};

export * from '@testing-library/react';
