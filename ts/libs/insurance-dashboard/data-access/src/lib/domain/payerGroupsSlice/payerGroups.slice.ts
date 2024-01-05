import { insuranceDashboardApiSlice } from '../apiSlice';
import { DomainInsurancePayerGroup } from '../../types';

export const PAYER_GROUPS_API_PATH = 'payer_groups';

export const payerGroupsSlice = insuranceDashboardApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayerGroups: builder.query<DomainInsurancePayerGroup[], void>({
      query: () => PAYER_GROUPS_API_PATH,
      transformResponse: ({
        payerGroups,
      }: {
        payerGroups: DomainInsurancePayerGroup[];
      }) => payerGroups,
    }),
  }),
});

export const selectPayerGroups =
  payerGroupsSlice.endpoints.getPayerGroups.select();

export const { useGetPayerGroupsQuery, useLazyGetPayerGroupsQuery } =
  payerGroupsSlice;
