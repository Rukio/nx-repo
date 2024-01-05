import { render, screen } from '../util/testUtils';
import PerformanceContainer from './PerformanceContainer';
import { PERFORMANCE_TEST_IDS } from './TestIds';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';

const performanceContainerProps = {
  title: 'Market Performance',
  isLoading: false,
  isError: false,
};

const fakeChildProps = {
  dataTestId: 'fakeChild',
  textContent: 'fakeChild',
};

describe('PerformanceContainer', () => {
  it('should render correctly', async () => {
    render(
      <PerformanceContainer {...performanceContainerProps}>
        {fakeChildProps.textContent}
      </PerformanceContainer>
    );

    const performanceSection = await screen.findByTestId(
      `${PERFORMANCE_TEST_IDS.SECTION}-${TEST_IDS.METRICS_SECTION.TITLE}`
    );

    expect(performanceSection).toBeVisible();
  });

  it('should placeholder render correctly', async () => {
    render(
      <PerformanceContainer {...performanceContainerProps} isLoading>
        {fakeChildProps.textContent}
      </PerformanceContainer>
    );

    const performancePlaceholder = await screen.findByTestId(
      PERFORMANCE_TEST_IDS.PLACEHOLDER
    );

    expect(performancePlaceholder).toBeVisible();
  });

  it('should render correctly default alert', async () => {
    render(
      <PerformanceContainer {...performanceContainerProps} isError>
        {fakeChildProps.textContent}
      </PerformanceContainer>
    );

    const performanceDefaultAlert = await screen.findByTestId(
      PERFORMANCE_TEST_IDS.DEFAULT_ERROR_ALERT
    );

    expect(performanceDefaultAlert).toBeVisible();
  });

  it('should render correctly metrics error alert', async () => {
    render(
      <PerformanceContainer
        {...performanceContainerProps}
        errorMessage="Some error.."
      >
        {fakeChildProps.textContent}
      </PerformanceContainer>
    );

    const performanceMetricsAlert = await screen.findByTestId(
      PERFORMANCE_TEST_IDS.METRICS_ERROR_ALERT
    );

    expect(performanceMetricsAlert).toBeVisible();
  });
});
