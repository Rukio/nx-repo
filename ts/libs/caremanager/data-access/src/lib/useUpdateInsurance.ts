import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdateInsuranceOperationRequest,
  GetPatientResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useUpdateInsurance = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation(
    'updateInsurance',
    (input: CareManagerServiceUpdateInsuranceOperationRequest) =>
      API.careManagerServiceUpdateInsurance(input),
    {
      onSuccess: (response) => {
        const patientId = response.insurance?.patientId;
        const key = patientId ? patientKeys.detail(patientId) : [];
        const previousPatientData =
          queryClient.getQueryData<GetPatientResponse>(key);

        queryClient.setQueryData<GetPatientResponse>(key, {
          ...previousPatientData,
          insurances: response.patientInsurances,
        });

        showSuccess(SNACKBAR_MESSAGES.UPDATED_INSURANCE);
      },
    }
  );
};
