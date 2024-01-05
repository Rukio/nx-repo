import {
  prepareInsurancePayerRequestData,
  insurancePayerToInsurancePayerFormData,
  insuranceAddressToInsuranceAddressFormData,
  prepareAddressRequestData,
  prepareInsuranceNetworkRequestData,
  transformPayerGroupsList,
  insuranceNetworkToInsuranceNetworkFormData,
  insurancePayersToInsurancePayersList,
  getPaginatedInsurancePayers,
  getPaginatedInsuranceNetworks,
  toPaginatedNetworks,
  buildBillingCitiesModalityConfigsHierarchy,
  prepareNetworkStateRequestData,
  transformDomainBillingCitiesList,
  transformDomainBillingCity,
  transformDomainServiceLine,
  transformDomainServiceLinesList,
  transformDomainState,
  transformDomainStatesList,
  transformAndFilterDomainStatesList,
  getActiveStatesIds,
  getVisibleFilterOptions,
} from './mappers';
import {
  mockedPayerFormData,
  mockedNetworkFormData,
  mockedNetworkRowData,
  mockedPatchNetworkStatesInitialData,
} from '../../feature';
import {
  mockedInsurancePayer,
  mockedInsuranceNetwork,
  mockedInsurancePayerGroups,
  mockedInsuranceClassifications,
  mockedServiceLine,
  mockedStates,
  mockedNetworkModalityConfig,
  mockedStatePA,
} from '../../domain';
import { StatesStatusOptions } from '../../types';
import { FilterOption } from '../../types/common';

