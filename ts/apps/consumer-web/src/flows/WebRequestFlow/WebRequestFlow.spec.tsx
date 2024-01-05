import { WEB_REQUEST_ROUTES } from '@*company-data-covered*/consumer-web/web-request/feature';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../../pages/web-request/testIds';
import { render, screen } from '../../testUtils';
import { WebRequestFlow } from './WebRequestFlow';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  logEvent: jest.fn(),
  checkGate: jest.fn(),
  getExperiment: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

jest.mock('@*company-data-covered*/consumer-web/web-request/feature', () => {
  const mockedModule = jest.createMockFromModule(
    '@*company-data-covered*/consumer-web/web-request/feature'
  );
  const actualModule = jest.requireActual(
    '@*company-data-covered*/consumer-web/web-request/feature'
  );

  return {
    ...Object(mockedModule),
    WEB_REQUEST_ROUTES: actualModule.WEB_REQUEST_ROUTES,
    StoreProvider: actualModule.StoreProvider,
    useUserFlow: actualModule.useUserFlow,
    getRoutesByUserFlow: actualModule.getRoutesByUserFlow,
  };
});

describe('<WebRequestFlow />', () => {
  it.each([
    {
      pageName: 'How it works',
      path: WEB_REQUEST_ROUTES.howItWorks,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.HOW_IT_WORKS,
    },
    {
      pageName: 'Request address',
      path: WEB_REQUEST_ROUTES.requestAddress,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.REQUEST_ADDRESS,
    },
    {
      pageName: 'Request care for',
      path: WEB_REQUEST_ROUTES.requestCareFor,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.REQUEST_CARE_FOR,
    },
    {
      pageName: 'Request contact info',
      path: WEB_REQUEST_ROUTES.requestContact,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.REQUEST_CONTACT_INFO,
    },
    {
      pageName: 'Request details',
      path: WEB_REQUEST_ROUTES.requestDetails,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.REQUEST_DETAILS,
    },
    {
      pageName: 'Request help',
      path: WEB_REQUEST_ROUTES.requestHelp,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.REQUEST_HELP,
    },
    {
      pageName: 'Request personal info',
      path: WEB_REQUEST_ROUTES.requestPersonalInfo,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.REQUEST_PERSONAL_INFO,
    },
    {
      pageName: 'Request time windows',
      path: WEB_REQUEST_ROUTES.requestPreferredTime,
      pageTestId: WEB_REQUEST_PAGES_TEST_IDS.REQUEST_TIME_WINDOWS,
    },
  ])('should render $pageName page', async ({ path, pageTestId }) => {
    render(<WebRequestFlow />, {
      withRouter: true,
      routerProps: {
        initialEntries: [path],
      },
    });

    const page = await screen.findByTestId(pageTestId);
    expect(page).toBeVisible();
  });
});
