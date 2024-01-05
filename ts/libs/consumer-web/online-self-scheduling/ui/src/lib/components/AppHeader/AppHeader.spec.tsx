import { render, screen } from '../../../testUtils';
import AppHeader, { AppHeaderProps } from './AppHeader';
import { APP_HEADER_TEST_IDS } from './testIds';

const defaultProps: AppHeaderProps = {
  homeLink: 'https://www.*company-data-covered*.com/',
  expressLink: 'https://express.*company-data-covered*.com/',
};

const setup = (props: Partial<AppHeaderProps> = {}) =>
  render(<AppHeader {...defaultProps} {...props} />);

describe('<AppHeader />', () => {
  it('should render correctly', () => {
    setup();

    const appHeader = screen.getByTestId(APP_HEADER_TEST_IDS.APP_HEADER);
    expect(appHeader).toBeVisible();

    const homeLink = screen.getByTestId(APP_HEADER_TEST_IDS.HOME_LINK);
    expect(homeLink).toBeVisible();
    expect(homeLink).toHaveAttribute('href', defaultProps.homeLink);

    const expressLink = screen.getByTestId(APP_HEADER_TEST_IDS.EXPRESS_LINK);
    expect(expressLink).toBeVisible();
    expect(expressLink).toHaveAttribute('href', defaultProps.expressLink);
  });

  it('should render without express link', () => {
    setup({ expressLink: undefined });

    const appHeader = screen.getByTestId(APP_HEADER_TEST_IDS.APP_HEADER);
    expect(appHeader).toBeVisible();

    const homeLink = screen.getByTestId(APP_HEADER_TEST_IDS.HOME_LINK);
    expect(homeLink).toBeVisible();
    expect(homeLink).toHaveAttribute('href', defaultProps.homeLink);

    const expressLink = screen.queryByTestId(APP_HEADER_TEST_IDS.EXPRESS_LINK);
    expect(expressLink).not.toBeInTheDocument();
  });
});
