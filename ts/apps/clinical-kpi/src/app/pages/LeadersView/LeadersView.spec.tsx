import LeadersView from './LeadersView';
import { render, screen } from '../../../testUtils';

jest.mock('statsig-js', () => ({
  getConfig: () => ({}),
  checkGate: jest.fn(
    (gateName) => gateName === 'leads_view_individual_visibility'
  ),
}));

const setup = () => {
  return render(<LeadersView />, {
    withRouter: true,
  });
};

describe('LeadersView', () => {
  test('renders LeadersView component correctly', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-05-24T14:30:00'));
    setup();
    const headerGreeting = screen.getByTestId('header-greeting-text');
    expect(headerGreeting).toBeVisible();
  });
});
