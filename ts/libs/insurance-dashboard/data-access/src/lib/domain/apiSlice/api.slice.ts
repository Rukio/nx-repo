import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { selectAuthToken } from '@*company-data-covered*/auth0/data-access';
import { RootState } from '../../store';
import { environment } from '../../../environments/environment';
import { generateQuery } from '../../utils/generator';
import { API_CACHE_TAGS } from '../../utils/constants';

const { serviceURL } = environment;
export const INSURANCE_DASHBOARD_API_SLICE_KEY = 'insuranceDashboard';

export const insuranceDashboardApiSlice = createApi({
  reducerPath: INSURANCE_DASHBOARD_API_SLICE_KEY,
  tagTypes: [
    API_CACHE_TAGS.NetworkCreditCardRules,
    API_CACHE_TAGS.NetworkModalityConfigs,
  ],
  baseQuery: fetchBaseQuery({
    baseUrl: serviceURL,
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState() as RootState);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
    paramsSerializer: generateQuery,
  }),
  endpoints: () => ({}),
});

export const { middleware } = insuranceDashboardApiSlice;
