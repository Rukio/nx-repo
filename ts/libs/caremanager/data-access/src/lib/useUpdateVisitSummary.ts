import { useMutation, useQueryClient } from 'react-query';
import {
  TRACK_UPDATE_VISIT_SUMMARY,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  CareManagerServiceUpdateVisitSummaryOperationRequest,
  GetVisitResponse,
  UpdateVisitSummaryResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useUpdateVisitSummary = () => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  return useMutation<
    UpdateVisitSummaryResponse,
    unknown,
    CareManagerServiceUpdateVisitSummaryOperationRequest
  >(
    'updateVisitSummary',
    (input) => API.careManagerServiceUpdateVisitSummary(input),
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
        trackEvent(TRACK_UPDATE_VISIT_SUMMARY, response.summary);
      },
    }
  );
};
