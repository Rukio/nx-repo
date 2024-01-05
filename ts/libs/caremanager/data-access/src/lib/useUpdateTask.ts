import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdateTaskOperationRequest,
  UpdateTaskResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useUpdateTask = (episodeId: string) => {
  const queryClient = useQueryClient();
  const { API } = useApi();
  const { showSuccess } = useSnackbar();

  return useMutation<
    UpdateTaskResponse,
    unknown,
    CareManagerServiceUpdateTaskOperationRequest
  >('updateTask', (input) => API.careManagerServiceUpdateTask(input), {
    onSuccess: async (response) => {
      if (!response.task) {
        return;
      }

      // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
      await queryClient.invalidateQueries(episodeKeys.detail(episodeId));
      showSuccess(SNACKBAR_MESSAGES.EDITED_TASK);
    },
  });
};
