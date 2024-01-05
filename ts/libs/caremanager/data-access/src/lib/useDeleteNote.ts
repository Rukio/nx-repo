import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import { CareManagerServiceDeleteNoteRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useDeleteNote = (episodeId: string) => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<unknown, unknown, CareManagerServiceDeleteNoteRequest>(
    'deleteNote',
    (input) => API.careManagerServiceDeleteNote(input),
    {
      onSuccess: async () => {
        // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
        await queryClient.invalidateQueries(episodeKeys.detail(episodeId));
        showSuccess(SNACKBAR_MESSAGES.DELETED_NOTE);
      },
    }
  );
};
