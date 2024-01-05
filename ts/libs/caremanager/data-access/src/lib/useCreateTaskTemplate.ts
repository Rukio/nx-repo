import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceCreateTaskTemplateRequest,
  CreateTaskTemplateResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useCreateTaskTemplate = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    CreateTaskTemplateResponse,
    unknown,
    CareManagerServiceCreateTaskTemplateRequest
  >(
    'createTaskTemplate',
    (input) => API.careManagerServiceCreateTaskTemplate(input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['taskTemplates']);
        showSuccess(SNACKBAR_MESSAGES.CREATED_TEMPLATE);
      },
    }
  );
};
