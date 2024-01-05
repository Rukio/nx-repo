import { render, screen } from '../../../testUtils';
import IndividualPerformanceView from './IndividualPerformanceView';
import { INDIVIDUAL_PERFORMANCE_VIEW_TEST_ID } from './testIds';

const setup = () => {
  return render(<IndividualPerformanceView />);
};

describe('IndividualPerformanceView', () => {
  test('renders IndividualPerformanceView component correctly', () => {
    setup();
    const page = screen.getByTestId(INDIVIDUAL_PERFORMANCE_VIEW_TEST_ID);
    expect(page).toBeVisible();
  });
});
