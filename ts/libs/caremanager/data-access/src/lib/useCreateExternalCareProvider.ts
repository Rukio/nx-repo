import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceCreateExternalCareProviderRequest,
  GetPatientResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useCreateExternalCareProvider = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation(
    'createExternalCareProvider',
    (input: CareManagerServiceCreateExternalCareProviderRequest) =>
      API.careManagerServiceCreateExternalCareProvider(input),
    {
      onSuccess: (response) => {
        const patientId = response.externalCareProvider?.patientId;
        const key = patientId ? patientKeys.detail(patientId) : [];
        const previousPatientData =
          queryClient.getQueryData<GetPatientResponse>(key);

        queryClient.setQueryData<GetPatientResponse>(key, {
          ...previousPatientData,
          externalCareProviders: response.patientExternalCareProviders,
        });

        showSuccess(SNACKBAR_MESSAGES.CREATED_EXTERNAL_CARE_PROVIDER);
      },
    }
  );
};
