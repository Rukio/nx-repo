import { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { APP_HEADER_TEST_IDS } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { render, screen } from '../../testUtils';
import { AppLayout, AppLayoutProps } from './AppLayout';

jest.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: { children: ReactElement }) => children,
}));

const defaultProps: AppLayoutProps = {
  homeLink: 'https://www.*company-data-covered*.com/',
  domain: 'auth-domain',
  clientId: 'auth-client-id',
  expressLink: 'https://express.*company-data-covered*.com/',
};

const mockRouteElementTestId = 'route-element';
const MockRouteElement = () => (
  <div data-testid={mockRouteElementTestId}>Awesome element</div>
);

const setup = (props: Partial<AppLayoutProps> = {}) => {
  return render(
    <Routes>
      <Route element={<AppLayout {...defaultProps} {...props} />}>
        <Route path="/" element={<MockRouteElement />} />
      </Route>
    </Routes>,
    {
      withRouter: true,
      routerProps: { initialEntries: ['/'] },
    }
  );
};

describe('<AppLayout />', () => {
  it('should render properly', () => {
    setup();

    const appHeader = screen.getByTestId(APP_HEADER_TEST_IDS.APP_HEADER);
    expect(appHeader).toBeVisible();

    const homeLink = screen.getByTestId(APP_HEADER_TEST_IDS.HOME_LINK);
    expect(homeLink).toBeVisible();
    expect(homeLink).toHaveAttribute('href', defaultProps.homeLink);

    const expressLink = screen.getByTestId(APP_HEADER_TEST_IDS.EXPRESS_LINK);
    expect(expressLink).toBeVisible();
    expect(expressLink).toHaveAttribute('href', defaultProps.expressLink);

    const routeElement = screen.getByTestId(mockRouteElementTestId);
    expect(routeElement).toBeVisible();
  });
});
