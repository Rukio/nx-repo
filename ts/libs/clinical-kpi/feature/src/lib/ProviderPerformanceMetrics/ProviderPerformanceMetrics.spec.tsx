import {
  interceptQuery,
  renderWithUserProvider,
  screen,
} from '../util/testUtils';
import ProviderPerformanceMetrics from './ProviderPerformanceMetrics';
import { PERFORMANCE_TEST_IDS } from '../PerformanceContainer';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import { MARKET_PROVIDER_METRICS_INTERCEPT_URL } from '../util/testUtils/server/handlers';
import { PROVIDER_PERFORMANCE_METRICS_TEST_IDS } from './testIds';
import { appConfiguration } from './constants';

const providerId = '116600';

describe('ProviderPerformanceMetrics', () => {
  it.each([
    {
      testIdPrefix: 'OnSceneTime',
      value: '0.68 mins',
      change: '-0.03 mins',
    },
    {
      testIdPrefix: 'ChartClosure',
      value: '69.08%',
      change: '-4.88%',
    },
    {
      testIdPrefix: 'NPS',
      value: '88.32',
      change: '-3.95',
    },
    {
      testIdPrefix: 'OnTaskPercent',
      value: '75.06%',
      change: '-2.35%',
    },
  ])(
    'should render $testIdPrefix correctly',
    async ({ testIdPrefix, value, change }) => {
      renderWithUserProvider(
        <ProviderPerformanceMetrics providerId={providerId} />
      );
      const elValue = await screen.findByTestId(
        `${TEST_IDS.INDIVIDUAL_METRIC.VALUE(testIdPrefix)}`
      );
      expect(elValue).toHaveTextContent(value);
      const elChange = await screen.findByTestId(
        `${TEST_IDS.INDIVIDUAL_METRIC.VALUE_CHANGE(testIdPrefix)}`
      );
      expect(elChange).toHaveTextContent(change);
    }
  );

  it('should render title correctly', async () => {
    renderWithUserProvider(
      <ProviderPerformanceMetrics providerId={providerId} />
    );
    const title = await screen.findByTestId(
      `${PERFORMANCE_TEST_IDS.SECTION}-${TEST_IDS.METRICS_SECTION.TITLE}`
    );
    expect(title).toBeVisible();
  });

  it('should render skeletons correctly', async () => {
    interceptQuery({
      url: `${MARKET_PROVIDER_METRICS_INTERCEPT_URL}/:id`,
      delay: 500,
      data: {},
    });

    renderWithUserProvider(
      <ProviderPerformanceMetrics providerId={providerId} />
    );

    const title = await screen.findByTestId(
      `${PERFORMANCE_TEST_IDS.SECTION}-${TEST_IDS.METRICS_SECTION.TITLE}`
    );
    expect(title).toBeVisible();

    appConfiguration.forEach(({ type }) => {
      const skeleton = screen.getByTestId(
        PROVIDER_PERFORMANCE_METRICS_TEST_IDS.getMetricSkeleton(type)
      );
      expect(skeleton).toBeVisible();
    });
  });
});
