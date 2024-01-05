export const visitKeys = {
  all: [{ entity: 'visits' }] as const,
  details: () => [{ ...visitKeys.all[0], scope: 'details' }] as const,
  detail: (id: string) => [{ ...visitKeys.details()[0], id }] as const,
  episodeVisitLists: () =>
    [{ ...visitKeys.all[0], scope: 'episodeVisitLists' }] as const,
  episodeVisitList: (episodeId: string) =>
    [{ ...visitKeys.episodeVisitLists()[0], id: episodeId }] as const,
};
