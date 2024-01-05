import { Notification, NotificationType } from './types';

export const mockedNotifications: Notification[] = [
  {
    timestamp: 2,
    type: NotificationType.ERROR,
    message: 'error',
  },
  {
    timestamp: 1,
    type: NotificationType.SUCCESS,
    message: 'success',
  },
];
