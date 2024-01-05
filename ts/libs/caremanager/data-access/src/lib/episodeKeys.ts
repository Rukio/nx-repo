import { CareManagerServiceGetEpisodesRequest } from '@*company-data-covered*/caremanager/data-access-types';

export const episodeKeys = {
  all: [{ entity: 'episodes' }] as const,
  lists: () => [{ ...episodeKeys.all[0], scope: 'list' }] as const,
  list: (filters: CareManagerServiceGetEpisodesRequest) =>
    [{ ...episodeKeys.lists()[0], filters }] as const,
  details: () => [{ ...episodeKeys.all[0], scope: 'details' }] as const,
  detail: (id: string) => [{ ...episodeKeys.details()[0], id }] as const,
};
