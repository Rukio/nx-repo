import {
  mockedMarket,
  mockedModality,
  mockedServiceLine,
  mockedInsurancePlan as domainInsurancePlan,
  mockedMarketModalityConfig,
  mockedModalityConfig,
  InsuranceNetworkSortDirection,
  InsuranceNetworkSortField,
  mockedInsuranceNetwork,
  NetworkModalityConfig as DomainNetworkModalityConfig,
  mockedModalitiesList,
} from '@*company-data-covered*/station/data-access';
import {
  transformDomainInsurancePlan,
  transformDomainMarket,
  transformDomainModality,
  transformDomainServiceLine,
  transformMarketsList,
  transformModalitiesList,
  transformServiceLinesList,
  transformInsurancePlansList,
  sortMarketsList,
  sortInsurancePlans,
  transformDomainMarketModalityConfig,
  transformMarketsModalityConfigs,
  transformDomainModalityConfig,
  transformModalityConfigs,
  transformMarketsModalityConfigToDomain,
  transformMarketsModalityConfigsToDomain,
  transformModalityConfigToDomain,
  transformModalityConfigsToDomain,
  buildMarketsModalityConfigsHierarchy,
  buildModalityConfigsHierarchy,
  getNetworksDomainSortField,
  getNetworksDomainSortDirection,
  transformNetworksSearchParamsToDomain,
  buildPaginatedInsuranceNetworks,
  filterInsuranceNetworksByMarket,
  transformDomainInsuranceNetworkTo,
  transformDomainInsuranceNetworksTo,
  transformDomainGetNetworksModalityConfigsQuery,
  transformDomainNetworkModalityConfig,
  transformDomainNetworkModalityConfigs,
  transformNetworksModalityConfigsQueryTo,
  buildNetworksModalityConfigsHierarchy,
  transformModalityDisplayName,
} from './mappers';
import { SortBy, SortOrder } from '../../feature/insurancesConfiguration';
import {
  NetworksSortBy,
  NetworksSortOrder,
  NetworksSearchParams,
  NetworkModalityConfig,
  InsuranceNetwork,
} from '../../feature/networksConfiguration';

const mockedInsurancePlans = transformInsurancePlansList([
  {
    ...domainInsurancePlan,
    id: 1,
    name: 'A',
    updated_at: '2023-01-01T14:44:44.432Z',
  },
  {
    ...domainInsurancePlan,
    id: 2,
    name: 'B',
    updated_at: '2023-01-01T14:45:44.432Z',
  },
  {
    ...domainInsurancePlan,
    id: 3,
    name: 'C',
    updated_at: '2023-01-01T14:46:44.432Z',
  },
]);

const mockedNetworkModalityConfig: DomainNetworkModalityConfig = {
  id: 1,
  modality_id: 2,
  service_line_id: 3,
  network_id: 4,
  billing_city_id: 5,
};

