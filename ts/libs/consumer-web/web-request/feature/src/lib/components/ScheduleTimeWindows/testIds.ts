export const SCHEDULE_TIME_WINDOWS_TEST_IDS = {
  ALERT: 'schedule-time-windows-alert',
  AVAILABILITY_MESSAGE: 'schedule-time-windows-availability-message',
  DAY_TOGGLE_BUTTON_GROUP: 'schedule-time-windows-day-toggle-button-group',
  getDayToggleButtonTestId: (day: string) =>
    `schedule-time-windows-day-toggle-button-${day}`,
  MIN_TIME_RANGE_ERROR_MESSAGE:
    'schedule-time-windows-min-time-range-error-message',
};
