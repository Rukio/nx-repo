export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface Notification {
  timestamp: number;
  type: NotificationType;
  message: string;
}

export interface NotificationsState {
  notifications: Notification[];
}

export interface NotificationPayload {
  message: string;
}
