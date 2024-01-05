import { useQuery, useQueryClient } from 'react-query';
import { GetUsersByIDResponse } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { userKeys } from './userKeys';

export const useGetUsers = (ids?: string[]) => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useQuery(
    userKeys.list(ids),
    async (): Promise<GetUsersByIDResponse> => {
      try {
        const result = await API.careManagerServiceGetUsersByID({
          userIds: ids ?? [],
        });

        result.users.forEach((user) => {
          queryClient.setQueryData(userKeys.detail(user.id), user);
        });

        return result;
      } catch {
        /**
         * This catch is only intended to exist while the user ids migration
         * takes place, should be deleted once it has been fully migrated.
         */
        return { users: [] };
      }
    },
    {
      enabled: !!ids?.length,
    }
  );
};
