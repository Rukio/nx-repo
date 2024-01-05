import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { selectAuthToken } from '@*company-data-covered*/auth0/data-access';
import { RootState } from '../../store';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

export const PATIENT_PORTAL_API_SLICE_KEY = 'patientPortal';

export const patientPortalApiSlice = createApi({
  reducerPath: PATIENT_PORTAL_API_SLICE_KEY,
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

export const { middleware } = patientPortalApiSlice;
