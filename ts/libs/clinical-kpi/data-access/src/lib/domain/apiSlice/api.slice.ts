import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../../store';
import { selectAuthAccessToken } from '../../feature';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;
export const CLINICAL_KPI_API_SLICE_KEY = 'clinicalKpi';

export const clinicalKpiApiSlice = createApi({
  reducerPath: CLINICAL_KPI_API_SLICE_KEY,
  baseQuery: fetchBaseQuery({
    baseUrl: serviceURL,
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthAccessToken(getState() as RootState);
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');

      return headers;
    },
  }),
  endpoints: () => ({}),
});

export const { middleware } = clinicalKpiApiSlice;
