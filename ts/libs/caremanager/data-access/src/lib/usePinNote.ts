import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServicePinNoteRequest,
  PinNoteResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const usePinNote = (episodeId: string) => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    PinNoteResponse,
    unknown,
    CareManagerServicePinNoteRequest
  >('pinNote', (input) => API.careManagerServicePinNote(input), {
    onSuccess: async (response) => {
      if (!response.note) {
        return;
      }

      // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
      await queryClient.invalidateQueries(episodeKeys.detail(episodeId));
      showSuccess(SNACKBAR_MESSAGES.PINNED_NOTE);
    },
  });
};
