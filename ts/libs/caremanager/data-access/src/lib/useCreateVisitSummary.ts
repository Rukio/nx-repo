import { useMutation, useQueryClient } from 'react-query';
import {
  CareManagerServiceCreateVisitSummaryOperationRequest,
  CreateVisitSummaryResponse,
  GetVisitResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useCreateVisitSummary = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation<
    CreateVisitSummaryResponse,
    unknown,
    CareManagerServiceCreateVisitSummaryOperationRequest
  >(
    'createVisitSummary',
    (input) => API.careManagerServiceCreateVisitSummary(input),
    {
      onSuccess: (response) => {
        if (!response.summary) {
          return;
        }

        const key = visitKeys.detail(response.summary.visitId);
        const previousVisitData =
          queryClient.getQueryData<GetVisitResponse>(key);

        queryClient.setQueryData(key, {
          ...previousVisitData,
          ...response,
        });
      },
    }
  );
};
