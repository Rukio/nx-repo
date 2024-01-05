import { SkipToken } from '@reduxjs/toolkit/dist/query';
import {
  athenaCreditCardFormApiSlice,
  AthenaCreditCardFormApiSliceTag,
} from '../apiSlice';
import {
  CreatePaymentRequestDataPayload,
  DomainSavedCreditCardData,
  DeleteCreditCardRequestDataPayload,
  DomainDeleteCreditCardResult,
  DomainPayment,
  SaveCreditCardRequestDataPayload,
  DomainCreditCard,
  CreditCardsQuery,
} from '../../types/patients';

export const PATIENTS_PATH = 'patients';

export const PAYMENT_SEGMENT = '/payment';
export const CREDIT_CARD_SEGMENT = '/credit-card';
export const CREDIT_CARDS_SEGMENT = '/credit-cards';

export const getCreatePaymentURL = (patientId: string) =>
  `${PATIENTS_PATH}/${patientId}${PAYMENT_SEGMENT}`;

export const getSaveCreditCardURL = (patientId: string) =>
  `${PATIENTS_PATH}/${patientId}${CREDIT_CARD_SEGMENT}`;

export const getCreditCardsURL = (patientId: string) =>
  `${PATIENTS_PATH}/${patientId}${CREDIT_CARDS_SEGMENT}`;

export const getDeleteCreditCardURL = (
  patientId: string,
  creditCardId: string
) => `${PATIENTS_PATH}/${patientId}${CREDIT_CARD_SEGMENT}/${creditCardId}`;

export const patientsSlice = athenaCreditCardFormApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPayment: builder.mutation<
      DomainPayment,
      CreatePaymentRequestDataPayload
    >({
      query: ({ patientId, ...paymentPayload }) => ({
        url: getCreatePaymentURL(patientId),
        method: 'POST',
        body: paymentPayload,
      }),
    }),
    saveCreditCard: builder.mutation<
      DomainSavedCreditCardData,
      SaveCreditCardRequestDataPayload
    >({
      query: ({ patientId, ...creditCardPayload }) => ({
        url: getSaveCreditCardURL(patientId),
        method: 'POST',
        body: creditCardPayload,
      }),
    }),
    getCreditCards: builder.query<DomainCreditCard[], CreditCardsQuery>({
      query: ({ patientId, departmentId }) => ({
        url: getCreditCardsURL(patientId),
        params: { departmentId },
      }),
      transformResponse: ({
        creditCards,
      }: {
        creditCards: DomainCreditCard[];
      }) => creditCards,
      providesTags: [AthenaCreditCardFormApiSliceTag.CreditCards],
    }),
    deleteCreditCard: builder.mutation<
      DomainDeleteCreditCardResult,
      DeleteCreditCardRequestDataPayload
    >({
      query: ({ patientId, creditCardId, departmentId }) => ({
        url: getDeleteCreditCardURL(patientId, creditCardId),
        params: { departmentId },
        method: 'DELETE',
      }),
      invalidatesTags: [AthenaCreditCardFormApiSliceTag.CreditCards],
    }),
  }),
});

export type SelectCreditCardsQuery = CreditCardsQuery | SkipToken;

export const selectCreditCards = (query: SelectCreditCardsQuery) =>
  patientsSlice.endpoints.getCreditCards.select(query);

export const {
  useCreatePaymentMutation,
  useSaveCreditCardMutation,
  useGetCreditCardsQuery,
  useDeleteCreditCardMutation,
} = patientsSlice;
