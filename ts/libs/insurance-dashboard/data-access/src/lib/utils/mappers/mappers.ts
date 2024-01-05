import {
  InsurancePayer,
  InsurancePayerForm,
  InsurancePayerGroupForm,
  InsuranceNetwork,
  InsuranceNetworkForm,
  InsuranceAddress,
  ServiceLine,
  BillingCity,
  State,
} from '../../feature';
import {
  DomainBillingCity,
  DomainServiceLine,
  DomainState,
  DomainInsuranceAddress,
  DomainInsuranceNetwork,
  DomainInsurancePayer,
  DomainInsurancePayerGroup,
  InsuranceClassification,
  StatesStatusOptions,
  NetworkModalityConfigWithOptionalId,
} from '../../types';
import {
  InsuranceNetworkRequestDataPayload,
  InsurancePayerRequestDataPayload,
  PatchNetworkStatesDomainPayload,
  PatchNetworkStatesPayload,
} from '../../domain';
import { FilterOption } from '../../types/common';

export const prepareInsurancePayerRequestData = (
  payerData: InsurancePayerForm
): InsurancePayerRequestDataPayload => ({
  name: payerData.name,
  notes: payerData.notes,
  active: payerData.active,
  payerGroupId: payerData.payerGroupId,
});

export const insurancePayerToInsurancePayerFormData = (
  payer: DomainInsurancePayer
): InsurancePayerForm => ({
  name: payer.name,
  active: payer.active,
  notes: payer.notes || '',
  payerGroupId: payer.payerGroupId,
});

export const prepareAddressRequestData = (
  address?: InsuranceAddress
): DomainInsuranceAddress => ({
  addressLineOne: address?.addressLineOne,
  city: address?.city,
  state: address?.stateName || '',
  zipCode: address?.zipCode,
});

export const insuranceAddressToInsuranceAddressFormData = (
  address: DomainInsuranceAddress
): InsuranceAddress => ({
  addressLineOne: address?.addressLineOne,
  city: address?.city,
  stateName: address?.state,
  zipCode: address?.zipCode,
});

export const prepareInsuranceNetworkRequestData = (
  network: InsuranceNetworkForm
): InsuranceNetworkRequestDataPayload => ({
  name: network.name,
  notes: network.notes,
  active: network.active,
  insuranceClassificationId: network.insuranceClassificationId,
  packageId: network.packageId,
  address: prepareAddressRequestData(network.address),
  eligibilityCheck: network.eligibilityCheck,
  providerEnrollment: network.providerEnrollment,
  insurancePayerId: network.insurancePayerId,
  insurancePlanId: network.insurancePlanId,
  emcCode: network.emcCode,
  addresses: network.addresses.map(prepareAddressRequestData),
});

export const insuranceNetworkToInsuranceNetworkFormData = (
  network: DomainInsuranceNetwork
): InsuranceNetworkForm => ({
  name: network.name,
  packageId: network.packageId,
  notes: network.notes,
  active: network.active,
  eligibilityCheck: network.eligibilityCheck,
  providerEnrollment: network.providerEnrollment,
  insuranceClassificationId: network.insuranceClassificationId,
  insurancePayerId: network.insurancePayerId,
  insurancePlanId: network.insurancePlanId,
  address: insuranceAddressToInsuranceAddressFormData(network.address),
  emcCode: network.emcCode,
  addresses: network.addresses.map(insuranceAddressToInsuranceAddressFormData),
});

export const prepareNetworkStateRequestData = ({
  networkId,
  stateAbbrs,
}: PatchNetworkStatesPayload): PatchNetworkStatesDomainPayload => ({
  network_id: networkId,
  state_abbrs: stateAbbrs,
});

export const transformDomainPayerGroup = (
  payerGroup: DomainInsurancePayerGroup
): InsurancePayerGroupForm => ({
  name: payerGroup.name,
  payerGroupId: payerGroup.payerGroupId,
});

export const transformPayerGroupsList = (
  payerGroups?: DomainInsurancePayerGroup[]
): InsurancePayerGroupForm[] => {
  if (!payerGroups) {
    return [];
  }

  return payerGroups.map(transformDomainPayerGroup);
};

export const getPaginatedInsurancePayers = (
  payers: InsurancePayer[],
  rowsPerPage: number,
  page: number
) => payers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

export const insurancePayersToInsurancePayersList = (
  payers?: DomainInsurancePayer[],
  payerGroups?: InsurancePayerGroupForm[]
): InsurancePayer[] =>
  payers?.map((payer) => ({
    id: payer.id,
    name: payer.name,
    active: payer.active,
    notes: payer.notes,
    payerGroup: payerGroups?.find(
      (payerGroup) => payerGroup.payerGroupId === payer.payerGroupId
    ),
    updatedAt: payer.updatedAt,
    createdAt: payer.createdAt,
    insuranceNetworks: payer.insuranceNetworks,
    stateAbbrs: payer.stateAbbrs,
  })) || [];

export const getPaginatedInsuranceNetworks = (
  rowsPerPage: number,
  page: number,
  networks?: InsuranceNetwork[]
) =>
  networks
    ? networks?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : [];

