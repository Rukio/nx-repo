import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { selectAuthToken } from '@*company-data-covered*/auth0/data-access';
import { RootState } from '../../store';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;
export const ATHENA_CREDICT_CARD_FORM_API_SLICE_KEY = 'athenaCredictCardForm';

export enum AthenaCreditCardFormApiSliceTag {
  CreditCards = 'CreditCards',
}

export const athenaCreditCardFormApiSlice = createApi({
  reducerPath: ATHENA_CREDICT_CARD_FORM_API_SLICE_KEY,
  tagTypes: [AthenaCreditCardFormApiSliceTag.CreditCards],
  baseQuery: fetchBaseQuery({
    baseUrl: serviceURL,
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState() as RootState);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: () => ({}),
});

export const { middleware } = athenaCreditCardFormApiSlice;
