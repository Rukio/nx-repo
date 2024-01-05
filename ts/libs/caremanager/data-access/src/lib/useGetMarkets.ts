import { Market } from '@*company-data-covered*/caremanager/data-access-types';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { useGetConfig } from './useGetConfig';

type GetMarket = (id?: Market['id']) => Market | undefined;

export const useGetMarkets = () => {
  const { data, status, isLoading } = useGetConfig();

  const { data: marketMap } = useQuery(
    ['marketMap'],
    () =>
      data?.markets.reduce<{
        [key: string]: Market;
      }>((map, market) => {
        map[market.id] = market;

        return map;
      }, {}),
    {
      enabled: !!data?.markets,
    }
  );

  const getMarket: GetMarket = useCallback(
    (marketId) => (marketId ? marketMap?.[marketId] : undefined),
    [marketMap]
  );

  return { result: { markets: data?.markets, status, isLoading }, getMarket };
};
