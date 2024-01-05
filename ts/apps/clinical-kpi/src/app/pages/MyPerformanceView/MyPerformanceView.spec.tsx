import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import {
  mockedStatsigConfiguration,
  PERFORMANCE_TEST_IDS,
} from '@*company-data-covered*/clinical-kpi/feature';
import { render, screen } from '../../../testUtils';
import MyPerformanceView from './MyPerformanceView';

jest.mock('statsig-js', () => ({
  getConfig: jest.fn(() => mockedStatsigConfiguration),
  checkGate: jest.fn(
    (gateName) => gateName === 'leads_view_individual_visibility'
  ),
}));

const setup = () => {
  return render(<MyPerformanceView />);
};

describe('MyPerformanceView', () => {
  test('renders MyPerformanceView page correctly', () => {
    setup();
    expect(
      screen.getByTestId(
        `${PERFORMANCE_TEST_IDS.SECTION}-${TEST_IDS.METRICS_SECTION.TITLE}`
      )
    ).toHaveTextContent('My Performance');
    const marketsDropdown = screen.getByTestId(
      'peer-rankings-metrics-section-title'
    );
    expect(marketsDropdown).toBeVisible();
  });
});
