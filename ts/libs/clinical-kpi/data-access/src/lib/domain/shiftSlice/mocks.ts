import {
  ShiftSnapshot,
  ShiftSnapshots,
  SnapshotPhase,
  TimelineSnapshot,
} from '../../types';

const SNAPSHOT_SHARED_DATA: Pick<
  ShiftSnapshot,
  'latitudeE6' | 'longitudeE6' | 'shiftTeamId'
> = {
  latitudeE6: 0,
  longitudeE6: 0,
  shiftTeamId: '123',
};

export const mockedShiftSnapshots: ShiftSnapshots = {
  shiftSnapshots: [
    {
      startTimestamp: '2023-05-25T06:00:00',
      endTimestamp: '2023-05-25T06:27:00',
      phase: SnapshotPhase.PHASE_EN_ROUTE,
      ...SNAPSHOT_SHARED_DATA,
    },
    {
      startTimestamp: '2023-05-25T06:27:00',
      endTimestamp: '2023-05-25T06:59:00',
      phase: SnapshotPhase.PHASE_ON_SCENE,
      ...SNAPSHOT_SHARED_DATA,
    },
  ],
};

export const mockedMappedSnapshots: ShiftSnapshot[] = [
  {
    startTimestamp: '2023-05-25T06:00:00',
    endTimestamp: '2023-05-25T06:27:00',
    phase: SnapshotPhase.PHASE_EN_ROUTE,
    ...SNAPSHOT_SHARED_DATA,
  },
  {
    startTimestamp: '2023-05-25T06:27:00',
    endTimestamp: '2023-05-25T06:59:00',
    phase: SnapshotPhase.PHASE_ON_SCENE,
    ...SNAPSHOT_SHARED_DATA,
  },
];

export const mockedTimelineSnapshots: TimelineSnapshot[] = [
  {
    startTimestamp: '2023-05-25T06:00:00',
    endTimestamp: '2023-05-25T06:27:00',
    phase: SnapshotPhase.PHASE_EN_ROUTE,
  },
  {
    startTimestamp: '2023-05-25T06:27:00',
    endTimestamp: '2023-05-25T06:59:00',
    phase: SnapshotPhase.PHASE_ON_SCENE,
  },
];
