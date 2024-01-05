import { useQuery } from 'react-query';
import { CareManagerServiceGetVisitAvailabilityRequest } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';

export const useGetVisitAvailability = (
  input: CareManagerServiceGetVisitAvailabilityRequest
) => {
  const { API } = useApi();

  return useQuery(
    [
      'visitAvailability',
      `${input.body.careRequestId}-${input.body.requestedDates?.join(',')}`,
    ],
    () => API.careManagerServiceGetVisitAvailability(input),
    {
      enabled: Boolean(
        input.body.careRequestId && input.body.requestedDates?.length
      ),
      cacheTime: 0,
    }
  );
};
