import { useMutation, useQueryClient } from 'react-query';
import {
  CareManagerServiceCreateMedicalDecisionMakerRequest,
  CreateMedicalDecisionMakerResponse,
  GetPatientResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { patientKeys } from './patientKeys';

export const useCreateMedicalDecisionMaker = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation<
    CreateMedicalDecisionMakerResponse,
    unknown,
    CareManagerServiceCreateMedicalDecisionMakerRequest
  >(
    'createMedicalDecisionMaker',
    (input) => API.careManagerServiceCreateMedicalDecisionMaker(input),
    {
      onSuccess: (response) => {
        if (
          !response.patientMedicalDecisionMakers ||
          !response.medicalDecisionMaker
        ) {
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
