import { QueryClient, useMutation, useQueryClient } from 'react-query';
import {
  CareManagerServiceUpdateServiceRequestOperationRequest,
  GetServiceRequestResponse,
  UpdateServiceRequestResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { serviceRequestKeys } from './serviceRequestKeys';

type Options = {
  onSuccess: (
    response: UpdateServiceRequestResponse,
    queryClient: QueryClient
  ) => void;
};

export const useUpdateServiceRequest = (options?: Options) => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation<
    UpdateServiceRequestResponse,
    unknown,
    CareManagerServiceUpdateServiceRequestOperationRequest
  >(
    'updateServiceRequest',
    (input) => API.careManagerServiceUpdateServiceRequest(input),
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
