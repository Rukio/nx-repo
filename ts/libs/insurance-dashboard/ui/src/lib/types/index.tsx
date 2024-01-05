export enum CreditCardRequirement {
  Optional = 'optional',
  Required = 'required',
  DoNotAsk = '',
}

export interface NetworkModalityConfig {
  id?: string;
  networkId: string;
  billingCityId: string;
  modalityId: string;
  serviceLineId: string;
}

export interface Modality {
  id: string;
  displayName: string;
  type: string;
}

export type ServiceLineAppointmentType = {
  id: string;
  name: string;
};

export type ServiceLine = {
  id: string;
  name: string;
  default: boolean;
};

export type ServiceLineOption = {
  optionLabel: string;
  optionLabelSuffix: CreditCardRequirement;
};

export interface BillingCity {
  id: string;
  name: string;
  shortName: string;
}

export interface State {
  id: string;
  name: string;
  abbreviation: string;
  billingCities: BillingCity[];
}
