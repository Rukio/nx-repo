import { useMutation } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  TRACK_CREATE_EPISODE,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  CareManagerServiceCreateEpisodeRequest,
  CreateEpisodeResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useCreateEpisode = () => {
  const { API } = useApi();
  const { showSuccess } = useSnackbar();
  const { trackEvent } = useAnalytics();

  return useMutation<
    CreateEpisodeResponse,
    unknown,
    CareManagerServiceCreateEpisodeRequest
  >('createEpisode', (input) => API.careManagerServiceCreateEpisode(input), {
    onSuccess: (data) => {
      trackEvent(TRACK_CREATE_EPISODE, data.episode);
      showSuccess(SNACKBAR_MESSAGES.CREATED_EPISODE);
    },
  });
};
