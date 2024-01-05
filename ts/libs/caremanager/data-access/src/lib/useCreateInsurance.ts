import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import useApi from './useApi';
import { patientKeys } from './patientKeys';
import {
  CareManagerServiceCreateInsuranceRequest,
  GetPatientResponse,
} from '@*company-data-covered*/caremanager/data-access-types';

export const useCreateInsurance = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation(
    'createInsurance',
    (input: CareManagerServiceCreateInsuranceRequest) =>
      API.careManagerServiceCreateInsurance(input),
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

        showSuccess(SNACKBAR_MESSAGES.CREATED_INSURANCE);
      },
    }
  );
};
