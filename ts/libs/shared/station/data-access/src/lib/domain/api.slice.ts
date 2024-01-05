import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';
import { AuthState } from '@*company-data-covered*/auth0/data-access';
import { environment } from '../../environments/environment';

export const STATION_API_SLICE_KEY = 'station';

export const stationApiSlice = createApi({
  reducerPath: STATION_API_SLICE_KEY,
  baseQuery: fetchBaseQuery({
    baseUrl: environment.stationURL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth?: AuthState }).auth?.authToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/vnd.*company-data-covered*.com; version=1');
      headers.set('Content-Type', 'application/json');

      return headers;
    },
  }),
  endpoints: () => ({}),
});
