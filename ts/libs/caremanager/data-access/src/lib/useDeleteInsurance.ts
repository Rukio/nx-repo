import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceDeleteInsuranceRequest,
  GetPatientResponse,
  Patient,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useDeleteInsurance = (patientId: Patient['id']) => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation(
    'deleteInsurance',
    (input: CareManagerServiceDeleteInsuranceRequest) =>
      API.careManagerServiceDeleteInsurance(input),
    {
      onSuccess: (response) => {
        const key = patientKeys.detail(patientId);
        const previousPatientData =
          queryClient.getQueryData<GetPatientResponse>(key);

        queryClient.setQueryData<GetPatientResponse>(key, {
          ...previousPatientData,
          insurances: response.patientInsurances,
        });

        showSuccess(SNACKBAR_MESSAGES.DELETED_INSURANCE);
      },
    }
  );
};
