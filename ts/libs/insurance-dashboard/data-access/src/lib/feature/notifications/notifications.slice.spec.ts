import {
  notificationsSlice,
  notificationsInitialState,
  selectNotifications,
  showSuccess,
  showError,
  removeNotification,
} from './notifications.slice';
import { setupTestStore } from '../../../testUtils';
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
      const store = setupTestStore();

      const initialNotifications = selectNotifications(store.getState());
      expect(initialNotifications).toEqual(
        notificationsInitialState.notifications
      );

      store.dispatch(
        showSuccess({
          message: 'test',
        })
      );
      const updatedNotifications = selectNotifications(store.getState());
      expect(updatedNotifications).toEqual([
        {
          ...updatedNotifications[0],
          message: 'test',
          type: NotificationType.SUCCESS,
        },
      ]);
    });

    it('showError should add an error notification to the state', () => {
      const store = setupTestStore();

      const initialNotifications = selectNotifications(store.getState());
      expect(initialNotifications).toEqual(
        notificationsInitialState.notifications
      );

      store.dispatch(
        showError({
          message: 'test error',
        })
      );
      const updatedNotifications = selectNotifications(store.getState());
      expect(updatedNotifications).toEqual([
        {
          ...updatedNotifications[0],
          message: 'test error',
          type: NotificationType.ERROR,
        },
      ]);
    });

    it('removeNotification should remove a notification from the state', () => {
      const store = setupTestStore({
        [notificationsSlice.name]: {
          ...notificationsInitialState,
          notifications: mockedNotifications,
        },
      });
      const removedNotificationTimestamp = mockedNotifications[0].timestamp;

      store.dispatch(
        removeNotification({
          timestamp: removedNotificationTimestamp,
        })
      );

      const updatedNotifications = selectNotifications(store.getState());

      expect(updatedNotifications).toEqual(
        mockedNotifications.filter(
          (notification) =>
            notification.timestamp !== removedNotificationTimestamp
        )
      );
    });
  });
});
