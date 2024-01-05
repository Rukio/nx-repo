import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import { CareManagerServiceDeleteTaskTemplateRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useDeleteTaskTemplate = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    unknown,
    unknown,
    CareManagerServiceDeleteTaskTemplateRequest
  >(
    'deleteTaskTemplate',
    (input) => API.careManagerServiceDeleteTaskTemplate(input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['taskTemplates']);
        showSuccess(SNACKBAR_MESSAGES.DELETED_TEMPLATE);
      },
    }
  );
};
