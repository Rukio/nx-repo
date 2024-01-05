import { useQuery } from 'react-query';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useGetEpisode = (episodeId: string) => {
  const { API } = useApi();

  return useQuery(episodeKeys.detail(episodeId), ({ queryKey: [{ id }] }) =>
    API.careManagerServiceGetEpisode({ episodeId: id })
  );
};
