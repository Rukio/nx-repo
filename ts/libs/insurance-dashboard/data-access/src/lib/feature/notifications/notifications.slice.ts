import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import {
  Notification,
  NotificationPayload,
  NotificationsState,
  NotificationType,
} from './types';

export const NOTIFICATIONS_KEY = 'notifications';

export const notificationsInitialState: NotificationsState = {
  notifications: [],
};

export const notificationsSlice = createSlice({
  name: NOTIFICATIONS_KEY,
  initialState: notificationsInitialState,
  reducers: {
    showSuccess(state, action: PayloadAction<NotificationPayload>) {
      state.notifications.push({
        ...action.payload,
        type: NotificationType.SUCCESS,
        timestamp: Date.now(),
      });
    },
    showError(state, action: PayloadAction<NotificationPayload>) {
      state.notifications.push({
        ...action.payload,
        type: NotificationType.ERROR,
        timestamp: Date.now(),
      });
    },
    removeNotification(
      state,
      action: PayloadAction<Pick<Notification, 'timestamp'>>
    ) {
      state.notifications = state.notifications.filter(
        (notification) => notification.timestamp !== action.payload.timestamp
      );
    },
  },
});

export const selectNotificationsState = (state: RootState) =>
  state[NOTIFICATIONS_KEY];

export const selectNotifications = createSelector(
  selectNotificationsState,
  (notificationsState) => notificationsState.notifications
);

export const { showSuccess, showError, removeNotification } =
  notificationsSlice.actions;
