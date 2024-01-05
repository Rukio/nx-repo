import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import { CareManagerServiceDeleteTaskRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useDeleteTask = (episodeId: string) => {
  const queryClient = useQueryClient();
  const { API } = useApi();
  const { showSuccess } = useSnackbar();

  return useMutation<unknown, unknown, CareManagerServiceDeleteTaskRequest>(
    'deleteTask',
    (input) => API.careManagerServiceDeleteTask(input),
    {
      onSuccess: async () => {
        // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
        await queryClient.invalidateQueries(episodeKeys.detail(episodeId));
        showSuccess(SNACKBAR_MESSAGES.DELETED_TASK);
      },
    }
  );
};
