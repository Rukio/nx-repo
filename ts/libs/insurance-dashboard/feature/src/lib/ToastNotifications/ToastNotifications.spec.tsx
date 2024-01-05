import { render, screen, act } from '../../testUtils';
import ToastNotifications from './ToastNotifications';
import { TOAST_NOTIFICATIONS_TEST_IDS } from './testIds';
import {
  NOTIFICATION_AUTO_HIDE_DURATION,
  NOTIFICATION_SUCCESS_MOCK,
  NOTIFICATION_ERROR_MOCK,
} from './constants';
import { Notification } from '@*company-data-covered*/insurance/data-access';

const setup = ({ notifications }: { notifications: Notification[] }) =>
  render(<ToastNotifications />, {
    preloadedState: {
      notifications: {
        notifications,
      },
    },
  });

describe('<ToasterNotifications />', () => {
  it('should render properly', async () => {
    setup({
      notifications: [NOTIFICATION_SUCCESS_MOCK],
    });

    const root = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ROOT);
    const snackbar = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR);
    const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(root).toBeVisible();
    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();
  });

  it('should show a "success" type notification with correct text', () => {
    setup({
      notifications: [NOTIFICATION_SUCCESS_MOCK],
    });

    const snackbar = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR);
    const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(snackbar).toBeVisible();
    expect(alert).toHaveTextContent('text');
    expect(alert).toHaveClass('MuiAlert-filledSuccess');
  });

  it('should show an "error" type notification with correct text', () => {
    setup({
      notifications: [NOTIFICATION_ERROR_MOCK],
    });

    const alert = screen.getByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(alert).toHaveTextContent('error text');
    expect(alert).toHaveClass('MuiAlert-filledError');
  });

  it('should auto-remove a notification after a delay', async () => {
    vi.useFakeTimers();
    setup({
      notifications: [NOTIFICATION_ERROR_MOCK],
    });

    const root = screen.queryByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ROOT);
    const snackbar = screen.queryByTestId(
      TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR
    );
    const alert = screen.queryByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(snackbar).toBeVisible();
    expect(alert).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(NOTIFICATION_AUTO_HIDE_DURATION);
    });

    expect(snackbar).not.toBeInTheDocument();
    expect(alert).not.toBeInTheDocument();
    expect(root).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should not show a notification', () => {
    setup({
      notifications: [],
    });

    const snackbar = screen.queryByTestId(
      TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR
    );
    const alert = screen.queryByTestId(TOAST_NOTIFICATIONS_TEST_IDS.ALERT);

    expect(snackbar).not.toBeInTheDocument();
    expect(alert).not.toBeInTheDocument();
  });
});
