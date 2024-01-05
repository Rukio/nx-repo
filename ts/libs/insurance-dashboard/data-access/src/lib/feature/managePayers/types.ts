import type { SerializedError } from '@reduxjs/toolkit';
import {
  DomainInsuranceNetworkShort,
  PayersListSortOptions,
} from '../../types';

export interface InsurancePayerGroupForm {
  name: string;
  payerGroupId: string;
}

export interface InsurancePayer {
  id: number;
  name: string;
  notes?: string;
  active: boolean;
  payerGroup?: InsurancePayerGroupForm;
  createdAt: string;
  updatedAt: string;
  insuranceNetworks: DomainInsuranceNetworkShort[];
  stateAbbrs: string[];
}

export interface InsurancePayerForm {
  name: string;
  notes: string;
  active: boolean;
  payerGroupId?: string;
}

export interface PayersFilterOptions {
  payerName?: string;
  stateAbbrs?: string[];
  activeStateAbbrs?: string[];
}

export interface ManagePayersState {
  payersFilterOptions: PayersFilterOptions;
  payersListSortOptions: PayersListSortOptions;
  payerForm: InsurancePayerForm;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: SerializedError;
  rowsPerPage: number;
  page: number;
}

export interface InsurancePayerGroupForm {
  name: string;
  payerGroupId: string;
}

export type State = {
  id: string;
  name: string;
  abbreviation: string;
  billingCities: BillingCity[];
};

export type BillingCity = {
  id: string;
  name: string;
  shortName: string;
};
