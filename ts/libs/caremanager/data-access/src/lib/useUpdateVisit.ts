import { useMutation, useQueryClient } from 'react-query';
import {
  TRACK_UPDATE_VISIT_SUMMARY,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  CareManagerServiceUpdateVisitOperationRequest,
  GetVisitResponse,
  UpdateVisitResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useUpdateVisit = () => {
  const queryClient = useQueryClient();
  const { API } = useApi();
  const { trackEvent } = useAnalytics();

  return useMutation<
    UpdateVisitResponse,
    unknown,
    CareManagerServiceUpdateVisitOperationRequest
  >('updateVisit', (input) => API.careManagerServiceUpdateVisit(input), {
    onSuccess: (response) => {
      if (!response.visit) {
        return;
      }

      const key = visitKeys.detail(response.visit.id);
      const previousVisitData = queryClient.getQueryData<GetVisitResponse>(key);

      queryClient.setQueryData(key, {
        ...previousVisitData,
        ...response,
      });
      trackEvent(TRACK_UPDATE_VISIT_SUMMARY, response.visit);
    },
  });
};
