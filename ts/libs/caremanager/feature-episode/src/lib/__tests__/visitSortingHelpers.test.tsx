import add from 'date-fns/add';
import { VisitListElement } from '@*company-data-covered*/caremanager/data-access-types';
import {
  sortActiveVisits,
  sortPastVisits,
  sortUpcomingVisits,
} from '../visitSortingHelpers';

describe('sorting functions for Visits in Episodes', () => {
  const now = new Date();
  const visitsToSort: VisitListElement[] = [
    {
      id: '1',
      updatedAt: add(now, { minutes: 2 }).toString(),
      episodeId: '1',
      createdAt: add(now, { minutes: 2 }).toString(),
    },
    {
      id: '2',
      updatedAt: add(now, { days: 2 }).toString(),
      episodeId: '1',
      createdAt: add(now, { days: 2 }).toString(),
    },
    {
      id: '3',
      updatedAt: add(now, { days: 1 }).toString(),
      episodeId: '1',
      createdAt: add(now, { days: 1 }).toString(),
    },

    {
      id: '4',
      updatedAt: now.toString(),
      episodeId: '1',
      createdAt: now.toString(),
      status: 'on_scene',
      statusUpdatedAt: now.toString(),
    },
    {
      id: '5',
      updatedAt: add(now, { days: 2, minutes: 10 }).toString(),
      episodeId: '1',
      createdAt: add(now, { days: 2, minutes: 10 }).toString(),
      status: 'on_scene',
      statusUpdatedAt: add(now, { days: 2, minutes: 10 }).toString(),
    },
    {
      id: '6',
      updatedAt: add(now, { days: 3 }).toString(),
      episodeId: '1',
      createdAt: add(now, { days: 3 }).toString(),
      status: 'on_scene',
      statusUpdatedAt: add(now, { days: 3 }).toString(),
    },
    {
      id: '7',
      updatedAt: add(now, { days: 1, minutes: 1 }).toString(),
      episodeId: '1',
      createdAt: add(now, { days: 1, minutes: 1 }).toString(),
      eta: add(now, { days: 1, minutes: 1 }).toString(),
    },
    {
      id: '8',
      updatedAt: add(now, { hours: 1 }).toString(),
      episodeId: '1',
      createdAt: add(now, { hours: 1 }).toString(),
      eta: add(now, { hours: 1 }).toString(),
    },
  ];

  describe('sortActiveVisits', () => {
    it('should sort visits by with eta or on scene descending at the beginning if included, otherwise sort visits by createdAt descending at the end', () => {
      expect(sortActiveVisits(visitsToSort)).toStrictEqual([
        { ...visitsToSort[3] },
        { ...visitsToSort[7] },
        { ...visitsToSort[6] },
        { ...visitsToSort[4] },
        { ...visitsToSort[5] },

        { ...visitsToSort[0] },
        { ...visitsToSort[2] },
        { ...visitsToSort[1] },
      ]);
    });
  });

  describe('sortUpcomingVisits', () => {
    it('should sort visits by eta descending at the beginning if included , otherwise sort by createdAt descending at the end', () => {
      expect(sortUpcomingVisits(visitsToSort)).toStrictEqual([
        { ...visitsToSort[7] },
        { ...visitsToSort[6] },

        { ...visitsToSort[3] },
        { ...visitsToSort[0] },
        { ...visitsToSort[2] },
        { ...visitsToSort[1] },
        { ...visitsToSort[4] },
        { ...visitsToSort[5] },
      ]);
    });
  });

  describe('sortPastVisits', () => {
    it('should sort visits by updateStatusAt descending if included, otherwise it should sort by createdAt descending', () => {
      expect(sortPastVisits(visitsToSort)).toStrictEqual([
        { ...visitsToSort[3] },
        { ...visitsToSort[0] },
        { ...visitsToSort[7] },
        { ...visitsToSort[2] },
        { ...visitsToSort[6] },
        { ...visitsToSort[1] },
        { ...visitsToSort[4] },
        { ...visitsToSort[5] },
      ]);
    });
  });
});
