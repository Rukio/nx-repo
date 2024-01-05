import { QueryKey, UseQueryOptions, useQuery } from 'react-query';
import {
  CareManagerServiceGetEpisodesRequest,
  GetEpisodesResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

type Options = Omit<
  UseQueryOptions<GetEpisodesResponse, unknown, GetEpisodesResponse, QueryKey>,
  'queryKey' | 'queryFn'
>;

export const useGetEpisodes = (
  input: CareManagerServiceGetEpisodesRequest,
  options?: Options
) => {
  const { API } = useApi();

  return useQuery<GetEpisodesResponse>(
    episodeKeys.list(input),
    () => API.careManagerServiceGetEpisodes(input),
    options
  );
};
