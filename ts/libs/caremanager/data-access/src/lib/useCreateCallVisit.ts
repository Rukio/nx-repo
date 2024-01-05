import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceCreateCallVisitRequest,
  CreateCallVisitResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useCreateCallVisit = () => {
  const { API } = useApi();
  const { showSuccess } = useSnackbar();
  const queryClient = useQueryClient();

  return useMutation<
    CreateCallVisitResponse,
    unknown,
    CareManagerServiceCreateCallVisitRequest
  >(
    'createCallVisit',
    (input) => API.careManagerServiceCreateCallVisit(input),
    {
      onSuccess: async (_, variables) => {
        showSuccess(SNACKBAR_MESSAGES.CREATED_CALL);

        await queryClient.invalidateQueries(
          visitKeys.episodeVisitList(variables.body.episodeId)
        );
      },
    }
  );
};
