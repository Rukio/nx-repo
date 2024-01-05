import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdateCallVisitOperationRequest,
  UpdateCallVisitResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useUpdateCallVisit = (episodeId: string) => {
  const { API } = useApi();
  const { showSuccess } = useSnackbar();
  const queryClient = useQueryClient();

  return useMutation<
    UpdateCallVisitResponse,
    unknown,
    CareManagerServiceUpdateCallVisitOperationRequest
  >(
    'updateCallVisit',
    (input) => API.careManagerServiceUpdateCallVisit(input),
    {
      onSuccess: async () => {
        showSuccess(SNACKBAR_MESSAGES.UPDATED_CALL);

        await queryClient.invalidateQueries(
          visitKeys.episodeVisitList(episodeId)
        );
      },
    }
  );
};
