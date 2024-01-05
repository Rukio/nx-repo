import { useQuery } from 'react-query';
import useApi from './useApi';
import { ServiceRequestStatus } from '@*company-data-covered*/caremanager/data-access-types';

type StatusMap = Record<string, ServiceRequestStatus>;

export const useGetServiceRequestStatus = () => {
  const { API } = useApi();

  return useQuery(['serviceRequestStatus'], async () => {
    const result = await API.careManagerServiceGetServiceRequestStatus();

    const statusMap: StatusMap = {};
    result.serviceRequestStatus.forEach((v) => (statusMap[v.slug] = v));

    return { list: result.serviceRequestStatus, statusMap };
  });
};
