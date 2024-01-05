import { webRequestRender, screen } from '../../../testUtils';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';
import HowItWorksPage from './HowItWorks';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

describe('<HowItWorksPage />', () => {
  it('should render properly', () => {
    webRequestRender(<HowItWorksPage />, {
      withRouter: true,
    });

    expect(
      screen.getByTestId(WEB_REQUEST_PAGES_TEST_IDS.HOW_IT_WORKS)
    ).toBeVisible();
  });
});
