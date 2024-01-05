import useApi from './useApi';
import { useQuery } from 'react-query';
import { addressKeys } from './addressKeys';

export const useGetAddresses = (ids?: string[]) => {
  const { API } = useApi();

  return useQuery(
    addressKeys.list(ids),
    () =>
      API.careManagerServiceGetAddressesByID({
        addressIds: ids ?? [],
      }),
    {
      enabled: !!ids?.length,
    }
  );
};
