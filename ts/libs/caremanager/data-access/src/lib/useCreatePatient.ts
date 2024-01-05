import { useMutation } from 'react-query';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceCreatePatientRequest,
  CreatePatientResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useCreatePatient = () => {
  const { API } = useApi();
  const { showSuccess } = useSnackbar();

  return useMutation<
    CreatePatientResponse,
    unknown,
    CareManagerServiceCreatePatientRequest
  >('createPatient', (input) => API.careManagerServiceCreatePatient(input), {
    onSuccess: () => {
      showSuccess(SNACKBAR_MESSAGES.CREATED_PATIENT);
    },
  });
};
