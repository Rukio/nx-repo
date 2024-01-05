import { useMutation, useQueryClient } from 'react-query';
import {
  TRACK_UPDATE_VISIT_STATUS,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import { useSnackbar } from '@*company-data-covered*/caremanager/utils';
import {
  CareManagerServiceUpdateVisitStatusOperationRequest,
  GetVisitResponse,
  ResponseError,
  UpdateVisitStatusOption,
  UpdateVisitStatusResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { visitKeys } from './visitKeys';

export const useUpdateVisitStatus = (episodeId?: string) => {
  const { API } = useApi();
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();
  const { showWarning, showError } = useSnackbar();

  return useMutation<
    UpdateVisitStatusResponse,
    unknown,
    CareManagerServiceUpdateVisitStatusOperationRequest
  >(
    'updateVisitStatus',
    (input) => API.careManagerServiceUpdateVisitStatus(input),
    {
      onSuccess: async ({ visit }) => {
        if (!visit) {
          return;
        }
        const key = visitKeys.detail(visit.id);
        const previousVisitData =
          queryClient.getQueryData<GetVisitResponse>(key);

        if (previousVisitData) {
          queryClient.setQueryData<GetVisitResponse>(key, {
            ...previousVisitData,
            visit,
          });
        }
        trackEvent(TRACK_UPDATE_VISIT_STATUS, visit);

        if (episodeId) {
          await queryClient.invalidateQueries(
            visitKeys.episodeVisitList(episodeId)
          );
        }
      },
      onError: (e, vars) => {
        const error = e as ResponseError;
        if (
          vars.body.status === UpdateVisitStatusOption.Committed &&
          error.response.status === 503
        ) {
          showWarning(
            'An available shift team could not be found, try again later.'
          );
        } else {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          showError(error.response);
        }
      },
    }
  );
};
