import { Market, ProviderMarketResponse } from '../../types';

export const MOCK_PROVIDER_MARKETS: Market[] = [
  {
    id: '174',
    name: 'Seattle',
    shortName: 'SEA',
  },
];

export const MOCK_PROVIDER_MARKETS_RESPONSE: ProviderMarketResponse = {
  markets: MOCK_PROVIDER_MARKETS,
};
