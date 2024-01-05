import { useMutation, useQueryClient } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdatePharmacyOperationRequest,
  GetPatientResponse,
  UpdatePharmacyResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useUpdatePharmacy = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  return useMutation<
    UpdatePharmacyResponse,
    unknown,
    CareManagerServiceUpdatePharmacyOperationRequest
  >('updatePharmacy', (input) => API.careManagerServiceUpdatePharmacy(input), {
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

      showSuccess(SNACKBAR_MESSAGES.EDITED_PHARMACY);
    },
  });
};
