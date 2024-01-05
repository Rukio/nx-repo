import { SkipToken } from '@reduxjs/toolkit/query';
import { insuranceDashboardApiSlice } from '../apiSlice';
import { DomainInsurancePayer, PayersQuery } from '../../types';

export const PAYERS_API_PATH = 'payers';

export type PatchInsurancePayerPayload = Omit<
  DomainInsurancePayer,
  'createdAt' | 'updatedAt' | 'insuranceNetworks' | 'stateAbbrs'
>;
export type InsurancePayerRequestDataPayload = Omit<
  PatchInsurancePayerPayload,
  'id'
>;

export type IdSelectQuery = string | number | SkipToken;

export const payersSlice = insuranceDashboardApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayers: builder.query<DomainInsurancePayer[], PayersQuery | void>({
      query: (query) => ({
        url: PAYERS_API_PATH,
        params: query || undefined,
      }),
      transformResponse: ({ payers }: { payers: DomainInsurancePayer[] }) =>
        payers,
    }),
    getPayer: builder.query<DomainInsurancePayer, string | number>({
      query: (id) => `${PAYERS_API_PATH}/${id}`,
      transformResponse: ({ payer }: { payer: DomainInsurancePayer }) => payer,
    }),
    createPayer: builder.mutation<
      DomainInsurancePayer,
      InsurancePayerRequestDataPayload
    >({
      query: (payload) => ({
        url: PAYERS_API_PATH,
        method: 'POST',
        body: payload,
      }),
    }),
    patchPayer: builder.mutation<
      DomainInsurancePayer,
      PatchInsurancePayerPayload
    >({
      query: ({ id, ...payerDetails }) => ({
        url: `${PAYERS_API_PATH}/${id}`,
        method: 'PATCH',
        body: payerDetails,
      }),
    }),
    deletePayer: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `${PAYERS_API_PATH}/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const selectPayer = (payerId: IdSelectQuery) =>
  payersSlice.endpoints.getPayer.select(payerId);

export const selectPayersDomain = (query?: PayersQuery) =>
  payersSlice.endpoints.getPayers.select(query);

export const {
  useCreatePayerMutation,
  useGetPayerQuery,
  useGetPayersQuery,
  useLazyGetPayersQuery,
  useLazyGetPayerQuery,
  usePatchPayerMutation,
  useDeletePayerMutation,
} = payersSlice;
