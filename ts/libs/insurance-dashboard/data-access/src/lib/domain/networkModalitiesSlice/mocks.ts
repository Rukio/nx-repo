import {
  NetworkModalityConfig,
  PatchNetworkModalityConfigPayload,
} from '../../types';

export const mockedNetworkModalityConfigs: NetworkModalityConfig[] = Array(15)
  .fill(0)
  .map((_, index) => ({
    id: `${index}`,
    networkId: `${index}`,
    billingCityId: `${index + 1}`,
    serviceLineId: `${index + 1}`,
    modalityId: `${index % 2 ? 1 : 2}`,
  }));

export const mockedNetworkModalityConfig = mockedNetworkModalityConfigs[0];

export const mockedNetworkModalityConfigPatchPayload: PatchNetworkModalityConfigPayload =
  {
    networkId: mockedNetworkModalityConfig.networkId,
    configs: mockedNetworkModalityConfigs,
  };
