import { screen, waitFor } from '@testing-library/react';
import {
  DEFAULT_ERROR_ALERT_TEXT,
  Metrics,
  TEST_IDS,
} from '@*company-data-covered*/clinical-kpi/ui';
import {
  ProviderMetrics,
  RootState,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { mockedProviderMetrics } from '@*company-data-covered*/clinical-kpi/data-access';
import { interceptQuery, renderWithUserProvider } from '../util/testUtils';
import {
  PERFORMANCE_TEST_IDS,
  mockedStatsigConfiguration,
} from '../PerformanceContainer';
import { MARKET_OVERALL_METRICS_INTERCEPT_URL } from '../util/testUtils/server/handlers';
import MarketPerformance from './MarketPerformance';

const PRELOADED_STATE: Partial<RootState> = {
  peerRankings: {
    selectedMarketId: '200',
  },
};

jest.mock('statsig-js', () => ({
  getConfig: jest.fn(() => mockedStatsigConfiguration),
}));

describe('MarketPerformance', () => {
  it('should render correctly when data is present', async () => {
    const { asFragment } = renderWithUserProvider(<MarketPerformance />, {
      preloadedState: PRELOADED_STATE,
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(
          `${PERFORMANCE_TEST_IDS.SECTION}-${TEST_IDS.METRICS_SECTION.TITLE}`
        )
      ).toHaveTextContent('Market Performance');
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render correctly when data is present and some of the values are null', async () => {
    const mockData: ProviderMetrics = {
      ...mockedProviderMetrics,
      chartClosureRate: null,
      chartClosureRateChange: null,
    };
    interceptQuery({
      url: MARKET_OVERALL_METRICS_INTERCEPT_URL,
      data: { marketMetrics: mockData },
    });
    renderWithUserProvider(<MarketPerformance />, {
      preloadedState: PRELOADED_STATE,
    });
    const value = await screen.findByTestId(
      TEST_IDS.INDIVIDUAL_METRIC.VALUE(Metrics.ChartClosure)
    );

    expect(value.textContent).toBe('0%');

    const valueChange = await screen.findByTestId(
      TEST_IDS.INDIVIDUAL_METRIC.VALUE_CHANGE(Metrics.ChartClosure)
    );
    expect(valueChange.textContent).toBe('no change');
  });

  it('should render correct alert when metrics are empty', async () => {
    interceptQuery({
      url: MARKET_OVERALL_METRICS_INTERCEPT_URL,
      data: { marketMetrics: null },
    });
    renderWithUserProvider(<MarketPerformance />);
    const alert = await screen.findByText(DEFAULT_ERROR_ALERT_TEXT);

    expect(alert).toBeVisible();
  });

  it('should render placeholder when is loading', async () => {
    interceptQuery({
      url: MARKET_OVERALL_METRICS_INTERCEPT_URL,
      delay: 500,
    });
    renderWithUserProvider(<MarketPerformance />, {
      preloadedState: PRELOADED_STATE,
    });
    const placeholder = await screen.findByTestId(
      PERFORMANCE_TEST_IDS.PLACEHOLDER
    );

    expect(placeholder).toBeVisible();
  });
});
