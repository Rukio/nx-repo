import { useQuery } from 'react-query';
import { CareManagerServiceGetVirtualAPPVisitsQueueRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { virtualVisitsKeys } from './virtualVisitsKeys';

export const useGetVirtualAppVisits = (
  input: CareManagerServiceGetVirtualAPPVisitsQueueRequest
) => {
  const { API } = useApi();

  return useQuery(
    virtualVisitsKeys.detail(input.shiftTeamId, input.marketIds, input.userId),
    () => API.careManagerServiceGetVirtualAPPVisitsQueue(input)
  );
};
