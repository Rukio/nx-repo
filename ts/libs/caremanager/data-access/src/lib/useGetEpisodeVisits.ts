import { UseQueryOptions, useQuery } from 'react-query';
import {
  CareManagerServiceGetEpisodeVisitsRequest,
  GetEpisodeVisitsResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

type Options = Omit<
  UseQueryOptions<GetEpisodeVisitsResponse>,
  'queryKey' | 'queryFn'
>;

export const useGetEpisodeVisits = (
  input: CareManagerServiceGetEpisodeVisitsRequest,
  options?: Options
) => {
  const { API } = useApi();
  const { episodeId } = input;

  return useQuery<GetEpisodeVisitsResponse>(
    visitKeys.episodeVisitList(episodeId),
    () => API.careManagerServiceGetEpisodeVisits(input),
    options
  );
};
