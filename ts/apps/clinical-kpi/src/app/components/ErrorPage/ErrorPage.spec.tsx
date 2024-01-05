import { render, screen } from '../../../testUtils';
import ErrorPage from './ErrorPage';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import { environment } from '../../../environments/environment';

jest.mock('statsig-js', () => ({
  checkGate: jest.fn(),
}));

describe('ErrorPage', () => {
  it('should render error page correctly', () => {
    const { asFragment } = render(<ErrorPage />, { withRouter: true });
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(TEST_IDS.ALERT_BUTTON.TEXT).textContent
    ).toContain('Looks like something went wrong. Please check back later.');
    expect(
      screen.getByTestId(TEST_IDS.ALERT_BUTTON.BUTTON).textContent
    ).toContain('Continue to Dashboard');
    expect(
      screen.getByTestId(TEST_IDS.ALERT_BUTTON.BUTTON).getAttribute('href')
    ).toContain(environment.stationURL);
  });
});
