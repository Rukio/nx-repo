import { ONLINE_SELF_SCHEDULING_ROUTES } from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';
import { ReactElement } from 'react';
import { ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS } from '../../pages/online-self-scheduling/testIds';
import { render, screen } from '../../testUtils';
import { OnlineSelfSchedulingFlow } from './OnlineSelfSchedulingFlow';

jest.mock('@*company-data-covered*/consumer-web/online-self-scheduling/feature', () => {
  const mockedModule = jest.createMockFromModule(
    '@*company-data-covered*/consumer-web/online-self-scheduling/feature'
  );
  const actualModule = jest.requireActual(
    '@*company-data-covered*/consumer-web/online-self-scheduling/feature'
  );

  return {
    ...Object(mockedModule),
    CacheManager: actualModule.CacheManager,
    AuthProvider: actualModule.AuthProvider,
    AuthLoader: actualModule.AuthLoader,
    ProtectedOutlet: actualModule.ProtectedOutlet,
    ONLINE_SELF_SCHEDULING_ROUTES: actualModule.ONLINE_SELF_SCHEDULING_ROUTES,
    StoreProvider: actualModule.StoreProvider,
  };
});

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    loginWithRedirect: jest.fn(),
    getAccessTokenSilently: jest.fn().mockResolvedValue('test-token'),
  }),
  Auth0Provider: ({ children }: { children: ReactElement }) => children,
}));

jest.mock(
  '@*company-data-covered*/consumer-web/online-self-scheduling/data-access',
  () => ({
    ...jest.requireActual(
      '@*company-data-covered*/consumer-web/online-self-scheduling/data-access'
    ),
    selectCachedSelfScheduleData: jest
      .fn()
      .mockImplementation(() => () => ({ isSuccess: true })),
  })
);

describe('<OnlineSelfSchedulingFlow />', () => {
  it.each([
    {
      pageName: 'Who needs care',
      path: ONLINE_SELF_SCHEDULING_ROUTES.HOME,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.WHO_NEEDS_CARE,
    },
    {
      pageName: 'Symptoms',
      path: ONLINE_SELF_SCHEDULING_ROUTES.SYMPTOMS,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.SYMPTOMS,
    },
    {
      pageName: 'Preferred time',
      path: ONLINE_SELF_SCHEDULING_ROUTES.PREFERRED_TIME,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.PREFERRED_TIME,
    },
    {
      pageName: 'Patient Demographics',
      path: ONLINE_SELF_SCHEDULING_ROUTES.PATIENT_DEMOGRAPHICS,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.PATIENT_DEMOGRAPHICS,
    },
    {
      pageName: 'Consent',
      path: ONLINE_SELF_SCHEDULING_ROUTES.CONSENT,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.CONSENT,
    },
    {
      pageName: 'Address',
      path: ONLINE_SELF_SCHEDULING_ROUTES.ADDRESS,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.ADDRESS,
    },
    {
      pageName: 'Insurance',
      path: ONLINE_SELF_SCHEDULING_ROUTES.INSURANCE,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.INSURANCE,
    },
    {
      pageName: 'Confirm Details',
      path: ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.CONFIRM_DETAILS,
    },
    {
      pageName: 'CallScreener',
      path: ONLINE_SELF_SCHEDULING_ROUTES.CALL_SCREENER,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.CALL_SCREENER,
    },
    {
      pageName: 'BookedTime',
      path: ONLINE_SELF_SCHEDULING_ROUTES.BOOKED_TIME,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.BOOKED_TIME,
    },
    {
      pageName: 'Confirmation',
      path: ONLINE_SELF_SCHEDULING_ROUTES.CONFIRMATION,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.CONFIRMATION,
    },
    {
      pageName: 'Offboard',
      path: ONLINE_SELF_SCHEDULING_ROUTES.OFFBOARD,
      pageTestId: ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.OFFBOARD,
    },
  ])('should render $pageName page', async ({ path, pageTestId }) => {
    render(<OnlineSelfSchedulingFlow />, {
      withRouter: true,
      routerProps: {
        initialEntries: [path],
      },
    });

    const page = await screen.findByTestId(pageTestId);
    expect(page).toBeVisible();
  });
});
