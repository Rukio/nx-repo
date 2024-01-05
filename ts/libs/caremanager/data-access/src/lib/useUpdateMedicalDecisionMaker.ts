import { useMutation, useQueryClient } from 'react-query';
import {
  CareManagerServiceUpdateMedicalDecisionMakerOperationRequest,
  GetPatientResponse,
  UpdateMedicalDecisionMakerResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useUpdateMedicalDecisionMaker = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation<
    UpdateMedicalDecisionMakerResponse,
    unknown,
    CareManagerServiceUpdateMedicalDecisionMakerOperationRequest
  >(
    'updateMedicalDecisionMaker',
    (input) => API.careManagerServiceUpdateMedicalDecisionMaker(input),
    {
      onSuccess: (response) => {
        if (!response.medicalDecisionMaker) {
          return;
        }

        const key = patientKeys.detail(response.medicalDecisionMaker.patientId);
        const previousPatientData =
          queryClient.getQueryData<GetPatientResponse>(key);

        queryClient.setQueryData<GetPatientResponse>(key, {
          ...previousPatientData,
          medicalDecisionMakers: response.patientMedicalDecisionMakers,
        });
      },
    }
  );
};
