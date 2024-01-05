import {
  Modality,
  ModalityConfig,
  MarketModalityConfig,
  NetworkModalityConfig,
} from '../../types';

export const mockedModalitiesList: Modality[] = [
  { id: 1, display_name: 'In-Person', type: 'in_person' },
  { id: 2, display_name: 'Virtual', type: 'virtual' },
  { id: 3, display_name: 'Telepresentation', type: 'telepresentation' },
];

export const mockedModality = mockedModalitiesList[0];

export const mockedModalityConfigsList: { configs: ModalityConfig[] } = {
  configs: Array(15)
    .fill(0)
    .map((_, index) => ({
      id: index,
      service_line_id: index,
      market_id: index,
      insurance_plan_id: index,
      modality_id: index % 2 ? 1 : 2,
    })),
};

export const mockedModalityConfig = mockedModalityConfigsList.configs[0];

export const mockedMarketsModalityConfigs: { configs: MarketModalityConfig[] } =
  {
    configs: Array(15)
      .fill(0)
      .map((_, index) => ({
        id: index,
        service_line_id: index,
        market_id: index,
        modality_id: index % 2 ? 1 : 2,
      })),
  };

export const mockedMarketModalityConfig =
  mockedMarketsModalityConfigs.configs[0];

export const mockedNetworksModalityConfigs: {
  configs: NetworkModalityConfig[];
} = {
  configs: Array(15)
    .fill(0)
    .map((_, index) => ({
      id: index,
      service_line_id: index,
      network_id: index,
      billing_city_id: index,
      modality_id: index % 2 ? 1 : 2,
    })),
};

export const mockedNetworkModalityConfig: NetworkModalityConfig =
  mockedNetworksModalityConfigs.configs[0];
