import useApi from './useApi';
import { useQuery } from 'react-query';

export const useGetConfig = () => {
  const { API } = useApi();

  return useQuery(['config'], () => API.careManagerServiceGetConfig(), {
    refetchOnMount: false,
  });
};
