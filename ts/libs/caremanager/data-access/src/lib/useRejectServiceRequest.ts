import { QueryClient, useMutation, useQueryClient } from 'react-query';
import {
  CareManagerServiceRejectServiceRequestOperationRequest,
  GetServiceRequestResponse,
  RejectServiceRequestResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { serviceRequestKeys } from './serviceRequestKeys';

type Options = {
  onSuccess: (
    response: RejectServiceRequestResponse,
    queryClient: QueryClient
  ) => void;
};

export const useRejectServiceRequest = (options?: Options) => {
  const { API } = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    'rejectServiceRequest',
    (input: CareManagerServiceRejectServiceRequestOperationRequest) =>
      API.careManagerServiceRejectServiceRequest(input),
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
