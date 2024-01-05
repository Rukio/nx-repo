import { useQuery } from 'react-query';
import useApi from './useApi';
import {
  CareManagerServiceSearchUsersRequest,
  SearchUsersResponse,
} from '@*company-data-covered*/caremanager/data-access-types';

export const useSearchUsers = (searchTerm: string) => {
  const { API } = useApi();

  return useQuery<SearchUsersResponse, CareManagerServiceSearchUsersRequest>(
    ['searchUsers', searchTerm],
    () => {
      if (!searchTerm.length || searchTerm.length < 3) {
        return { users: [] };
      }

      return API.careManagerServiceSearchUsers({ body: { searchTerm } });
    },
    {
      staleTime: Infinity,
    }
  );
};
