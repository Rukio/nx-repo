import { useMutation, useQueryClient } from 'react-query';
import useApi from './useApi';
import { serviceRequestKeys } from './serviceRequestKeys';
import { GetServiceRequestResponse } from '@*company-data-covered*/caremanager/data-access-types';

export const useUnassignOwnerFromServiceRequest = (
  serviceRequestId: string
) => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    'unassignOwnerFromServiceRequest',
    () =>
      API.careManagerServiceUnassignOwnerFromServiceRequest({
        serviceRequestId: serviceRequestId,
        body: {},
      }),
    {
      onSuccess: async (response) => {
        if (!response.serviceRequest) {
          return;
        }

        queryClient.setQueryData<GetServiceRequestResponse>(
          serviceRequestKeys.detail(response.serviceRequest.id),
          (details) => ({
            ...details,
            serviceRequest: response.serviceRequest,
          })
        );
        await queryClient.invalidateQueries(serviceRequestKeys.lists());
      },
    }
  );
};
