import { Address } from './address';

export interface ServicesInsuranceNetworkAddress {
  addressLineOne?: string;
  city?: string;
  zipCode?: string;
  state?: string;
}

export interface ServicesInsuranceNetwork {
  id: string | number;
  name: string;
  notes?: string;
  packageId: string | number;
  insuranceClassificationId: string | number;
  insurancePlanId: string | number;
  insurancePayerId: string | number;
  address: ServicesInsuranceNetworkAddress;
  eligibilityCheck: boolean;
  providerEnrollment: boolean;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  stateAbbrs?: string[];
  insurancePayerName: string;
  addresses: ServicesInsuranceNetworkAddress[];
}

export type InsuranceNetworkAddress = Pick<
  Address,
  'state' | 'city' | 'zip' | 'streetAddress1' | 'streetAddress2'
>;

export interface InsuranceNetwork
  extends Omit<ServicesInsuranceNetwork, 'address' | 'addresses'> {
  claimsAddress?: InsuranceNetworkAddress;
  addresses: InsuranceNetworkAddress[];
}

export interface InsuranceNetworkRequest {
  payerIds?: string[];
  stateAbbrs?: string[];
  insuranceClassifications?: string[];
  search?: string;
  sortField?: string;
  sortDirection?: string;
  billingCityId?: number;
  packageIds?: string[];
  insurancePlanIds?: number[];
}

export interface ServicesInsuranceNetworkRequest {
  payer_ids?: string[];
  state_abbrs?: string[];
  insurance_classifications?: string[];
  search?: string;
  sort_field?: number;
  sort_direction?: number;
  billing_city_id?: number;
  package_ids?: string[];
  insurance_plan_ids?: number[];
}

export interface InsuranceServiceNetworkCreditCardRule {
  id: string;
  serviceLineId: string;
  creditCardRule: string;
}
