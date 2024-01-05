import { ShiftSnapshot, ShiftSnapshots, TimelineSnapshot } from '../../types';
import { clinicalKpiApiSlice } from '../apiSlice';
import { skipToken } from '@reduxjs/toolkit/query';
import { createSelector } from '@reduxjs/toolkit';

export const SHIFTS_PATH = 'shifts';
export const SNAPSHOTS_PATH = 'snapshots';

const getShiftSnapshotsPath = (id: string | number) =>
  `${SHIFTS_PATH}/${id}/${SNAPSHOTS_PATH}`;

export const shiftsSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listShiftSnapshots: builder.query<ShiftSnapshot[], string | number>({
      query: (id) => getShiftSnapshotsPath(id),
      transformResponse: ({ shiftSnapshots }: ShiftSnapshots) => shiftSnapshots,
    }),
  }),
});

export const { useListShiftSnapshotsQuery } = shiftsSlice;

export const selectShiftSnapshots =
  shiftsSlice.endpoints.listShiftSnapshots.select;

export const selectTimelineSnapshotsForShiftTeam = (shiftTeamId?: string) =>
  createSelector(
    selectShiftSnapshots(shiftTeamId ?? skipToken),
    ({ data: snapshots }) => {
      if (!snapshots) {
        return [];
      }

      return snapshots.reduce<TimelineSnapshot[]>((acc, snapshot) => {
        acc.push({
          phase: snapshot.phase,
          startTimestamp: snapshot.startTimestamp,
          endTimestamp: snapshot.endTimestamp,
        });

        return acc;
      }, []);
    }
  );