describe('utils mappers', () => {
  describe('prepareInsurancePayerRequestData', () => {
    it('should transform payer form data to payer domain request payload', () => {
      const result = prepareInsurancePayerRequestData(mockedPayerFormData);
      expect(result).toEqual({
        name: mockedPayerFormData.name,
        notes: mockedPayerFormData.notes,
        active: mockedPayerFormData.active,
        payerGroupId: mockedPayerFormData.payerGroupId,
      });
    });

    it('should transform create payer data with empty payer group id', () => {
      const result = prepareInsurancePayerRequestData({
        ...mockedPayerFormData,
        payerGroupId: undefined,
      });
      expect(result).toEqual({
        name: mockedPayerFormData.name,
        notes: mockedPayerFormData.notes,
        active: mockedPayerFormData.active,
        payerGroupId: undefined,
      });
    });
  });

  describe('insurancePayerToInsurancePayerFormData', () => {
    it('should transform insurance payer domain model to insurance payer form data', () => {
      const result =
        insurancePayerToInsurancePayerFormData(mockedInsurancePayer);
      expect(result).toEqual({
        name: mockedInsurancePayer.name,
        active: mockedInsurancePayer.active,
        notes: mockedInsurancePayer.notes,
        payerGroupId: mockedInsurancePayer.payerGroupId,
      });
    });

    it('should transform insurance payer domain model to insurance payer form data with optional fields', () => {
      const result = insurancePayerToInsurancePayerFormData({
        ...mockedInsurancePayer,
        notes: undefined,
        payerGroupId: undefined,
      });
      expect(result).toEqual({
        name: mockedInsurancePayer.name,
        active: mockedInsurancePayer.active,
        notes: '',
        payerGroupId: undefined,
      });
    });
  });

  describe('insuranceAddressToInsuranceAddressFormData', () => {
    it('should transform insurance address domain model to insurance address form data', () => {
      const result = insuranceAddressToInsuranceAddressFormData(
        mockedInsuranceNetwork.address
      );
      expect(result).toEqual({
        addressLineOne: mockedNetworkFormData.address.addressLineOne,
        city: mockedNetworkFormData.address.city,
        stateName: mockedNetworkFormData.address.stateName,
        zipCode: mockedNetworkFormData.address.zipCode,
      });
    });
  });

  describe('prepareAddressToInsuranceAddressFormData', () => {
    it('should transform insurance address form data model to insurance address domain', () => {
      const result = prepareAddressRequestData(mockedNetworkFormData.address);
      expect(result).toEqual({
        addressLineOne: mockedInsuranceNetwork.address.addressLineOne,
        city: mockedInsuranceNetwork.address.city,
        state: mockedInsuranceNetwork.address.state,
        zipCode: mockedInsuranceNetwork.address.zipCode,
      });
    });
  });

  describe('prepareInsuranceNetworkRequestData', () => {
    it('should transform insurance network form data to insurance network request data', () => {
      const result = prepareInsuranceNetworkRequestData(mockedNetworkFormData);
      expect(result).toEqual({
        name: mockedInsuranceNetwork.name,
        notes: mockedInsuranceNetwork.notes,
        active: mockedInsuranceNetwork.active,
        insuranceClassificationId:
          mockedInsuranceNetwork.insuranceClassificationId,
        packageId: mockedInsuranceNetwork.packageId,
        address: prepareAddressRequestData(mockedNetworkFormData.address),
        eligibilityCheck: mockedInsuranceNetwork.eligibilityCheck,
        providerEnrollment: mockedInsuranceNetwork.providerEnrollment,
        insurancePayerId: mockedInsuranceNetwork.insurancePayerId,
        insurancePlanId: mockedInsuranceNetwork.insurancePlanId,
        emcCode: mockedInsuranceNetwork.emcCode,
        addresses: mockedNetworkFormData.addresses.map(
          prepareAddressRequestData
        ),
      });
    });
  });

  describe('insuranceNetworkToInsuranceNetworkFormData', () => {
    it('should transform insurance network domain model to insurance network form data', () => {
      const result = insuranceNetworkToInsuranceNetworkFormData(
        mockedInsuranceNetwork
      );
      expect(result).toEqual({
        name: mockedNetworkFormData.name,
        notes: mockedNetworkFormData.notes,
        active: mockedNetworkFormData.active,
        insuranceClassificationId:
          mockedNetworkFormData.insuranceClassificationId,
        packageId: mockedNetworkFormData.packageId,
        address: insuranceAddressToInsuranceAddressFormData(
          mockedInsuranceNetwork.address
        ),
        eligibilityCheck: mockedNetworkFormData.eligibilityCheck,
        providerEnrollment: mockedNetworkFormData.providerEnrollment,
        insurancePayerId: mockedNetworkFormData.insurancePayerId,
        insurancePlanId: mockedNetworkFormData.insurancePlanId,
        emcCode: mockedNetworkFormData.emcCode,
        addresses: mockedInsuranceNetwork.addresses.map(
          insuranceAddressToInsuranceAddressFormData
        ),
      });
    });
  });

  describe('transformPayerGroupsList', () => {
    it('should transform insurance payer group domain model to insurance payer group form data with fields', () => {
      const result = transformPayerGroupsList(mockedInsurancePayerGroups);
      expect(result).toEqual([
        {
          name: mockedInsurancePayerGroups[0].name,
          payerGroupId: mockedInsurancePayerGroups[0].payerGroupId,
        },
      ]);
    });

    it('should return an empty array if there is no data', () => {
      const result = transformPayerGroupsList(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('insurancePayersToInsurancePayersList', () => {
    it('should transform insurance payers to insurance payers list', () => {
      const mockedPayerGroups = [{ name: 'payer group 1', payerGroupId: '1' }];
      const result = insurancePayersToInsurancePayersList(
        [mockedInsurancePayer],
        mockedPayerGroups
      );

      expect(result).toEqual([
        {
          ...mockedInsurancePayer,
          payerGroup: mockedPayerGroups[0],
          payerGroupId: undefined,
        },
      ]);
    });

    it('should transform insurance payers to insurance payers list with optional fields', () => {
      const result = insurancePayersToInsurancePayersList([
        { ...mockedInsurancePayer, notes: undefined, payerGroupId: undefined },
      ]);

      expect(result).toEqual([
        {
          ...mockedInsurancePayer,
          notes: undefined,
          payerGroup: undefined,
          payerGroupId: undefined,
        },
      ]);
    });

    it('should return empty array if no payers provided', () => {
      const result = insurancePayersToInsurancePayersList();

      expect(result).toEqual([]);
    });
  });

  describe('getPaginatedInsurancePayers', () => {
    it('should return only the payers that should be displayed on the page', () => {
      const mockedPayersList = Array.from(Array(50), (_, index) => ({
        ...mockedInsurancePayer,
        name: mockedInsurancePayer.name + index,
        id: mockedInsurancePayer.id + index,
      }));
      const result = getPaginatedInsurancePayers(mockedPayersList, 25, 1);
      expect(result).toHaveLength(25);
      expect(result).toEqual(mockedPayersList.slice(25, 50));
    });

    it('should return an empty array if there is no payers', () => {
      const result = getPaginatedInsurancePayers([], 25, 1);
      expect(result).toEqual([]);
    });
  });

  describe('getPaginatedInsuranceNetworks', () => {
    it('should return only the networks that should be displayed on the page', () => {
      const mockedNetworksList = Array.from(Array(50), (_, index) => ({
        ...mockedInsuranceNetwork,
        name: mockedInsuranceNetwork.name + index,
        id: mockedInsuranceNetwork.id + index,
        classification: mockedInsuranceNetwork.insuranceClassificationId,
      }));
      const result = getPaginatedInsuranceNetworks(25, 1, mockedNetworksList);
      expect(result).toHaveLength(25);
      expect(result).toEqual(mockedNetworksList.slice(25, 50));
    });

    it('should return an empty array for non existing page', () => {
      const mockedNetworksList = Array.from(Array(50), (_, index) => ({
        ...mockedInsuranceNetwork,
        name: mockedInsuranceNetwork.name + index,
        id: mockedInsuranceNetwork.id + index,
        classification: mockedInsuranceNetwork.insuranceClassificationId,
      }));
      const result = getPaginatedInsuranceNetworks(25, 3, mockedNetworksList);
      expect(result).toHaveLength(0);
      expect(result).toEqual(mockedNetworksList.slice(50, 75));
    });

    it('should return an empty array if there is no networks', () => {
      const result = getPaginatedInsuranceNetworks(25, 1, []);
      expect(result).toEqual([]);
    });
  });

  describe('toPaginatedNetworks', () => {
    it('should return only the networks that should be displayed on the page', () => {
      const result = toPaginatedNetworks(
        [mockedInsuranceNetwork],
        mockedInsuranceClassifications,
        0,
        25
      );

      expect(result).toEqual([mockedNetworkRowData]);
    });

    it('should return networks without classification', () => {
      const result = toPaginatedNetworks(
        [{ ...mockedInsuranceNetwork, insuranceClassificationId: '3' }],
        mockedInsuranceClassifications,
        0,
        25
      );

      expect(result).toEqual([{ ...mockedNetworkRowData, classification: '' }]);
    });

    it('should return an empty array if there is no networks', () => {
      const result = toPaginatedNetworks([], [], 25, 1);
      expect(result).toEqual([]);
    });
  });

  describe('prepareNetworkStateRequestData', () => {
    it('should transform network state request data into network state request domain data', () => {
      const result = prepareNetworkStateRequestData(
        mockedPatchNetworkStatesInitialData
      );

      expect(result).toEqual({
        network_id: mockedPatchNetworkStatesInitialData.networkId,
        state_abbrs: mockedPatchNetworkStatesInitialData.stateAbbrs,
      });
    });

    it('should return empty array of state abbrs if no provided', () => {
      const result = prepareNetworkStateRequestData({
        networkId: mockedPatchNetworkStatesInitialData.networkId,
        stateAbbrs: [],
      });

      expect(result).toEqual({
        network_id: mockedPatchNetworkStatesInitialData.networkId,
        state_abbrs: [],
      });
    });
  });

  describe('buildBillingCitiesModalityConfigsHierarchy', () => {
    it('should build billingCities configs hierarchy', () => {
      const networkModalityConfigs = [mockedNetworkModalityConfig];
      const result = buildBillingCitiesModalityConfigsHierarchy(
        networkModalityConfigs
      );
      expect(result).toEqual({
        [mockedNetworkModalityConfig.billingCityId]: {
          [mockedNetworkModalityConfig.serviceLineId]: [
            mockedNetworkModalityConfig.modalityId,
          ],
        },
      });
    });

    it('should return empty object if no data passed', () => {
      const result = buildBillingCitiesModalityConfigsHierarchy();
      expect(result).toEqual({});
    });
  });

  describe('transformDomainServiceLine', () => {
    it('should transform domain service line', () => {
      const result = transformDomainServiceLine(mockedServiceLine);
      expect(result).toEqual({
        id: mockedServiceLine.id,
        name: mockedServiceLine.name,
        default: mockedServiceLine.default,
      });
    });
  });

  describe('transformServiceLinesList', () => {
    it('should transform service lines', () => {
      const result = transformDomainServiceLinesList([mockedServiceLine]);
      expect(result).toEqual([
        {
          id: mockedServiceLine.id,
          name: mockedServiceLine.name,
          default: mockedServiceLine.default,
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformDomainServiceLinesList();
      expect(result).toEqual([]);
    });
  });

  describe('transformDomainBillingCity', () => {
    it('should transform domain billing city', () => {
      const billingCity = mockedStates[0].billingCities[0];
      const result = transformDomainBillingCity(billingCity);
      expect(result).toEqual({
        id: billingCity.id,
        name: billingCity.name,
        shortName: billingCity.shortName,
      });
    });
  });

  describe('transformDomainBillingCities', () => {
    it('should transform billing cities', () => {
      const billingCity = mockedStates[0].billingCities[0];
      const result = transformDomainBillingCitiesList([billingCity]);
      expect(result).toEqual([
        {
          id: billingCity.id,
          name: billingCity.name,
          shortName: billingCity.shortName,
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformDomainBillingCitiesList();
      expect(result).toEqual([]);
    });
  });

  describe('transformDomainState', () => {
    it('should transform domain state', () => {
      const mockedState = mockedStates[0];
      const result = transformDomainState(mockedState);
      expect(result).toEqual({
        id: mockedState.id,
        name: mockedState.name,
        abbreviation: mockedState.abbreviation,
        billingCities: transformDomainBillingCitiesList(
          mockedState.billingCities
        ),
      });
    });
  });

  describe('transformDomainStatesList', () => {
    it('should transform states', () => {
      const mockedState = mockedStates[0];
      const result = transformDomainStatesList([mockedState]);
      expect(result).toEqual([
        {
          id: mockedState.id,
          name: mockedState.name,
          abbreviation: mockedState.abbreviation,
          billingCities: transformDomainBillingCitiesList(
            mockedState.billingCities
          ),
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformDomainStatesList();
      expect(result).toEqual([]);
    });
  });

  describe('prepareNetworkStateRequestData', () => {
    it('should transform network state request data into network state request domain data', () => {
      const result = prepareNetworkStateRequestData(
        mockedPatchNetworkStatesInitialData
      );

      expect(result).toEqual({
        network_id: mockedPatchNetworkStatesInitialData.networkId,
        state_abbrs: mockedPatchNetworkStatesInitialData.stateAbbrs,
      });
    });

    it('should return empty array of state abbrs if no provided', () => {
      const result = prepareNetworkStateRequestData({
        networkId: mockedPatchNetworkStatesInitialData.networkId,
        stateAbbrs: [],
      });

      expect(result).toEqual({
        network_id: mockedPatchNetworkStatesInitialData.networkId,
        state_abbrs: [],
      });
    });
  });

  describe('transformDomainServiceLine', () => {
    it('should transform domain service line', () => {
      const result = transformDomainServiceLine(mockedServiceLine);
      expect(result).toEqual({
        id: mockedServiceLine.id,
        name: mockedServiceLine.name,
        default: mockedServiceLine.default,
      });
    });
  });

  describe('transformServiceLinesList', () => {
    it('should transform service lines', () => {
      const result = transformDomainServiceLinesList([mockedServiceLine]);
      expect(result).toEqual([
        {
          id: mockedServiceLine.id,
          name: mockedServiceLine.name,
          default: mockedServiceLine.default,
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformDomainServiceLinesList();
      expect(result).toEqual([]);
    });
  });

  describe('transformDomainState', () => {
    it('should transform domain state', () => {
      const mockedState = mockedStates[0];
      const result = transformDomainState(mockedState);
      expect(result).toEqual({
        id: mockedState.id,
        name: mockedState.name,
        abbreviation: mockedState.abbreviation,
        billingCities: transformDomainBillingCitiesList(
          mockedState.billingCities
        ),
      });
    });
  });

  describe('transformDomainStatesList', () => {
    it('should transform states', () => {
      const mockedState = mockedStates[0];
      const result = transformDomainStatesList([mockedState]);
      expect(result).toEqual([
        {
          id: mockedState.id,
          name: mockedState.name,
          abbreviation: mockedState.abbreviation,
          billingCities: transformDomainBillingCitiesList(
            mockedState.billingCities
          ),
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformDomainStatesList();
      expect(result).toEqual([]);
    });
  });

  describe('getActiveStatesIds', () => {
    it.each([
      {
        states: undefined,
        expected: [],
        modalityConfigs: undefined,
        message:
          'should return an empty array if no states and modality configs were provided',
      },
      {
        states: mockedStates,
        expected: [],
        modalityConfigs: [],
        message:
          'should return an empty array if no modality configs were provided',
      },
      {
        states: [],
        expected: [],
        modalityConfigs: [mockedNetworkModalityConfig],
        message: 'should return an empty array if no states were provided',
      },
      {
        states: mockedStates,
        modalityConfigs: [mockedNetworkModalityConfig],
        expected: [mockedStatePA.id],
        message: 'should return active states ids',
      },
    ])('$message', ({ states, modalityConfigs, expected }) => {
      const result = getActiveStatesIds(states, modalityConfigs);
      expect(result).toEqual(expected);
    });
  });

  describe('transformAndFilterDomainStatesList', () => {
    it('should transform and filter states by state filter option', () => {
      const mockedState = mockedStates[0];
      const result = transformAndFilterDomainStatesList(
        [mockedState],
        mockedState.id
      );
      expect(result).toEqual([
        {
          id: mockedState.id,
          name: mockedState.name,
          abbreviation: mockedState.abbreviation,
          billingCities: transformDomainBillingCitiesList(
            mockedState.billingCities
          ),
        },
      ]);
    });

    it('should transform and filter states by states status filter option: inactive states', () => {
      const mockedState = mockedStates[0];
      const result = transformAndFilterDomainStatesList(
        [mockedState],
        mockedState.id,
        mockedServiceLine.id,
        StatesStatusOptions.INACTIVE,
        [mockedNetworkModalityConfig]
      );
      expect(result).toEqual([]);
    });

    it('should transform and filter states by states status filter option: active states', () => {
      const mockedState = mockedStates[0];
      const result = transformAndFilterDomainStatesList(
        [mockedState],
        mockedState.id,
        mockedServiceLine.id,
        StatesStatusOptions.ACTIVE,
        [mockedNetworkModalityConfig]
      );
      expect(result).toEqual([
        {
          id: mockedState.id,
          name: mockedState.name,
          abbreviation: mockedState.abbreviation,
          billingCities: transformDomainBillingCitiesList(
            mockedState.billingCities
          ),
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformAndFilterDomainStatesList();
      expect(result).toEqual([]);
    });
  });

  describe('getVisibleFilterOptions', () => {
    it('should return transformed array with visible filtered options and search text', () => {
      const mockedState = mockedStates[0];
      const mockedFilterOptions: FilterOption[] = [
        {
          title: 'State',
          optionsTitle: 'States',
          options: mockedStates,
          filteredOptions: mockedStates,
          filterBy: [mockedState.abbreviation],
          searchText: '',
        },
      ];
      const mockedFilterOption = mockedFilterOptions[0];
      const mockedFiltersSearchValue = 'Pennsylvania';

      const result = getVisibleFilterOptions(mockedFilterOptions, [
        mockedFiltersSearchValue,
      ]);
      expect(result).toEqual([
        {
          title: mockedFilterOption.title,
          optionsTitle: mockedFilterOption.optionsTitle,
          options: mockedFilterOption.options,
          filteredOptions: [mockedState],
          filterBy: mockedFilterOption.filterBy,
          searchText: mockedFiltersSearchValue,
        },
      ]);
    });
  });
});
