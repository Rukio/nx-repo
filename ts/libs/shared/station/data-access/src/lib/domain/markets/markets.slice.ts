import { SkipToken } from '@reduxjs/toolkit/query';
import { stationApiSlice } from '../api.slice';
import { Market } from '../../types';

export const MARKETS_BASE_PATH = '/api/markets';

export type GetMarketQuery = string | number;

export type SelectMarketQuery = GetMarketQuery | SkipToken;

export const marketsSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMarkets: builder.query<Market[], void>({
      query: () => MARKETS_BASE_PATH,
    }),
    getMarket: builder.query<Market, GetMarketQuery>({
      query: (marketId) => `${MARKETS_BASE_PATH}/${marketId}`,
    }),
  }),
});

export const selectMarkets = marketsSlice.endpoints.getMarkets.select();

export const selectMarket = (marketId: SelectMarketQuery) =>
  marketsSlice.endpoints.getMarket.select(marketId);

export const {
  useGetMarketQuery,
  useGetMarketsQuery,
  useLazyGetMarketQuery,
  useLazyGetMarketsQuery,
} = marketsSlice;
