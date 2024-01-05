import { useQuery } from 'react-query';
import useApi from './useApi';

export const useGetVisitTypes = () => {
  const { API } = useApi();

  return useQuery(['visitTypes'], () => API.careManagerServiceGetVisitTypes());
};
