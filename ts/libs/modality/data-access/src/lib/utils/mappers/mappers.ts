import {
  Market as DomainMarket,
  ServiceLine as DomainServiceLine,
  InsurancePlan as DomainInsurancePlan,
  Modality as DomainModality,
  MarketModalityConfig as DomainMarketModalityConfig,
  ModalityConfig as DomainModalityConfig,
  ModalityConfigWithOptionalId,
  MarketModalityConfigWithOptionalId,
  SearchInsuranceNetworksQuery as DomainSearchInsuranceNetworksQuery,
  InsuranceNetworkSortDirection as DomainInsuranceNetworkSortDirection,
  InsuranceNetworkSortField as DomainInsuranceNetworkSortField,
  InsuranceNetwork as DomainInsuranceNetwork,
  NetworkModalityConfig as DomainNetworkModalityConfig,
  GetNetworksModalityConfigsQuery as DomainGetNetworksModalityConfigsQuery,
} from '@*company-data-covered*/station/data-access';
import { Market, ServiceLine } from '../../feature/marketsConfiguration/types';
import {
  InsurancePlan,
  SortBy,
  SortOrder,
} from '../../feature/insurancesConfiguration/types';
import {
  Modality,
  ModalityConfig,
  MarketModalityConfig,
} from '../../feature/modalitiesConfiguration';
import {
  NetworksSearchParams,
  InsuranceNetwork,
  NetworksSortBy,
  NetworksSortOrder,
  NetworkModalityConfig,
  GetNetworksModalityConfigsQuery,
} from '../../feature/networksConfiguration';

export const transformDomainMarket = (market: DomainMarket): Market => ({
  id: market.id,
  name: market.name,
  shortName: market.short_name,
  state: market.state,
});

export const transformMarketsList = (markets?: DomainMarket[]): Market[] => {
  if (!markets) {
    return [];
  }

  return markets.map(transformDomainMarket);
};

export const sortMarketsList = (markets: Market[]): Market[] => {
  return [...markets].sort((marketA, marketB) =>
    marketA.name.localeCompare(marketB.name)
  );
};

export const transformDomainServiceLine = (
  serviceLine: DomainServiceLine
): ServiceLine => ({
  id: serviceLine.id,
  name: serviceLine.name,
  default: serviceLine.default,
});

export const transformServiceLinesList = (
  serviceLines?: DomainServiceLine[]
): ServiceLine[] => {
  if (!serviceLines) {
    return [];
  }

  return serviceLines.map(transformDomainServiceLine);
};

export const transformDomainInsurancePlan = (
  insurancePlan: DomainInsurancePlan
): InsurancePlan => ({
  id: insurancePlan.id,
  name: insurancePlan.name,
  packageId: insurancePlan.package_id,
  insuranceClassification: insurancePlan.insurance_classification?.name,
  updatedAt: insurancePlan.updated_at,
});

export const transformInsurancePlansList = (
  insurancePlans?: DomainInsurancePlan[]
): InsurancePlan[] => {
  if (!insurancePlans) {
    return [];
  }

  return insurancePlans.map(transformDomainInsurancePlan);
};

export const sortInsurancePlans = (
  insurancePlans: InsurancePlan[],
  sortBy: SortBy,
  sortOrder: SortOrder
) => {
  const getPlanFieldValue = (plan: InsurancePlan) => {
    if (sortBy === 'updatedAt') {
      return new Date(plan.updatedAt).getTime();
    }

    return plan[sortBy].trim();
  };

  const sortedPlans = [...insurancePlans].sort((planA, planB) => {
    const planAValue = getPlanFieldValue(planA);
    const planBValue = getPlanFieldValue(planB);

    if (planAValue < planBValue) {
      return -1;
    }
    if (planAValue > planBValue) {
      return 1;
    }

    return 0;
  });

  if (sortOrder === 'desc') {
    return [...sortedPlans].reverse();
  }

  return sortedPlans;
};

export const transformModalityDisplayName = (modality: Modality): Modality => {
  if (modality.type === 'telepresentation') {
    return { ...modality, displayName: 'Hybrid' };
  }

  return modality;
};

