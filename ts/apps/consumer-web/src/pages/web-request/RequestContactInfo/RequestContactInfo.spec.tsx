import { webRequestRender, screen } from '../../../testUtils';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';
import RequestContactInfoPage from './RequestContactInfo';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

describe('<RequestContactInfoPage />', () => {
  it('should render properly', () => {
    webRequestRender(<RequestContactInfoPage />, {
      withRouter: true,
    });

    expect(
      screen.getByTestId(WEB_REQUEST_PAGES_TEST_IDS.REQUEST_CONTACT_INFO)
    ).toBeVisible();
  });
});
