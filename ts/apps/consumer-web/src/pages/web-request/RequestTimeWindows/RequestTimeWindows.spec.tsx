import { dayjsSetup } from '@*company-data-covered*/consumer-web/web-request/feature';
import { webRequestRender, screen } from '../../../testUtils';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';
import RequestTimeWindowsPage from './RequestTimeWindows';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

dayjsSetup();

describe('<RequestTimeWindowsPage />', () => {
  it('should render properly', () => {
    webRequestRender(<RequestTimeWindowsPage />, {
      withRouter: true,
    });

    expect(
      screen.getByTestId(WEB_REQUEST_PAGES_TEST_IDS.REQUEST_TIME_WINDOWS)
    ).toBeVisible();
  });
});
