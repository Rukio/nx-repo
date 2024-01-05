import { SkipToken } from '@reduxjs/toolkit/query';
import { ZipCodeDetails } from '../../types';
import { stationApiSlice } from '../api.slice';

export const ZIP_CODES_BASE_PATH = '/api/zipcodes';

export type ZipCodeDetailsQuery = {
  zipCode: string | number;
};

export type SelectZipCodeDetailsQuery = ZipCodeDetailsQuery | SkipToken;

export const zipCodesSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getZipCodeDetails: builder.query<ZipCodeDetails, ZipCodeDetailsQuery>({
      query: ({ zipCode }) => ({
        url: ZIP_CODES_BASE_PATH,
        params: { zipcode: zipCode },
      }),
    }),
  }),
});

export const domainSelectZipCodeDetails = (query: SelectZipCodeDetailsQuery) =>
  zipCodesSlice.endpoints.getZipCodeDetails.select(query);

export const { useGetZipCodeDetailsQuery } = zipCodesSlice;
