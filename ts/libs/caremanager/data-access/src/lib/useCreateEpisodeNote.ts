import { useMutation, useQueryClient } from 'react-query';
import useApi from './useApi';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  TRACK_CREATE_NOTE,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  CareManagerServiceCreateEpisodeNoteOperationRequest,
  CreateEpisodeNoteResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import { episodeKeys } from './episodeKeys';

export const useCreateEpisodeNote = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();
  const { trackEvent } = useAnalytics();

  return useMutation<
    CreateEpisodeNoteResponse,
    unknown,
    CareManagerServiceCreateEpisodeNoteOperationRequest
  >(
    'createEpisodeNote',
    (input) => API.careManagerServiceCreateEpisodeNote(input),
    {
      onSuccess: async (response, input) => {
        if (!response.note) {
          return;
        }

        // TODO: use `queryClient.setQueryData` instead to not trigger a refetch.
        await queryClient.invalidateQueries(
          episodeKeys.detail(input.episodeId)
        );
        showSuccess(SNACKBAR_MESSAGES.CREATED_NOTE);
        trackEvent(TRACK_CREATE_NOTE, response.note);
      },
    }
  );
};
