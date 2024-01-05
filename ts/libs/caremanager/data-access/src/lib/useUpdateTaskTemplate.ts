import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdateTaskTemplateOperationRequest,
  UpdateTaskTemplateResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useUpdateTaskTemplate = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    UpdateTaskTemplateResponse,
    unknown,
    CareManagerServiceUpdateTaskTemplateOperationRequest
  >(
    'updateTaskTemplate',
    (input) => API.careManagerServiceUpdateTaskTemplate(input),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries(['taskTemplates']);
        showSuccess(SNACKBAR_MESSAGES.EDITED_TEMPLATE);
      },
    }
  );
};

export default useUpdateTaskTemplate;
