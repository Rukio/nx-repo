import { webRequestRender, screen } from '../../../testUtils';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';
import RequestCareForPage from './RequestCareFor';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

describe('<RequestCareForPage />', () => {
  it('should render properly', () => {
    webRequestRender(<RequestCareForPage />, {
      withRouter: true,
    });

    expect(
      screen.getByTestId(WEB_REQUEST_PAGES_TEST_IDS.REQUEST_CARE_FOR)
    ).toBeVisible();
  });
});