export const transformDomainModality = (
  modality: DomainModality
): Modality => ({
  id: modality.id,
  type: modality.type,
  displayName: modality.display_name,
});

export const transformModalitiesList = (
  modalities?: DomainModality[]
): Modality[] => {
  if (!modalities) {
    return [];
  }

  return modalities
    .map(transformDomainModality)
    .map(transformModalityDisplayName);
};

export const transformDomainMarketModalityConfig = (
  config: DomainMarketModalityConfig
): MarketModalityConfig => ({
  id: config.id,
  marketId: config.market_id,
  serviceLineId: config.service_line_id,
  modalityId: config.modality_id,
});

export const transformMarketsModalityConfigs = (
  configs?: DomainMarketModalityConfig[]
): MarketModalityConfig[] => {
  if (!configs) {
    return [];
  }

  return configs.map(transformDomainMarketModalityConfig);
};

export const transformMarketsModalityConfigToDomain = (
  config: MarketModalityConfig
): MarketModalityConfigWithOptionalId => ({
  id: config.id,
  market_id: config.marketId,
  service_line_id: config.serviceLineId,
  modality_id: config.modalityId,
});

export const transformMarketsModalityConfigsToDomain = (
  configs?: MarketModalityConfig[]
): MarketModalityConfigWithOptionalId[] => {
  if (!configs) {
    return [];
  }

  return configs.map(transformMarketsModalityConfigToDomain);
};

export const buildMarketsModalityConfigsHierarchy = (
  configs?: MarketModalityConfig[]
): Record<number, number[]> => {
  if (!configs) {
    return {};
  }

  return configs.reduce<Record<number, number[]>>((prev, marketConfig) => {
    const currentMarketsModalities = prev[marketConfig.marketId] || [];

    return {
      ...prev,
      [marketConfig.marketId]: [
        ...currentMarketsModalities,
        marketConfig.modalityId,
      ],
    };
  }, {});
};

export const transformDomainModalityConfig = (
  config: DomainModalityConfig
): ModalityConfig => ({
  id: config.id,
  marketId: config.market_id,
  serviceLineId: config.service_line_id,
  insurancePlanId: config.insurance_plan_id,
  modalityId: config.modality_id,
});

export const transformModalityConfigs = (
  configs?: DomainModalityConfig[]
): ModalityConfig[] => {
  if (!configs) {
    return [];
  }

  return configs.map(transformDomainModalityConfig);
};

export const transformModalityConfigToDomain = (
  config: ModalityConfig
): ModalityConfigWithOptionalId => ({
  id: config.id,
  market_id: config.marketId,
  service_line_id: config.serviceLineId,
  insurance_plan_id: config.insurancePlanId,
  modality_id: config.modalityId,
});

export const transformModalityConfigsToDomain = (
  configs?: ModalityConfig[]
): ModalityConfigWithOptionalId[] => {
  if (!configs) {
    return [];
  }

  return configs.map(transformModalityConfigToDomain);
};

export const buildModalityConfigsHierarchy = (
  configs?: ModalityConfig[]
): Record<number, Record<number, number[]>> => {
  if (!configs) {
    return {};
  }

  return configs.reduce<Record<number, Record<number, number[]>>>(
    (prev, modalityConfig) => {
      const marketConfig = prev[modalityConfig.marketId] || {};
      const insuranceConfig =
        marketConfig[modalityConfig.insurancePlanId] || [];

      return {
        ...prev,
        [modalityConfig.marketId]: {
          ...marketConfig,
          [modalityConfig.insurancePlanId]: [
            ...insuranceConfig,
            modalityConfig.modalityId,
          ],
        },
      };
    },
    {}
  );
};

export const getNetworksDomainSortField = (
  field?: NetworksSortBy
): DomainInsuranceNetworkSortField => {
  switch (field) {
    case 'name': {
      return DomainInsuranceNetworkSortField.NAME;
    }
    case 'updatedAt': {
      return DomainInsuranceNetworkSortField.UPDATED_AT;
    }
    default: {
      return DomainInsuranceNetworkSortField.UNSPECIFIED;
    }
  }
};

