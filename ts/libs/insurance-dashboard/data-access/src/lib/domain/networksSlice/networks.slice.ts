import { SkipToken } from '@reduxjs/toolkit/query';
import { insuranceDashboardApiSlice } from '../apiSlice';
import {
  DomainInsuranceNetwork,
  DomainNetworkCreditCardRule,
  DomainServiceLine,
  NetworksSortDirection,
  NetworksSortField,
  DomainNetworkAppointmentType,
} from '../../types';
import { API_CACHE_TAGS } from '../../utils/constants';

export const NETWORKS_API_PATH = 'networks';
export const NETWORK_API_CREDIT_CARD_RULES_FRAGMENT = 'credit_card_rules';
export const NETWORK_API_SERVICE_LINES_FRAGMENT = 'service_lines';
export const NETWORK_STATES_API_FRAGMENT = 'states';
export const NETWORK_API_SEARCH_FRAGMENT = 'search';
export const NETWORK_API_APPOINTMENT_TYPES_FRAGMENT = 'appointment_types';

export const buildNetworkPath = (networkId: string | number) => {
  return `${NETWORKS_API_PATH}/${networkId}`;
};
export const buildNetworkCreditCardRulesPath = (networkId: string | number) => {
  return `${NETWORKS_API_PATH}/${networkId}/${NETWORK_API_CREDIT_CARD_RULES_FRAGMENT}`;
};
export const buildNetworkServiceLinesPath = (networkId: string | number) => {
  return `${NETWORKS_API_PATH}/${networkId}/${NETWORK_API_SERVICE_LINES_FRAGMENT}`;
};
export const buildNetworkStatesPath = (networkId: string | number) => {
  return `${NETWORKS_API_PATH}/${networkId}/${NETWORK_STATES_API_FRAGMENT}`;
};
export const buildNetworkAppointmentTypesPath = (
  networkId: string | number
) => {
  return `${NETWORKS_API_PATH}/${networkId}/${NETWORK_API_APPOINTMENT_TYPES_FRAGMENT}`;
};

export type PatchInsuranceNetworkPayload = Omit<
  DomainInsuranceNetwork,
  'createdAt' | 'updatedAt' | 'deletedAt' | 'stateAbbrs'
>;
export type InsuranceNetworkRequestDataPayload = Omit<
  PatchInsuranceNetworkPayload,
  'id'
>;
type DomainNetworkCreditCardRuleWithOptionalId = Omit<
  DomainNetworkCreditCardRule,
  'id'
> &
  Partial<Pick<DomainNetworkCreditCardRule, 'id'>>;

export interface PathInsuranceNetworkCreditCardRulesPayload {
  networkId: number | string;
  creditCardRules: DomainNetworkCreditCardRuleWithOptionalId[];
}
export type PatchNetworkStatesDomainPayload = {
  network_id: string;
  state_abbrs: string[];
};
export type PatchNetworkStatesPayload = {
  networkId: string;
  stateAbbrs: string[];
};

export type NetworkIdSelectQuery = string | number | SkipToken;

export type SearchInsuranceNetworkPayload = {
  payerIds: string[];
  stateAbbrs?: string[];
  insuranceClassifications?: string[];
  sortField: NetworksSortField;
  sortDirection: NetworksSortDirection;
  showInactive: boolean;
};

export type InsuranceNetworkServiceLineAppointmentTypeRequestData = Omit<
  DomainNetworkAppointmentType,
  'id'
> &
  Partial<Pick<DomainNetworkAppointmentType, 'id'>>;

export interface PathInsuranceNetworkAppointmentTypesPayload {
  networkId: number | string;
  appointmentTypes: InsuranceNetworkServiceLineAppointmentTypeRequestData[];
}

