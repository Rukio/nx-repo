/** The different possible states of a care request. */
export enum CareRequestStatusText {
  /** The care request has been submitted. */
  Requested = 'requested',

  /** The care has been scheduled. */
  Scheduled = 'scheduled',

  /** The care request has been committed to a care team. */
  Committed = 'committed',

  /** The care request has been accepted by the care team. */
  Accepted = 'accepted',

  /** The care team is en route the care request location. */
  OnRoute = 'on_route',

  /** The care team has arrived at the care request location. */
  OnScene = 'on_scene',

  /** The care request has been completed. */
  Complete = 'complete',

  /** The care request has been cancelled. */
  Archived = 'archived',
}
