import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUnpinNoteRequest,
  UnpinNoteResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useUnpinNote = (episodeId: string) => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    UnpinNoteResponse,
    unknown,
    CareManagerServiceUnpinNoteRequest
  >('unpinNote', (input) => API.careManagerServiceUnpinNote(input), {
    onSuccess: async (response) => {
      if (!response.note) {
        return;
      }

      // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
      await queryClient.invalidateQueries(episodeKeys.detail(episodeId));
      showSuccess(SNACKBAR_MESSAGES.UNPINNED_NOTE);
    },
  });
};
