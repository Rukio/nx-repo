import { webRequestRender, screen } from '../../../testUtils';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';
import RequestAddressPage from './RequestAddress';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

jest.mock('react-places-autocomplete');

describe('<RequestAddressPage />', () => {
  it('should render properly', () => {
    webRequestRender(<RequestAddressPage />, {
      withRouter: true,
    });

    expect(
      screen.getByTestId(WEB_REQUEST_PAGES_TEST_IDS.REQUEST_ADDRESS)
    ).toBeVisible();
  });
});
