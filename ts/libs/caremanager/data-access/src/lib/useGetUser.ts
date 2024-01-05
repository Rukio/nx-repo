import { useQuery, useQueryClient } from 'react-query';
import { User } from '@*company-data-covered*/caremanager/data-access-types';
import { userKeys } from './userKeys';

export const useGetUser = (id: string) => {
  const queryClient = useQueryClient();

  return useQuery(userKeys.detail(id), () =>
    queryClient.getQueryData<User>(userKeys.detail(id))
  );
};
