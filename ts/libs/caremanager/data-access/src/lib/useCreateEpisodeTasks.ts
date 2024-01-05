import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceCreateEpisodeTasksOperationRequest,
  CreateEpisodeTasksResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useCreateEpisodeTasks = (episodeId: string) => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    CreateEpisodeTasksResponse,
    unknown,
    CareManagerServiceCreateEpisodeTasksOperationRequest
  >(
    'createEpisodeTasks',
    (input) => API.careManagerServiceCreateEpisodeTasks(input),
    {
      onSuccess: async (response) => {
        if (!response.tasks) {
          return;
        }

        // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
        await queryClient.invalidateQueries(episodeKeys.detail(episodeId));
        showSuccess(SNACKBAR_MESSAGES.CREATED_TASK);
      },
    }
  );
};
