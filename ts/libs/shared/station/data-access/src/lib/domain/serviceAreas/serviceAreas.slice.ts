import { defaultSerializeQueryArgs, SkipToken } from '@reduxjs/toolkit/query';
import { ServiceAreaAvailability } from '../../types';
import { stationApiSlice } from '../api.slice';

export const SERVICE_AREAS_BASE_PATH = '/api/service_areas';
export const SERVICE_AREAS_ZIPCODE_SEGMENT = '/zipcode';
export const SERVICE_AREAS_CLIENT_TIME_SEGMENT = '/client_time';

export type ServiceAreaAvailabilityQuery = {
  zipcode: string | number;
  clientTime: string;
};

export const getServiceAreaAvailabilityURL = (
  zipcode: string | number,
  clientTime: string
) =>
  `${SERVICE_AREAS_BASE_PATH}${SERVICE_AREAS_ZIPCODE_SEGMENT}/${zipcode}${SERVICE_AREAS_CLIENT_TIME_SEGMENT}/${clientTime}`;

export const serviceAreasSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getServiceAreaAvailability: builder.query<
      ServiceAreaAvailability,
      ServiceAreaAvailabilityQuery
    >({
      query: ({ zipcode, clientTime }) =>
        getServiceAreaAvailabilityURL(zipcode, clientTime),
      // Since the `clientTime` parameter must include seconds, it's not available to select previously cached data.
      // To prevent repeatedly fetching data every time the data is selected from RTK query, the `serializeQueryArgs` method was overridden to not cache data by "clientTime" arg
      serializeQueryArgs: ({ queryArgs, ...restEndpointOptions }) => {
        return defaultSerializeQueryArgs({
          queryArgs: {
            ...queryArgs,
            clientTime: undefined,
          },
          ...restEndpointOptions,
        });
      },
    }),
  }),
});

export const selectServiceAreaAvailability = (
  query: ServiceAreaAvailabilityQuery | SkipToken
) => serviceAreasSlice.endpoints.getServiceAreaAvailability.select(query);

export const { useGetServiceAreaAvailabilityQuery } = serviceAreasSlice;
