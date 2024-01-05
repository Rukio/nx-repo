import { useQuery } from 'react-query';
import useApi from './useApi';
import { serviceRequestKeys } from './serviceRequestKeys';

export const useGetServiceRequest = (serviceRequestId: string) => {
  const { API } = useApi();

  return useQuery(serviceRequestKeys.detail(serviceRequestId), () =>
    API.careManagerServiceGetServiceRequest({ serviceRequestId })
  );
};
