export interface DomainInsuranceAddress {
  addressLineOne?: string;
  addressLineTwo?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface DomainInsuranceNetwork {
  id: number;
  name: string;
  notes: string;
  packageId: string;
  insuranceClassificationId: string;
  insurancePlanId: string;
  insurancePayerId: string;
  address: DomainInsuranceAddress;
  eligibilityCheck: boolean;
  providerEnrollment: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  stateAbbrs: string[];
  emcCode: string;
  addresses: DomainInsuranceAddress[];
}

export interface DomainInsuranceNetworkShort {
  id: number;
  name: string;
}

export enum NetworkCreditCardRules {
  optional = 'OPTIONAL',
  required = 'REQUIRED',
  disabled = 'DISABLED',
}

export interface DomainNetworkCreditCardRule {
  id: number;
  serviceLineId: string;
  creditCardRule: NetworkCreditCardRules;
}

export interface NetworkModalityConfig {
  id: string;
  networkId: string;
  billingCityId: string;
  modalityId: string;
  serviceLineId: string;
}
export type NetworkModalityConfigWithOptionalId = Omit<
  NetworkModalityConfig,
  'id'
> &
  Pick<Partial<NetworkModalityConfig>, 'id'>;

export interface PatchNetworkModalityConfigPayload {
  networkId: string;
  configs: NetworkModalityConfigWithOptionalId[];
}

export enum NetworksSortDirection {
  ASC = 1,
  DESC = 2,
}

export enum NetworksSortField {
  NAME = 1,
  UPDATED_AT = 2,
}

export enum StatesStatusOptions {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
