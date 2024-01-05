import {
  NotificationType,
  Notification,
} from '@*company-data-covered*/insurance/data-access';

export const NOTIFICATION_AUTO_HIDE_DURATION = 4000;
export const NOTIFICATION_SUCCESS_MOCK: Notification = {
  timestamp: 1,
  type: NotificationType.SUCCESS,
  message: 'text',
};

export const NOTIFICATION_ERROR_MOCK: Notification = {
  timestamp: 1,
  type: NotificationType.ERROR,
  message: 'error text',
};
