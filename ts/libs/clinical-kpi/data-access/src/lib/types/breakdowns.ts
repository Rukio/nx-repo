export enum SnapshotPhase {
  PHASE_EN_ROUTE = 'en_route',
  PHASE_ON_SCENE = 'on_scene',
  PHASE_ON_BREAK = 'on_break',
  PHASE_IDLE = 'idle',
}

export interface ShiftSnapshot {
  shiftTeamId: string;
  startTimestamp: string;
  endTimestamp: string;
  phase: SnapshotPhase;
  latitudeE6: number;
  longitudeE6: number;
}

export interface ShiftSnapshots {
  shiftSnapshots: ShiftSnapshot[];
}

export interface TimelineSnapshot {
  phase: SnapshotPhase;
  startTimestamp: string;
  endTimestamp: string;
}
