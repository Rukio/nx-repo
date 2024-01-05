import type { SerializedError } from '@reduxjs/toolkit';
import {
  DomainNetworkCreditCardRule,
  NetworkCreditCardRules,
  NetworksSortField,
  NetworksSortDirection,
  StatesStatusOptions,
  DomainNetworkAppointmentType,
} from '../../types';

export type InsuranceAddress = {
  city?: string;
  stateName?: string;
  zipCode?: string;
  addressLineOne?: string;
};

export type InsuranceNetworkForm = {
  name: string;
  insuranceClassificationId: string;
  packageId: string;
  address: InsuranceAddress;
  notes: string;
  active: boolean;
  eligibilityCheck: boolean;
  providerEnrollment: boolean;
  insurancePayerId: string;
  insurancePlanId: string;
  emcCode: string;
  addresses: InsuranceAddress[];
};

export interface AppliedNetworksFilterOptions {
  stateAbbrs?: string[];
  insuranceClassifications?: string[];
  sortField: NetworksSortField;
  sortDirection: NetworksSortDirection;
}

export interface SelectedNetworksFilterOptions {
  selectedStateAbbrs: string[];
  selectedInsuranceClassifications: string[];
}

export type ServiceLine = { id: string; name: string; default: boolean };

export type InsuranceNetworkServiceLineCreditCardRule = Omit<
  DomainNetworkCreditCardRule,
  'id'
> &
  Partial<Pick<DomainNetworkCreditCardRule, 'id'>>;

export type InsuranceNetworkServiceLineAppointmentType = Omit<
  DomainNetworkAppointmentType,
  'id'
> &
  Partial<Pick<DomainNetworkAppointmentType, 'id'>>;

export interface ManageNetworksState {
  appliedFilterOptions: AppliedNetworksFilterOptions;
  selectedFilterOptions: SelectedNetworksFilterOptions;
  network: InsuranceNetworkForm;
  serviceLineCreditCardRules: InsuranceNetworkServiceLineCreditCardRule[];
  networkBillingCitiesFiltersOptions: NetworkBillingCitiesFilterOptions;
  serviceLineAppointmentTypes: InsuranceNetworkServiceLineAppointmentType[];
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: SerializedError;
  rowsPerPage: number;
  page: number;
}

export type NetworkServiceLine = {
  serviceLineId: string;
  serviceLineName: string;
  disabled?: boolean;
  creditCardRule?: NetworkCreditCardRules;
};

export interface InsuranceNetwork {
  id: number;
  name: string;
  stateAbbrs: string[];
  classification: string;
  packageId: string;
  updatedAt: string;
}

export type NetworkBillingCitiesFilterOptions = {
  stateId?: string;
  serviceLineId?: string;
  statesStatusOption?: StatesStatusOptions;
};

export type NetworkServiceLineWithAppointmentTypes = {
  serviceLineId: string;
  serviceLineName: string;
  disabled?: boolean;
  newPatientAppointmentType?: string;
  existingPatientAppointmentType?: string;
};
