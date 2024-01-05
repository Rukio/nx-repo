import { useMutation, useQueryClient } from 'react-query';
import {
  TRACK_UPDATE_PATIENT,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdatePatientOperationRequest,
  GetPatientResponse,
  UpdatePatientResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useUpdatePatient = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  const { showSuccess } = useSnackbar();

  return useMutation<
    UpdatePatientResponse,
    unknown,
    CareManagerServiceUpdatePatientOperationRequest
  >('updatePatient', (input) => API.careManagerServiceUpdatePatient(input), {
    onSuccess: (response) => {
      if (!response.patient) {
        return;
      }

      const key = patientKeys.detail(response.patient.id);
      const previousPatientData =
        queryClient.getQueryData<GetPatientResponse>(key);

      queryClient.setQueryData<GetPatientResponse>(key, {
        ...previousPatientData,
        ...response,
      });
      trackEvent(TRACK_UPDATE_PATIENT, response.patient);

      showSuccess(SNACKBAR_MESSAGES.EDITED_PATIENT);
    },
  });
};
