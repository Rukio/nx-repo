import { screen, waitFor } from '@testing-library/react';
import {
  DEFAULT_ERROR_ALERT_TEXT,
  Metrics,
  TEST_IDS,
} from '@*company-data-covered*/clinical-kpi/ui';
import {
  MetricsDataStatus,
  ProviderMetrics,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { mockedProviderMetrics } from '@*company-data-covered*/clinical-kpi/data-access';
import { interceptQuery, renderWithUserProvider } from '../util/testUtils';
import {
  PERFORMANCE_TEST_IDS,
  mockedStatsigConfiguration,
} from '../PerformanceContainer';
import { PROVIDER_METRICS_INTERCEPT_URL } from '../util/testUtils/server/handlers';
import MyPerformance from './MyPerformance';

jest.mock('statsig-js', () => ({
  getConfig: jest.fn(() => mockedStatsigConfiguration),
}));

describe('MyPerformance', () => {
  it('should render correctly when data is present', async () => {
    const { asFragment } = renderWithUserProvider(<MyPerformance />);

    await waitFor(() => {
      expect(
        screen.getByTestId(
          `${PERFORMANCE_TEST_IDS.SECTION}-${TEST_IDS.METRICS_SECTION.TITLE}`
        )
      ).toHaveTextContent('My Performance');
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
      url: PROVIDER_METRICS_INTERCEPT_URL,
      data: { metrics: mockData },
    });

    renderWithUserProvider(<MyPerformance />);
    const value = await screen.findByTestId(
      TEST_IDS.INDIVIDUAL_METRIC.VALUE(Metrics.ChartClosure)
    );

    expect(value.textContent).toBe('0%');

    const valueChange = await screen.findByTestId(
      TEST_IDS.INDIVIDUAL_METRIC.VALUE_CHANGE(Metrics.ChartClosure)
    );
    expect(valueChange.textContent).toBe('no change');
  });

  it('should render correct alert when status is not OK and error message is defined', async () => {
    const mockErrorMessage = 'test-error-message-text';
    const mockData: ProviderMetrics = {
      ...mockedProviderMetrics,
      status: MetricsDataStatus.NOT_ENOUGH_CARE_REQUESTS,
      errorMessage: mockErrorMessage,
    };
    interceptQuery({
      url: PROVIDER_METRICS_INTERCEPT_URL,
      data: { metrics: mockData },
    });

    renderWithUserProvider(<MyPerformance />);
    const alert = await screen.findByText(mockErrorMessage);

    expect(alert).toBeVisible();
  });

  it('should render correct alert when status is not OK and error message is undefined', async () => {
    const mockData: ProviderMetrics = {
      ...mockedProviderMetrics,
      status: MetricsDataStatus.NOT_ENOUGH_CARE_REQUESTS,
      errorMessage: undefined,
    };
    interceptQuery({
      url: PROVIDER_METRICS_INTERCEPT_URL,
      data: { metrics: mockData },
    });

    renderWithUserProvider(<MyPerformance />);
    const alert = await screen.findByText(DEFAULT_ERROR_ALERT_TEXT);

    expect(alert).toBeVisible();
  });

  it('should render error when it present', async () => {
    interceptQuery({
      url: PROVIDER_METRICS_INTERCEPT_URL,
      statusCode: 500,
    });
    renderWithUserProvider(<MyPerformance />);
    const error = await screen.findByText(DEFAULT_ERROR_ALERT_TEXT);
    expect(error).toBeVisible();
  });

  it('should render correct alert when metrics are empty', async () => {
    interceptQuery({
      url: PROVIDER_METRICS_INTERCEPT_URL,
      data: { metrics: null },
    });
    renderWithUserProvider(<MyPerformance />);
    const alert = await screen.findByText(DEFAULT_ERROR_ALERT_TEXT);

    expect(alert).toBeVisible();
  });

  it('should render placeholder when is loading', async () => {
    interceptQuery({
      url: PROVIDER_METRICS_INTERCEPT_URL,
      delay: 500,
    });
    renderWithUserProvider(<MyPerformance />);
    const placeholder = await screen.findByTestId(
      PERFORMANCE_TEST_IDS.PLACEHOLDER
    );

    expect(placeholder).toBeVisible();
  });
});
