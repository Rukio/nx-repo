import { useQuery } from 'react-query';
import { ProviderType } from '@*company-data-covered*/caremanager/data-access-types';
import useApi from './useApi';
import { useMemo } from 'react';

export const useGetProviderTypes = (providerTypeId?: ProviderType['id']) => {
  const { API } = useApi();
  const result = useQuery(['providerType', 'list'], () =>
    API.careManagerServiceGetProviderTypes()
  );

  const selectedProviderType = useMemo(
    () =>
      result.data?.providerTypes?.find(
        (providerType) => providerType.id === providerTypeId
      ),
    [providerTypeId, result.data?.providerTypes]
  );

  return [result, selectedProviderType] as const;
};
