import type { InsuranceClassification } from '@*company-data-covered*/station/data-access';
import { Market } from '../marketsConfiguration/types';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortBy {
  NAME = 'name',
  UPDATED_AT = 'updatedAt',
}

export interface InsurancesConfigurationState {
  selectedInsuranceClassification?: InsuranceClassification;
  selectedMarket?: Market;
  currentPage: number;
  rowsPerPage: number;
  search: string;
  sortOrder: SortOrder;
  sortBy: SortBy;
}

export type InsurancePlan = {
  id: number;
  name: string;
  packageId: string;
  insuranceClassification: string;
  updatedAt: string;
};

export { InsuranceClassification };
