import {
  notificationsSlice,
  notificationsInitialState,
  selectNotifications,
  showSuccess,
  showError,
  removeNotification,
} from './notifications.slice';
import { NotificationType } from './types';
import { mockedNotifications } from './mocks';

describe('notifications.slice', () => {
  it('should initialize default reducer state', () => {
    const state = notificationsSlice.reducer(undefined, {
      type: undefined,
    });

    expect(state).toEqual(notificationsInitialState);
  });

  describe('reducers', () => {
    it('showSuccess should add a success notification to the state', () => {
      const message = 'success notification';

      const updatedState = notificationsSlice.reducer(
        notificationsInitialState,
        showSuccess({ message })
      );

      const updatedNotifications = selectNotifications({
        notifications: updatedState,
      });

      expect(updatedNotifications).toEqual([
        {
          timestamp: updatedState.notifications[0].timestamp,
          message,
          type: NotificationType.SUCCESS,
        },
      ]);
    });

    it('showError should add an error notification to the state', () => {
      const message = 'error notification';

      const updatedState = notificationsSlice.reducer(
        notificationsInitialState,
        showError({ message })
      );

      const updatedNotifications = selectNotifications({
        notifications: updatedState,
      });

      expect(updatedNotifications).toEqual([
        {
          timestamp: updatedState.notifications[0].timestamp,
          type: NotificationType.ERROR,
          message,
        },
      ]);
    });

    it('removeNotification should remove a notification from the state', () => {
      const updatedState = notificationsSlice.reducer(
        {
          notifications: mockedNotifications,
        },
        removeNotification({ timestamp: mockedNotifications[0].timestamp })
      );

      const updatedNotifications = selectNotifications({
        notifications: updatedState,
      });

      expect(updatedNotifications).toEqual(
        mockedNotifications.filter(
          (notification) =>
            notification.timestamp !== mockedNotifications[0].timestamp
        )
      );
    });
  });
});