describe('utils mappers', () => {
  describe('transformDomainMarket', () => {
    it('should transform domain market', () => {
      const result = transformDomainMarket(mockedMarket);
      expect(result).toEqual({
        id: mockedMarket.id,
        name: mockedMarket.name,
        shortName: mockedMarket.short_name,
        state: mockedMarket.state,
      });
    });
  });

  describe('transformMarketsList', () => {
    it('should transform markets', () => {
      const result = transformMarketsList([mockedMarket]);
      expect(result).toEqual([
        {
          id: mockedMarket.id,
          name: mockedMarket.name,
          shortName: mockedMarket.short_name,
          state: mockedMarket.state,
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformMarketsList();
      expect(result).toEqual([]);
    });
  });

  describe('sortMarketsList', () => {
    it('should return sorted markets by name', () => {
      const markets = transformMarketsList([
        {
          ...mockedMarket,
          id: 1,
          name: 'B',
        },
        {
          ...mockedMarket,
          id: 1,
          name: 'C',
        },
        {
          ...mockedMarket,
          id: 1,
          name: 'A',
        },
      ]);

      const result = sortMarketsList(markets);
      expect(result).toEqual([markets[2], markets[0], markets[1]]);
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
      const result = transformServiceLinesList([mockedServiceLine]);
      expect(result).toEqual([
        {
          id: mockedServiceLine.id,
          name: mockedServiceLine.name,
          default: mockedServiceLine.default,
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformServiceLinesList();
      expect(result).toEqual([]);
    });
  });

  describe('transformDomainInsurancePlan', () => {
    it('should transform domain insurance plan', () => {
      const result = transformDomainInsurancePlan(domainInsurancePlan);
      expect(result).toEqual({
        id: domainInsurancePlan.id,
        name: domainInsurancePlan.name,
        insuranceClassification:
          domainInsurancePlan.insurance_classification.name,
        packageId: domainInsurancePlan.package_id,
        updatedAt: domainInsurancePlan.updated_at,
      });
    });
  });

  describe('transformInsurancePlansList', () => {
    it('should transform insurance plans', () => {
      const result = transformInsurancePlansList([domainInsurancePlan]);
      expect(result).toEqual([
        {
          id: domainInsurancePlan.id,
          name: domainInsurancePlan.name,
          insuranceClassification:
            domainInsurancePlan.insurance_classification.name,
          packageId: domainInsurancePlan.package_id,
          updatedAt: domainInsurancePlan.updated_at,
        },
      ]);
    });

    it('should return an empty array if no data passed', () => {
      const result = transformInsurancePlansList();
      expect(result).toEqual([]);
    });

    describe('transformModalityDisplayName', () => {
      it('should not transform if it is not Tele-p', () => {
        const result = transformModalityDisplayName(
          transformDomainModality(mockedModality)
        );
        expect(result).toEqual({
          id: mockedModality.id,
          type: mockedModality.type,
          displayName: mockedModality.display_name,
        });
      });

      it('should transform Tele-p displayName', () => {
        const result = transformModalityDisplayName(
          transformDomainModality(mockedModalitiesList[2])
        );
        expect(result).toEqual({
          id: mockedModalitiesList[2].id,
          type: mockedModalitiesList[2].type,
          displayName: 'Hybrid',
        });
      });
    });

    describe('transformDomainModality', () => {
      it('should transform domain modality', () => {
        const result = transformDomainModality(mockedModality);
        expect(result).toEqual({
          id: mockedModality.id,
          type: mockedModality.type,
          displayName: mockedModality.display_name,
        });
      });
    });

    describe('transformMarketsList', () => {
      it('should transform modalities', () => {
        const result = transformModalitiesList(mockedModalitiesList);
        expect(result).toEqual([
          {
            id: mockedModalitiesList[0].id,
            type: mockedModalitiesList[0].type,
            displayName: mockedModalitiesList[0].display_name,
          },
          {
            id: mockedModalitiesList[1].id,
            type: mockedModalitiesList[1].type,
            displayName: mockedModalitiesList[1].display_name,
          },
          {
            id: mockedModalitiesList[2].id,
            type: mockedModalitiesList[2].type,
            displayName: 'Hybrid',
          },
        ]);
      });

      it('should return an empty array if no data passed', () => {
        const result = transformModalitiesList();
        expect(result).toEqual([]);
      });
    });

    describe('transformDomainMarketModalityConfig', () => {
      it('should transform domain market modality config', () => {
        const result = transformDomainMarketModalityConfig(
          mockedMarketModalityConfig
        );
        expect(result).toEqual({
          id: mockedMarketModalityConfig.id,
          marketId: mockedMarketModalityConfig.market_id,
          serviceLineId: mockedMarketModalityConfig.service_line_id,
          modalityId: mockedMarketModalityConfig.modality_id,
        });
      });
    });

    describe('transformMarketsModalityConfigs', () => {
      it('should transform domain market modality configs array', () => {
        const result = transformMarketsModalityConfigs([
          mockedMarketModalityConfig,
        ]);
        expect(result).toEqual([
          {
            id: mockedMarketModalityConfig.id,
            marketId: mockedMarketModalityConfig.market_id,
            serviceLineId: mockedMarketModalityConfig.service_line_id,
            modalityId: mockedMarketModalityConfig.modality_id,
          },
        ]);
      });

      it('should return an empty array if no data passed', () => {
        const result = transformMarketsModalityConfigs();
        expect(result).toEqual([]);
      });
    });

    describe('transformDomainModalityConfig', () => {
      it('should transform domain modality config', () => {
        const result = transformDomainModalityConfig(mockedModalityConfig);
        expect(result).toEqual({
          id: mockedModalityConfig.id,
          marketId: mockedModalityConfig.market_id,
          serviceLineId: mockedModalityConfig.service_line_id,
          modalityId: mockedModalityConfig.modality_id,
          insurancePlanId: mockedModalityConfig.insurance_plan_id,
        });
      });
    });

    describe('transformModalityConfigs', () => {
      it('should transform domain modality configs array', () => {
        const result = transformModalityConfigs([mockedModalityConfig]);
        expect(result).toEqual([
          {
            id: mockedModalityConfig.id,
            marketId: mockedModalityConfig.market_id,
            serviceLineId: mockedModalityConfig.service_line_id,
            modalityId: mockedModalityConfig.modality_id,
            insurancePlanId: mockedModalityConfig.insurance_plan_id,
          },
        ]);
      });

      it('should return an empty array if no data passed', () => {
        const result = transformModalityConfigs();
        expect(result).toEqual([]);
      });
    });

    describe('transformMarketsModalityConfigToDomain', () => {
      it('should transform feature market modality config to domain model', () => {
        const featureMarketModalityConfig = transformDomainMarketModalityConfig(
          mockedMarketModalityConfig
        );
        const result = transformMarketsModalityConfigToDomain(
          featureMarketModalityConfig
        );
        expect(result).toEqual(mockedMarketModalityConfig);
      });
    });

    describe('transformMarketsModalityConfigsToDomain', () => {
      it('should transform feature markets modality configs to domain model', () => {
        const featureMarketsModalityConfigs = transformMarketsModalityConfigs([
          mockedMarketModalityConfig,
        ]);
        const result = transformMarketsModalityConfigsToDomain(
          featureMarketsModalityConfigs
        );
        expect(result).toEqual([mockedMarketModalityConfig]);
      });

      it('should return an empty array if no data passed', () => {
        const result = transformMarketsModalityConfigsToDomain();
        expect(result).toEqual([]);
      });
    });

    describe('transformModalityConfigToDomain', () => {
      it('should transform feature modality config to domain model', () => {
        const featureModalityConfig =
          transformDomainModalityConfig(mockedModalityConfig);
        const result = transformModalityConfigToDomain(featureModalityConfig);
        expect(result).toEqual(mockedModalityConfig);
      });
    });

    describe('transformModalityConfigsToDomain', () => {
      it('should transform feature modality configs to domain model', () => {
        const featureModalityConfigs = transformModalityConfigs([
          mockedModalityConfig,
        ]);
        const result = transformModalityConfigsToDomain(featureModalityConfigs);
        expect(result).toEqual([mockedModalityConfig]);
      });

      it('should return an empty array if no data passed', () => {
        const result = transformModalityConfigsToDomain();
        expect(result).toEqual([]);
      });
    });

    describe('buildMarketsModalityConfigsHierarchy', () => {
      it('should build markets modality configs hierarchy', () => {
        const marketsModalityConfigs = transformMarketsModalityConfigs([
          mockedMarketModalityConfig,
        ]);
        const result = buildMarketsModalityConfigsHierarchy(
          marketsModalityConfigs
        );
        expect(result).toEqual({
          [mockedMarketModalityConfig.market_id]: [
            mockedMarketModalityConfig.modality_id,
          ],
        });
      });

      it('should return empty object if no data passed', () => {
        const result = buildMarketsModalityConfigsHierarchy();
        expect(result).toEqual({});
      });
    });

    describe('buildModalityConfigsHierarchy', () => {
      it('should build modality configs hierarchy', () => {
        const modalityConfigs = transformModalityConfigs([
          mockedModalityConfig,
        ]);
        const result = buildModalityConfigsHierarchy(modalityConfigs);
        expect(result).toEqual({
          [mockedModalityConfig.market_id]: {
            [mockedModalityConfig.insurance_plan_id]: [
              mockedModalityConfig.modality_id,
            ],
          },
        });
      });

      it('should return empty object if no data passed', () => {
        const result = buildModalityConfigsHierarchy();
        expect(result).toEqual({});
      });
    });
  });

  describe('sortInsurancePlans', () => {
    it('should apply ascending sorting based on name', () => {
      const result = sortInsurancePlans(
        mockedInsurancePlans,
        SortBy.NAME,
        SortOrder.ASC
      );
      expect(result).toEqual(mockedInsurancePlans);
    });

    it('should apply descending sorting based on name', () => {
      const result = sortInsurancePlans(
        mockedInsurancePlans,
        SortBy.NAME,
        SortOrder.DESC
      );
      expect(result).toEqual([...mockedInsurancePlans].reverse());
    });

    it('should apply ascending sorting based on updatedAt', () => {
      const result = sortInsurancePlans(
        mockedInsurancePlans,
        SortBy.UPDATED_AT,
        SortOrder.ASC
      );
      expect(result).toEqual(mockedInsurancePlans);
    });

    it('should apply descending sorting based on updatedAt', () => {
      const result = sortInsurancePlans(
        mockedInsurancePlans,
        SortBy.UPDATED_AT,
        SortOrder.DESC
      );
      expect(result).toEqual([...mockedInsurancePlans].reverse());
    });
  });

  describe('getNetworksDomainSortField', () => {
    it.each([
      {
        sortField: NetworksSortBy.NAME,
        expectedSortField: InsuranceNetworkSortField.NAME,
      },
      {
        sortField: NetworksSortBy.UPDATED_AT,
        expectedSortField: InsuranceNetworkSortField.UPDATED_AT,
      },
      {
        sortField: undefined,
        expectedSortField: InsuranceNetworkSortField.UNSPECIFIED,
      },
    ])(
      'should return correct insurance networks domain sort field value',
      ({ sortField, expectedSortField }) => {
        const result = getNetworksDomainSortField(sortField);
        expect(result).toEqual(expectedSortField);
      }
    );
  });

  describe('getNetworksDomainSortDirection', () => {
    it.each([
      {
        sortDirection: NetworksSortOrder.ASC,
        expectedSortDirection: InsuranceNetworkSortDirection.ASC,
      },
      {
        sortDirection: NetworksSortOrder.DESC,
        expectedSortDirection: InsuranceNetworkSortDirection.DESC,
      },
      {
        sortDirection: undefined,
        expectedSortDirection: InsuranceNetworkSortDirection.UNSPECIFIED,
      },
    ])(
      'should return correct insurance networks domain sort field value',
      ({ sortDirection, expectedSortDirection }) => {
        const result = getNetworksDomainSortDirection(sortDirection);
        expect(result).toEqual(expectedSortDirection);
      }
    );
  });

  describe('transformNetworksSearchParamsToDomain', () => {
    it('should transform to domain search params', () => {
      const mockedParams: Partial<NetworksSearchParams> = {
        search: 'test',
        sortBy: NetworksSortBy.NAME,
        sortOrder: NetworksSortOrder.DESC,
      };
      const result = transformNetworksSearchParamsToDomain(mockedParams);
      expect(result).toEqual({
        search: mockedParams.search,
        sort_direction: InsuranceNetworkSortDirection.DESC,
        sort_field: InsuranceNetworkSortField.NAME,
      });
    });
  });

  describe('transformDomainInsuranceNetworkTo', () => {
    it('should transform domain insurance network', () => {
      const result = transformDomainInsuranceNetworkTo(mockedInsuranceNetwork);
      expect(result).toEqual({
        id: mockedInsuranceNetwork.id,
        name: mockedInsuranceNetwork.name,
        stateAbbrs: mockedInsuranceNetwork.state_abbrs,
        updatedAt: mockedInsuranceNetwork.updated_at,
      });
    });
  });

  describe('transformDomainInsuranceNetworksTo', () => {
    it('should transform domain insurance networks', () => {
      const result = transformDomainInsuranceNetworksTo([
        mockedInsuranceNetwork,
      ]);
      expect(result).toEqual([
        {
          id: mockedInsuranceNetwork.id,
          name: mockedInsuranceNetwork.name,
          stateAbbrs: mockedInsuranceNetwork.state_abbrs,
          updatedAt: mockedInsuranceNetwork.updated_at,
        },
      ]);
    });

    it('should return empty array if there is no insurance networks', () => {
      const result = transformDomainInsuranceNetworksTo();
      expect(result).toEqual([]);
    });
  });

  describe('buildPaginatedInsuranceNetworks', () => {
    it('should return displayed insurance networks', () => {
      const mockedNetworks = transformDomainInsuranceNetworksTo(
        Array(15)
          .fill(mockedInsuranceNetwork)
          .map((network, index) => ({
            ...network,
            id: index,
            name: `Network ${index}`,
          }))
      );

      const { networks: firstPageNetworks, total: firstTotal } =
        buildPaginatedInsuranceNetworks({
          networks: mockedNetworks,
          page: 0,
          rowsPerPage: 10,
        });
      expect(firstPageNetworks).toEqual(mockedNetworks.slice(0, 10));
      expect(firstTotal).toEqual(mockedNetworks.length);

      const { networks: secondPageNetworks, total: secondTotal } =
        buildPaginatedInsuranceNetworks({
          networks: mockedNetworks,
          page: 1,
          rowsPerPage: 10,
        });
      expect(secondPageNetworks).toEqual(mockedNetworks.slice(10));
      expect(secondTotal).toEqual(mockedNetworks.length);
    });

    it('should return empty array if there are no networks', () => {
      const { networks, total } = buildPaginatedInsuranceNetworks({
        page: 0,
        rowsPerPage: 10,
      });
      expect(networks).toEqual([]);
      expect(total).toEqual(0);
    });
  });

  describe('filterInsuranceNetworksByMarket', () => {
    const mockedNetworkWithCO: InsuranceNetwork = {
      id: mockedInsuranceNetwork.id,
      name: mockedInsuranceNetwork.name,
      stateAbbrs: ['CO'],
      updatedAt: mockedInsuranceNetwork.updated_at,
    };
    const mockedNetworkWithNY: InsuranceNetwork = {
      id: mockedInsuranceNetwork.id + 1,
      name: mockedInsuranceNetwork.name,
      stateAbbrs: ['NY'],
      updatedAt: mockedInsuranceNetwork.updated_at,
    };

    it.each([
      {
        networks: [mockedNetworkWithCO, mockedNetworkWithNY],
        market: {
          id: 1,
          name: 'Denver',
          shortName: 'DEN',
          state: 'CO',
        },
        expectedNetworks: [mockedNetworkWithCO],
      },
      {
        networks: [mockedNetworkWithCO, mockedNetworkWithNY],
        expectedNetworks: [mockedNetworkWithCO, mockedNetworkWithNY],
      },
      {
        networks: [mockedNetworkWithCO, mockedNetworkWithNY],
        market: {
          id: 1,
          name: 'Test',
          shortName: 'TES',
          state: 'TE',
        },
        expectedNetworks: [],
      },
    ])(
      'should return filtered networks by market',
      ({ networks, market, expectedNetworks }) => {
        const result = filterInsuranceNetworksByMarket(networks, market);
        expect(result).toEqual(expectedNetworks);
      }
    );
  });

  describe('transformDomainGetNetworksModalityConfigsQuery', () => {
    it.each([
      {
        input: {
          service_line_id: 1,
          network_id: 1,
        },
        expectedResult: {
          serviceLineId: 1,
          networkId: 1,
        },
      },
      {
        input: {
          service_line_id: 1,
        },
        expectedResult: {
          serviceLineId: 1,
        },
      },
      {
        input: {
          network_id: 1,
        },
        expectedResult: {
          networkId: 1,
        },
      },
      {
        input: {},
        expectedResult: {},
      },
    ])(
      'should transform domain networks modality configs query params',
      ({ input, expectedResult }) => {
        const result = transformDomainGetNetworksModalityConfigsQuery(input);
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe('transformNetworksModalityConfigsQueryTo', () => {
    it.each([
      {
        input: {
          networkId: 1,
          serviceLineId: 1,
        },
        expectedResult: {
          network_id: 1,
          service_line_id: 1,
        },
      },
      {
        input: {
          networkId: 1,
        },
        expectedResult: {
          network_id: 1,
        },
      },
      {
        input: {
          serviceLineId: 1,
        },
        expectedResult: {
          service_line_id: 1,
        },
      },
      {
        input: {},
        expectedResult: {},
      },
    ])(
      'should transform get networks modality query params to domain',
      ({ input, expectedResult }) => {
        const result = transformNetworksModalityConfigsQueryTo(input);
        expect(result).toEqual(expectedResult);
      }
    );
  });

  describe('transformDomainNetworkModalityConfig', () => {
    it('should transform domain network modality config', () => {
      const result = transformDomainNetworkModalityConfig(
        mockedNetworkModalityConfig
      );
      expect(result).toEqual({
        id: mockedNetworkModalityConfig.id,
        networkId: mockedNetworkModalityConfig.network_id,
        billingCityId: mockedNetworkModalityConfig.billing_city_id,
        serviceLineId: mockedNetworkModalityConfig.service_line_id,
        modalityId: mockedNetworkModalityConfig.modality_id,
      });
    });
  });

  describe('transformDomainNetworkModalityConfigs', () => {
    it('should transform domain networks modality configs list', () => {
      const mockedConfigs: DomainNetworkModalityConfig[] = [
        mockedNetworkModalityConfig,
      ];

      const result = transformDomainNetworkModalityConfigs(mockedConfigs);
      expect(result).toEqual([
        {
          id: mockedNetworkModalityConfig.id,
          networkId: mockedNetworkModalityConfig.network_id,
          billingCityId: mockedNetworkModalityConfig.billing_city_id,
          serviceLineId: mockedNetworkModalityConfig.service_line_id,
          modalityId: mockedNetworkModalityConfig.modality_id,
        },
      ]);
    });

    it('should return empty array if there is no data', () => {
      const result = transformDomainNetworkModalityConfigs();
      expect(result).toEqual([]);
    });
  });

  describe('buildNetworksModalityConfigsHierarchy', () => {
    it('should build networks modality configs hierarchy', () => {
      const mockedModalityInPersonId = 1;
      const mockedModalityTelepId = 2;
      const firstMockedNetworkId = 3;
      const secondMockedNetworkId = 4;
      const mockedServiceLineId = 5;
      const mockedBillingCityId = 6;
      const mockedDomainNetworksModalityConfigs: NetworkModalityConfig[] = [
        {
          id: 1,
          networkId: firstMockedNetworkId,
          modalityId: mockedModalityInPersonId,
          serviceLineId: mockedServiceLineId,
          billingCityId: mockedBillingCityId,
        },
        {
          id: 2,
          networkId: firstMockedNetworkId,
          modalityId: mockedModalityTelepId,
          serviceLineId: mockedServiceLineId,
          billingCityId: mockedBillingCityId,
        },
        {
          id: 3,
          networkId: secondMockedNetworkId,
          modalityId: mockedModalityTelepId,
          serviceLineId: mockedServiceLineId,
          billingCityId: mockedBillingCityId,
        },
      ];

      const result = buildNetworksModalityConfigsHierarchy(
        mockedDomainNetworksModalityConfigs
      );
      expect(result).toEqual({
        [firstMockedNetworkId]: [
          mockedModalityInPersonId,
          mockedModalityTelepId,
        ],
        [secondMockedNetworkId]: [mockedModalityTelepId],
      });
    });

    it('should return empty object if there are no configs', () => {
      const result = buildNetworksModalityConfigsHierarchy();
      expect(result).toEqual({});
    });
  });
});
