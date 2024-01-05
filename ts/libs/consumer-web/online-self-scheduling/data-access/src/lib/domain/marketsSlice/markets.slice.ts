import { onlineSelfSchedulingApiSlice } from '../apiSlice';
import { DomainMarket } from '../../types';

type MarketId = string | number;

export const MARKETS_API_PATH = 'markets';

export const buildMarketPath = (marketId: MarketId) =>
  `${MARKETS_API_PATH}/${marketId}`;

export const marketsSlice = onlineSelfSchedulingApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMarket: builder.query<DomainMarket, MarketId>({
      query: buildMarketPath,
      transformResponse: ({ data }: { data: DomainMarket }) => data,
    }),
  }),
});

export const domainSelectMarket = marketsSlice.endpoints.getMarket.select;

export const { useGetMarketQuery } = marketsSlice;