export const networksSlice = insuranceDashboardApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchNetworksList: builder.query<
      DomainInsuranceNetwork[],
      SearchInsuranceNetworkPayload
    >({
      query: (payload) => ({
        url: `${NETWORKS_API_PATH}/${NETWORK_API_SEARCH_FRAGMENT}`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: ({
        networks,
      }: {
        networks: DomainInsuranceNetwork[];
      }) => networks,
    }),
    getNetwork: builder.query<DomainInsuranceNetwork, string | number>({
      query: (id) => buildNetworkPath(id),
      transformResponse: ({ network }: { network: DomainInsuranceNetwork }) =>
        network,
    }),
    createNetwork: builder.mutation<
      DomainInsuranceNetwork,
      InsuranceNetworkRequestDataPayload
    >({
      query: (payload) => ({
        url: NETWORKS_API_PATH,
        method: 'POST',
        body: payload,
      }),
    }),
    patchNetwork: builder.mutation<
      DomainInsuranceNetwork,
      PatchInsuranceNetworkPayload
    >({
      query: ({ id, ...networkDetails }) => ({
        url: buildNetworkPath(id),
        method: 'PATCH',
        body: networkDetails,
      }),
    }),
    getNetworkCreditCardRules: builder.query<
      DomainNetworkCreditCardRule[],
      string | number
    >({
      query: (networkId) => ({
        url: buildNetworkCreditCardRulesPath(networkId),
        method: 'GET',
      }),
      providesTags: [API_CACHE_TAGS.NetworkCreditCardRules],
      transformResponse: ({
        creditCardRules,
      }: {
        creditCardRules: DomainNetworkCreditCardRule[];
      }) => creditCardRules,
    }),
    patchNetworkCreditCardRules: builder.mutation<
      void,
      PathInsuranceNetworkCreditCardRulesPayload
    >({
      query: ({ networkId, creditCardRules }) => ({
        url: buildNetworkCreditCardRulesPath(networkId),
        method: 'PATCH',
        body: { creditCardRules },
      }),
      invalidatesTags: [API_CACHE_TAGS.NetworkCreditCardRules],
    }),
    getNetworkServiceLines: builder.query<DomainServiceLine[], string | number>(
      {
        query: (networkId) => ({
          url: buildNetworkServiceLinesPath(networkId),
          method: 'GET',
        }),
        transformResponse: ({
          serviceLines,
        }: {
          serviceLines: DomainServiceLine[];
        }) => serviceLines,
      }
    ),
    patchNetworkStates: builder.mutation<
      string[],
      PatchNetworkStatesDomainPayload
    >({
      query: ({ network_id, state_abbrs }) => ({
        url: buildNetworkStatesPath(network_id),
        method: 'PATCH',
        body: { state_abbrs },
      }),
      transformResponse: ({ state_abbrs }: { state_abbrs: string[] }) =>
        state_abbrs,
    }),
    getNetworkAppointmentTypes: builder.query<
      DomainNetworkAppointmentType[],
      string | number
    >({
      query: (networkId) => ({
        url: buildNetworkAppointmentTypesPath(networkId),
        method: 'GET',
      }),
      transformResponse: ({
        appointmentTypes,
      }: {
        appointmentTypes: DomainNetworkAppointmentType[];
      }) => appointmentTypes,
    }),
    patchNetworkAppointmentTypes: builder.mutation<
      void,
      PathInsuranceNetworkAppointmentTypesPayload
    >({
      query: ({ networkId, appointmentTypes }) => ({
        url: buildNetworkAppointmentTypesPath(networkId),
        method: 'PATCH',
        body: { appointmentTypes },
      }),
    }),
  }),
});

export const domainSelectNetworkCreditCardRules = (
  networkId: NetworkIdSelectQuery
) => networksSlice.endpoints.getNetworkCreditCardRules.select(networkId);

export const domainSelectNetworkServiceLines = (
  networkId: NetworkIdSelectQuery
) => networksSlice.endpoints.getNetworkServiceLines.select(networkId);

export const selectNetworksDomain = (payload: SearchInsuranceNetworkPayload) =>
  networksSlice.endpoints.searchNetworksList.select(payload);

export const domainSelectNetwork = (networkId: NetworkIdSelectQuery) =>
  networksSlice.endpoints.getNetwork.select(networkId);

export const domainSelectNetworkAppointmentTypes = (
  networkId: NetworkIdSelectQuery
) => networksSlice.endpoints.getNetworkAppointmentTypes.select(networkId);

export const {
  useSearchNetworksListQuery,
  useGetNetworkQuery,
  useCreateNetworkMutation,
  usePatchNetworkMutation,
  useGetNetworkCreditCardRulesQuery,
  useGetNetworkServiceLinesQuery,
  useLazyGetNetworkCreditCardRulesQuery,
  useLazyGetNetworkServiceLinesQuery,
  usePatchNetworkCreditCardRulesMutation,
  useGetNetworkAppointmentTypesQuery,
  usePatchNetworkAppointmentTypesMutation,
} = networksSlice;