export const getNetworksDomainSortDirection = (
  sort?: NetworksSortOrder
): DomainInsuranceNetworkSortDirection => {
  switch (sort) {
    case 'asc': {
      return DomainInsuranceNetworkSortDirection.ASC;
    }
    case 'desc': {
      return DomainInsuranceNetworkSortDirection.DESC;
    }
    default: {
      return DomainInsuranceNetworkSortDirection.UNSPECIFIED;
    }
  }
};

export const transformNetworksSearchParamsToDomain = (
  params: Partial<NetworksSearchParams>
): DomainSearchInsuranceNetworksQuery => ({
  search: params.search,
  sort_direction: getNetworksDomainSortDirection(params.sortOrder),
  sort_field: getNetworksDomainSortField(params.sortBy),
});

export const transformDomainInsuranceNetworkTo = (
  network: DomainInsuranceNetwork
): InsuranceNetwork => ({
  id: network.id,
  name: network.name,
  stateAbbrs: network.state_abbrs,
  updatedAt: network.updated_at,
});

export const transformDomainInsuranceNetworksTo = (
  networks?: DomainInsuranceNetwork[]
): InsuranceNetwork[] => {
  if (!networks) {
    return [];
  }

  return networks.map(transformDomainInsuranceNetworkTo);
};

export const filterInsuranceNetworksByMarket = (
  networks: InsuranceNetwork[],
  market?: Market
): InsuranceNetwork[] => {
  if (!market) {
    return networks;
  }

  return networks.filter((network) =>
    network.stateAbbrs.includes(market.state)
  );
};

export const buildPaginatedInsuranceNetworks = ({
  networks,
  page,
  rowsPerPage,
}: {
  networks?: InsuranceNetwork[];
  page: number;
  rowsPerPage: number;
}): { networks: InsuranceNetwork[]; total: number } => {
  if (!networks?.length) {
    return {
      networks: [],
      total: 0,
    };
  }

  const startPosition = page * rowsPerPage;
  const displayedNetworks = networks.slice(
    startPosition,
    startPosition + rowsPerPage
  );

  return {
    networks: displayedNetworks,
    total: networks.length,
  };
};

export const transformDomainGetNetworksModalityConfigsQuery = (
  params: DomainGetNetworksModalityConfigsQuery
): GetNetworksModalityConfigsQuery => ({
  networkId: params.network_id,
  serviceLineId: params.service_line_id,
});

export const transformNetworksModalityConfigsQueryTo = (
  params: GetNetworksModalityConfigsQuery
): DomainGetNetworksModalityConfigsQuery => ({
  network_id: params.networkId,
  service_line_id: params.serviceLineId,
});

export const transformDomainNetworkModalityConfig = (
  domainNetworkModalityConfig: DomainNetworkModalityConfig
): NetworkModalityConfig => ({
  id: domainNetworkModalityConfig.id,
  networkId: domainNetworkModalityConfig.network_id,
  billingCityId: domainNetworkModalityConfig.billing_city_id,
  serviceLineId: domainNetworkModalityConfig.service_line_id,
  modalityId: domainNetworkModalityConfig.modality_id,
});

export const transformDomainNetworkModalityConfigs = (
  configs?: DomainNetworkModalityConfig[]
) => {
  if (!configs) {
    return [];
  }

  return configs.map(transformDomainNetworkModalityConfig);
};

export const buildNetworksModalityConfigsHierarchy = (
  configs?: NetworkModalityConfig[]
): Record<number, number[]> => {
  if (!configs) {
    return {};
  }

  return configs.reduce<Record<number, number[]>>((prev, networkConfig) => {
    const currentNetworkModalities = prev[networkConfig.networkId] || [];

    return {
      ...prev,
      [networkConfig.networkId]: [
        ...currentNetworkModalities,
        networkConfig.modalityId,
      ],
    };
  }, {});
};
