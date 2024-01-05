import { Market, ProviderMarketResponse } from '../../types';
import { clinicalKpiApiSlice } from '../apiSlice';

export const LEADS_PROVIDERS_API_PATH = `providers`;

export const providerMarketsSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProviderMarkets: builder.query<Market[], string>({
      query: (providerId) => ({
        url: `${LEADS_PROVIDERS_API_PATH}/${providerId}/markets`,
      }),
      transformResponse: (response: ProviderMarketResponse) => response.markets,
    }),
  }),
});

export const { useGetProviderMarketsQuery } = providerMarketsSlice;

export const selectDomainProviderMarkets =
  providerMarketsSlice.endpoints.getProviderMarkets.select;
