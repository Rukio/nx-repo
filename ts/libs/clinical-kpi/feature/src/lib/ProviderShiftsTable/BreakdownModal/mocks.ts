import {
  SnapshotPhase,
  TimelineSnapshot,
} from '@*company-data-covered*/clinical-kpi/data-access';

export const MOCK_TIMELINE_EVENTS: TimelineSnapshot[] = [
  {
    phase: SnapshotPhase.PHASE_EN_ROUTE,
    startTimestamp: '2023-05-25T08:00:00Z',
    endTimestamp: '2023-05-25T08:25:00Z',
  },
  {
    phase: SnapshotPhase.PHASE_ON_SCENE,
    startTimestamp: '2023-05-25T08:25:00Z',
    endTimestamp: '2023-05-25T08:59:00Z',
  },
];
