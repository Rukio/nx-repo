import { UseQueryOptions, useQuery } from 'react-query';
import useApi from './useApi';
import {
  CareManagerServiceGetServiceRequestsRequest,
  GetServiceRequestsResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import { serviceRequestKeys } from './serviceRequestKeys';

type Options = UseQueryOptions<
  GetServiceRequestsResponse,
  unknown,
  GetServiceRequestsResponse,
  ReturnType<typeof serviceRequestKeys.list>
>;

export const useGetServiceRequests = (
  input: CareManagerServiceGetServiceRequestsRequest = {},
  options?: Options
) => {
  const { API } = useApi();

  return useQuery(
    serviceRequestKeys.list(input),
    () => API.careManagerServiceGetServiceRequests(input),
    options
  );
};
