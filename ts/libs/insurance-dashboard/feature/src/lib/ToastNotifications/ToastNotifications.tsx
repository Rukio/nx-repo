import { useSelector } from 'react-redux';
import {
  selectNotifications,
  useAppDispatch,
  removeNotification,
} from '@*company-data-covered*/insurance/data-access';
import { TOAST_NOTIFICATIONS_TEST_IDS } from './testIds';
import { NOTIFICATION_AUTO_HIDE_DURATION } from './constants';
import {
  Alert,
  Box,
  Snackbar,
  SnackbarOrigin,
} from '@*company-data-covered*/design-system';

const anchorOrigin: SnackbarOrigin = { vertical: 'top', horizontal: 'right' };

const ToastNotifications = () => {
  const notifications = useSelector(selectNotifications);
  const dispatch = useAppDispatch();
  const handleRemove = (timestamp: number) => {
    if (Date.now() - timestamp > NOTIFICATION_AUTO_HIDE_DURATION) {
      dispatch(removeNotification({ timestamp }));
    }
  };
  const notification = notifications[0];

  return (
    notification && (
      <Box data-testid={TOAST_NOTIFICATIONS_TEST_IDS.ROOT}>
        <Snackbar
          open
          autoHideDuration={NOTIFICATION_AUTO_HIDE_DURATION}
          anchorOrigin={anchorOrigin}
          key={notification.timestamp}
          data-testid={TOAST_NOTIFICATIONS_TEST_IDS.SNACKBAR}
          onClose={() => handleRemove(notification.timestamp)}
        >
          <div>
            <Alert
              message={notification.message}
              severity={notification.type}
              variant="filled"
              data-testid={TOAST_NOTIFICATIONS_TEST_IDS.ALERT}
            />
          </div>
        </Snackbar>
      </Box>
    )
  );
};

export default ToastNotifications;
