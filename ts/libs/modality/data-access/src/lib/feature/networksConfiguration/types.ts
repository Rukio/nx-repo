import { Market } from '../marketsConfiguration';

export enum NetworksSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum NetworksSortBy {
  NAME = 'name',
  UPDATED_AT = 'updatedAt',
}

export interface InsuranceNetwork {
  id: number;
  name: string;
  stateAbbrs: string[];
  updatedAt: string;
}

export interface NetworksSearchParams {
  search: string;
  page: number;
  rowsPerPage: number;
  sortOrder: NetworksSortOrder;
  sortBy: NetworksSortBy;
}

export type NetworksConfigurationState = NetworksSearchParams & {
  selectedMarket?: Market;
};

export interface NetworkModalityConfig {
  id: number;
  networkId: number;
  billingCityId: number;
  serviceLineId: number;
  modalityId: number;
}

export interface GetNetworksModalityConfigsQuery {
  networkId?: string | number;
  serviceLineId?: string | number;
}
