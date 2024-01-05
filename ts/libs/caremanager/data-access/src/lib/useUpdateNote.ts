import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdateNoteOperationRequest,
  UpdateNoteResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useUpdateNote = (episodeId: string) => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    UpdateNoteResponse,
    unknown,
    CareManagerServiceUpdateNoteOperationRequest
  >('updateNote', (input) => API.careManagerServiceUpdateNote(input), {
    onSuccess: async (response) => {
      if (!response.note) {
        return;
      }

      // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
      await queryClient.invalidateQueries(episodeKeys.detail(episodeId));
      showSuccess(SNACKBAR_MESSAGES.EDITED_NOTE);
    },
  });
};
