import { mockedLeaderHubIndividualProviderMetrics } from '@*company-data-covered*/clinical-kpi/data-access';
import {
  interceptQuery,
  renderWithUserProvider,
  screen,
} from '../util/testUtils';
import IndividualPerformanceHeader from './IndividualPerformanceHeader';
import { appConfiguration } from './constants';
import { getNumericMetricValue } from '../util/metricUtils';
import { INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS } from './TestIds';
import { LEADS_PROVIDER_OVERALL_METRICS_INTERCEPT_URL } from '../util/testUtils/server/handlers';

const setup = () => {
  return renderWithUserProvider(
    <IndividualPerformanceHeader providerId="116600" backButtonLink="" />
  );
};

describe('<IndividualPerformanceHeader />', () => {
  test('renders IndividualPerformanceHeader component correctly', async () => {
    setup();
    const title = await screen.findByTestId(
      INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.TITLE
    );
    expect(title).toBeVisible();
    await Promise.all(
      appConfiguration.map(async ({ property, unit, type }) => {
        const metric = await screen.findByTestId(
          INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.getHeaderTestId(property)
        );
        expect(metric).toBeVisible();
        expect(metric).toHaveTextContent(
          `${getNumericMetricValue(
            mockedLeaderHubIndividualProviderMetrics[property],
            type
          )}${unit || ''}`
        );
      })
    );
  });

  test('should render skeletons correctly', async () => {
    interceptQuery({
      url: LEADS_PROVIDER_OVERALL_METRICS_INTERCEPT_URL,
      delay: 500,
      data: {},
    });

    setup();
    const title = await screen.findByTestId(
      INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.TITLE
    );
    expect(title).toBeVisible();
    for (const { type } of appConfiguration) {
      const skeleton = screen.getByTestId(
        INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.getMetricSkeleton(type)
      );
      expect(skeleton).toBeVisible();
    }
  });

  test('should render alert correctly', async () => {
    interceptQuery({
      url: LEADS_PROVIDER_OVERALL_METRICS_INTERCEPT_URL,
      data: null,
    });

    setup();
    const alert = await screen.findByTestId(
      INDIVIDUAL_PERFORMANCE_HEADER_TEST_IDS.DEFAULT_ERROR_ALERT
    );
    expect(alert).toBeVisible();
  });
});
