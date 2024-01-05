export enum MessageType {
  // SMS with link to Companion
  CompanionLinkSms = 'SMS: Companion link',

  // SMS notification that the care team is on the way
  OnRouteSms = 'SMS: on route',

  // SMS notification that the care team is running late
  RunningLateSms = 'SMS: running late',

  // Note in Care Request timeline indicating a running late SMS has been sent
  RunningLateNote = 'Timeline Note: running late sms sent',
}
