import { ServicesInsuranceNetwork } from './insurance-network';

export enum SortField {
  SORT_FIELD_UNSPECIFIED = 0,
  SORT_FIELD_NAME = 1,
  SORT_FIELD_UPDATED_AT = 2,
}

export enum SortDirection {
  SORT_DIRECTION_UNSPECIFIED = 0,
  SORT_DIRECTION_ASCENDING = 1,
  SORT_DIRECTION_DESCENDING = 2,
}

type InsuranceServicePayerNetwork = Pick<
  ServicesInsuranceNetwork,
  'id' | 'name' | 'packageId' | 'insuranceClassificationId' | 'insurancePlanId'
>[];

export interface InsuranceServicePayer {
  id: number;
  name: string;
  notes: string;
  active: boolean;
  payerGroupId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string;
  insuranceNetworks: InsuranceServicePayerNetwork;
  stateAbbrs: string[];
}

export interface InsurancePayer {
  id: number;
  name: string;
  notes: string;
  active: boolean;
  payerGroupId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string;
  stateAbbrs: string[];
}
