export type DomainBillingCity = {
  id: string;
  name: string;
  enabled: boolean;
  marketId: string;
  shortName: string;
  state: string;
};

export type DomainState = {
  id: string;
  name: string;
  abbreviation: string;
  billingCities: DomainBillingCity[];
};
