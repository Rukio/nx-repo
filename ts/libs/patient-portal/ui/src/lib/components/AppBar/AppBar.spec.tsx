import { render, screen } from '../../../testUtils';
import AppBar from './AppBar';
import { APP_BAR_TEST_IDS } from './testIds';

describe('<AppBar />', () => {
  it('should render correctly', () => {
    render(<AppBar />);

    expect(
      screen.getByTestId(APP_BAR_TEST_IDS.APP_BAR_CONTAINER)
    ).toBeVisible();

    expect(
      screen.getByTestId(APP_BAR_TEST_IDS.DISPATCH_HEALTH_LOGO_LINK)
    ).toBeVisible();

    expect(
      screen.getByTestId(APP_BAR_TEST_IDS.DISPATCH_HEALTH_LOGO_LINK)
    ).toHaveAttribute('href', '/');
  });

  it('logo link should have different attribute when props passed', () => {
    const mockLogoLink = '/test';
    render(<AppBar logoLink={mockLogoLink} />);

    expect(
      screen.getByTestId(APP_BAR_TEST_IDS.DISPATCH_HEALTH_LOGO_LINK)
    ).toHaveAttribute('href', mockLogoLink);
  });
});
