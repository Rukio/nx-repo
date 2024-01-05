import { DomainInsuranceNetworkShort } from './networks';

export enum PayersSortDirection {
  ASC = '1',
  DESC = '2',
}

export enum PayersSortFields {
  NAME = '1',
  UPDATED_AT = '2',
}

export interface PayersListSortOptions {
  field: PayersSortFields;
  direction: PayersSortDirection;
}

export type PayersQuery = {
  sortField: PayersSortFields;
  sortDirection: PayersSortDirection;
  payerName?: string;
  stateAbbrs?: string[];
};

export interface DomainInsurancePayer {
  id: number;
  name: string;
  notes?: string;
  active: boolean;
  payerGroupId?: string;
  createdAt: string;
  updatedAt: string;
  insuranceNetworks: DomainInsuranceNetworkShort[];
  stateAbbrs: string[];
}