export const toPaginatedNetworks = (
  networks: DomainInsuranceNetwork[],
  insuranceClassifications: InsuranceClassification[],
  page: number,
  rowsPerPage: number
) => {
  const transformedNetworks = networks.map((network) => ({
    id: network.id,
    name: network.name,
    classification:
      insuranceClassifications.find(
        (classificationItem) =>
          classificationItem.id.toString() === network.insuranceClassificationId
      )?.name || '',
    packageId: network.packageId,
    updatedAt: network.updatedAt,
    stateAbbrs: network.stateAbbrs,
  }));

  return getPaginatedInsuranceNetworks(rowsPerPage, page, transformedNetworks);
};

export const buildBillingCitiesModalityConfigsHierarchy = (
  configs?: NetworkModalityConfigWithOptionalId[]
): Record<string, Record<string, string[]>> => {
  if (!configs) {
    return {};
  }

  return configs.reduce<Record<string, Record<string, string[]>>>(
    (prev, modalityConfig) => {
      const billingCityConfig = prev[modalityConfig.billingCityId] || {};
      const serviceLineConfig =
        billingCityConfig[modalityConfig.serviceLineId] || [];

      return {
        ...prev,
        [modalityConfig.billingCityId]: {
          ...billingCityConfig,
          [modalityConfig.serviceLineId]: [
            ...serviceLineConfig,
            modalityConfig.modalityId,
          ],
        },
      };
    },
    {}
  );
};
export const transformDomainServiceLine = (
  serviceLine: DomainServiceLine
): ServiceLine => ({
  id: serviceLine.id,
  name: serviceLine.name,
  default: serviceLine.default,
});

export const transformDomainServiceLinesList = (
  serviceLines?: DomainServiceLine[]
): ServiceLine[] => {
  if (!serviceLines) {
    return [];
  }

  return serviceLines.map(transformDomainServiceLine);
};

export const transformDomainBillingCity = (
  billingCity: DomainBillingCity
): BillingCity => ({
  id: billingCity.id,
  name: billingCity.name,
  shortName: billingCity.shortName,
});
export const transformDomainBillingCitiesList = (
  billingCities?: DomainBillingCity[]
): BillingCity[] => {
  if (!billingCities) {
    return [];
  }

  return billingCities.map(transformDomainBillingCity);
};

export const transformDomainState = (state: DomainState): State => ({
  id: state.id,
  name: state.name,
  abbreviation: state.abbreviation,
  billingCities: transformDomainBillingCitiesList(state.billingCities),
});

export const transformDomainStatesList = (states?: DomainState[]): State[] => {
  if (!states) {
    return [];
  }

  return states.map(transformDomainState);
};

export const getActiveStatesIds = (
  states?: State[],
  selectedNetworkModalityConfigs?: NetworkModalityConfigWithOptionalId[]
): string[] => {
  if (!states?.length || !selectedNetworkModalityConfigs?.length) {
    return [];
  }
  const activeBillingCitiesIds = Object.keys(
    buildBillingCitiesModalityConfigsHierarchy(selectedNetworkModalityConfigs)
  );

  return states.reduce((acc: string[], state) => {
    const isStateActive = state.billingCities.some((stateBillingCity) =>
      activeBillingCitiesIds.includes(stateBillingCity.id)
    );
    if (isStateActive) {
      acc.push(state.id);
    }

    return acc;
  }, []);
};

export const transformAndFilterDomainStatesList = (
  states?: DomainState[],
  stateId?: string,
  serviceLineId?: string,
  statesStatusOption?: StatesStatusOptions,
  selectedNetworkModalityConfigs?: NetworkModalityConfigWithOptionalId[]
): State[] => {
  let transformedStates = transformDomainStatesList(states);

  if (stateId) {
    transformedStates = transformedStates.filter(
      (state) => state.id === stateId
    );
  }

  if (serviceLineId) {
    transformedStates = transformedStates.filter((state) =>
      selectedNetworkModalityConfigs?.some(
        (selectedNetworkModalityConfig) =>
          state.billingCities.find(
            (billingCity) =>
              billingCity.id === selectedNetworkModalityConfig.billingCityId
          ) && selectedNetworkModalityConfig.serviceLineId === serviceLineId
      )
    );
  }
  if (statesStatusOption) {
    const activeStatesIds = getActiveStatesIds(
      states,
      selectedNetworkModalityConfigs
    );
    switch (statesStatusOption) {
      case StatesStatusOptions.ACTIVE:
        transformedStates = transformedStates.filter((state) =>
          activeStatesIds.includes(state.id)
        );
        break;
      case StatesStatusOptions.INACTIVE:
        transformedStates = transformedStates.filter(
          (state) => !activeStatesIds.includes(state.id)
        );
        break;
    }
  }

  return transformedStates;
};

export const getVisibleFilterOptions = (
  filterOptions: FilterOption[],
  filtersSearchValues: string[]
): FilterOption[] =>
  filterOptions.map((filterOption, index) => {
    const filterSearchText = filtersSearchValues[index];

    return {
      ...filterOption,
      searchText: filterSearchText,
      filteredOptions: filterOption.options.filter((option) =>
        option.name.toLowerCase().includes(filterSearchText.toLowerCase())
      ),
    };
  });
