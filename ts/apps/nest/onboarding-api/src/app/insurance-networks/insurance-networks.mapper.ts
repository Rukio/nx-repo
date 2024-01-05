import {
  InsuranceNetwork,
  InsuranceNetworkRequest,
  InsurancePayer,
  InsuranceServicePayer,
  ServicesInsuranceNetwork,
  ServicesInsuranceNetworkRequest,
  InsuranceNetworkAddress,
  ServicesInsuranceNetworkAddress,
} from '@*company-data-covered*/consumer-web-types';

enum ServicesSortDirection {
  UNSPECIFIED,
  ASCENDING,
  DESCENDING,
}

enum ServicesSortField {
  UNSPECIFIED,
  NAME,
  UPDATED_AT,
}

const servicesSortDirection = (sort?: string) => {
  switch (sort) {
    case 'asc':
      return ServicesSortDirection.ASCENDING;
    case 'desc':
      return ServicesSortDirection.DESCENDING;
    default:
      return ServicesSortDirection.UNSPECIFIED;
  }
};

const servicesSortField = (sort?: string) => {
  switch (sort) {
    case 'name':
      return ServicesSortField.NAME;
    case 'update':
      return ServicesSortField.UPDATED_AT;
    default:
      return ServicesSortField.UNSPECIFIED;
  }
};

const SearchInsuranceNetworkToServiceInsuranceNetwork = (
  input: InsuranceNetworkRequest
): ServicesInsuranceNetworkRequest => {
  const output: ServicesInsuranceNetworkRequest = {
    payer_ids: input.payerIds,
    state_abbrs: input.stateAbbrs,
    insurance_classifications: input.insuranceClassifications,
    search: input.search,
    sort_field: servicesSortField(input.sortField?.toLowerCase()),
    sort_direction: servicesSortDirection(input.sortDirection?.toLowerCase()),
    billing_city_id: input.billingCityId,
    package_ids: input.packageIds,
    insurance_plan_ids: input.insurancePlanIds,
  };

  return output;
};

const ServicesInsuranceNetworkAddressToInsuranceNetworkAddress = (
  input: ServicesInsuranceNetworkAddress
): InsuranceNetworkAddress => ({
  state: input.state,
  city: input.city,
  zip: input.zipCode,
  streetAddress1: input.addressLineOne,
  streetAddress2: '',
});

const ServicesInsuranceNetworkToInsuranceNetwork = (
  input: ServicesInsuranceNetwork
): InsuranceNetwork => {
  const { address, addresses, ...rest } = input;

  const output: InsuranceNetwork = {
    ...rest,
    addresses: addresses?.map(
      ServicesInsuranceNetworkAddressToInsuranceNetworkAddress
    ),
  };

  if (address && Object.keys(address).length) {
    output.claimsAddress =
      ServicesInsuranceNetworkAddressToInsuranceNetworkAddress(address);
  }

  return output;
};

const InsuranceServicePayersToInsurancePayers = (
  input: InsuranceServicePayer
): InsurancePayer => {
  return {
    id: input.id,
    name: input.name,
    notes: input.notes,
    active: input.active,
    payerGroupId: input.payerGroupId,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt,
    stateAbbrs: input.stateAbbrs,
  };
};

export default {
  ServicesInsuranceNetworkToInsuranceNetwork,
  SearchInsuranceNetworkToServiceInsuranceNetwork,
  InsuranceServicePayersToInsurancePayers,
  ServicesInsuranceNetworkAddressToInsuranceNetworkAddress,
};
