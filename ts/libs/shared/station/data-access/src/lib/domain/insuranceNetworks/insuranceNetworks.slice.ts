import { stationApiSlice } from '../api.slice';
import { buildUrlQuery } from '../../utils/query';
import { InsuranceNetwork } from '../../types';

export const INSURANCE_NETWORKS_BASE_PATH = '/api/insurance_networks';
export const INSURANCE_NETWORKS_SEARCH_SEGMENT = '/search';

export enum InsuranceNetworkSortField {
  UNSPECIFIED = 0,
  NAME = 1,
  UPDATED_AT = 2,
}

export enum InsuranceNetworkSortDirection {
  UNSPECIFIED = 0,
  ASC = 1,
  DESC = 2,
}

export type SearchInsuranceNetworksQuery = {
  search?: string;
  payer_ids?: (string | number)[];
  state_abbrs?: string[];
  insurance_classifications?: (string | number)[];
  sort_field?: InsuranceNetworkSortField;
  sort_direction?: InsuranceNetworkSortDirection;
};

export const insuranceNetworksSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchInsuranceNetworks: builder.query<
      InsuranceNetwork[],
      SearchInsuranceNetworksQuery | void
    >({
      query: (params) => {
        const urlQuery = params ? `?${buildUrlQuery(params)}` : '';

        return {
          // we need to override how RTK builds query in order to have ability send array values.
          url: `${INSURANCE_NETWORKS_BASE_PATH}${INSURANCE_NETWORKS_SEARCH_SEGMENT}${urlQuery}`,
        };
      },
      transformResponse: ({ networks }: { networks: InsuranceNetwork[] }) =>
        networks,
    }),
  }),
});

export const selectInsuranceNetworks =
  insuranceNetworksSlice.endpoints.searchInsuranceNetworks.select;

export const { useSearchInsuranceNetworksQuery } = insuranceNetworksSlice;
