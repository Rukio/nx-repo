import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdateEpisodeOperationRequest,
  UpdateEpisodeResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { episodeKeys } from './episodeKeys';

export const useUpdateEpisode = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    UpdateEpisodeResponse,
    unknown,
    CareManagerServiceUpdateEpisodeOperationRequest
  >('updateEpisode', (input) => API.careManagerServiceUpdateEpisode(input), {
    onSuccess: (response) => {
      if (!response.episode) {
        return;
      }

      showSuccess(SNACKBAR_MESSAGES.EDITED_EPISODE);
      queryClient.setQueryData(
        episodeKeys.detail(response.episode.id),
        response
      );
    },
  });
};
