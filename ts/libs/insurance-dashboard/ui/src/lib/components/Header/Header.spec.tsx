import { render, screen } from '../../../testUtils';
import Header from './Header';
import { HEADER_TEST_IDS } from './testIds';

const onLogout = vi.fn();

describe('<Header />', () => {
  it('should render properly', () => {
    render(<Header userName="John Doe" logoUrl="/" onLogout={onLogout} />);

    const logo = screen.getByTestId(HEADER_TEST_IDS.LOGO);
    expect(logo).toBeVisible();

    const button = screen.getByTestId(HEADER_TEST_IDS.USER_NAME_BUTTON);
    expect(button).toBeVisible();
    expect(button).toHaveTextContent('John Doe');
  });

  it('logout button should be clickable', async () => {
    const { user } = render(
      <Header userName="John Doe" logoUrl="/" onLogout={onLogout} />
    );
    const button = screen.getByTestId(HEADER_TEST_IDS.USER_NAME_BUTTON);
    expect(button).toBeVisible();

    expect(button).toBeEnabled();
    await user.click(button);
    const menu = screen.getByTestId(HEADER_TEST_IDS.HEADER_MENU);
    expect(menu).toBeVisible();
    const logoutMenuItem = screen.getByTestId(
      HEADER_TEST_IDS.SIGN_OUT_MENU_ITEM
    );
    expect(logoutMenuItem).toBeVisible();
    await user.click(logoutMenuItem);
    expect(onLogout).toHaveBeenCalled();
  });
});
