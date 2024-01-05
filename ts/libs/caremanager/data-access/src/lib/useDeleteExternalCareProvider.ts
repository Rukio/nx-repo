import { useMutation, useQueryClient } from 'react-query';
import {
  CareManagerServiceDeleteExternalCareProviderRequest,
  GetPatientResponse,
  Patient,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useDeleteExternalCareProvider = (patientId: Patient['id']) => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    'deleteExternalCareProvider',
    (input: CareManagerServiceDeleteExternalCareProviderRequest) =>
      API.careManagerServiceDeleteExternalCareProvider(input),
    {
      onSuccess: (response) => {
        const key = patientKeys.detail(patientId);
        const previousPatientData =
          queryClient.getQueryData<GetPatientResponse>(key);

        queryClient.setQueryData<GetPatientResponse>(key, {
          ...previousPatientData,
          externalCareProviders: response.patientExternalCareProviders,
        });
      },
    }
  );
};
