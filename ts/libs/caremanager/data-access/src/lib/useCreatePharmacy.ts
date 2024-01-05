import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceCreatePharmacyRequest,
  CreatePharmacyResponse,
  GetPatientResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useCreatePharmacy = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    CreatePharmacyResponse,
    unknown,
    CareManagerServiceCreatePharmacyRequest
  >('createPharmacy', (input) => API.careManagerServiceCreatePharmacy(input), {
    onSuccess: ({ pharmacy, patientPharmacies }) => {
      if (!pharmacy) {
        return;
      }

      const key = patientKeys.detail(pharmacy.patientId);

      const previousData = queryClient.getQueryData<GetPatientResponse>(key);
      if (previousData) {
        queryClient.setQueryData<GetPatientResponse>(key, {
          ...previousData,
          pharmacies: patientPharmacies,
        });
      }

      showSuccess(SNACKBAR_MESSAGES.CREATED_PHARMACY);
    },
  });
};
