import { SkipToken } from '@reduxjs/toolkit/query';
import { onlineSelfSchedulingApiSlice } from '../apiSlice';
import {
  MarketsAvailabilityZipCodeQuery,
  DomainMarketsAvailabilityZipCode,
} from '../../types';

export type SelectMarketsAvailabilityZipCodeQuery =
  | MarketsAvailabilityZipCodeQuery
  | SkipToken;

export const MARKETS_AVAILABILITY_API_PATH = 'markets-availability';

export const ZIPCODE_SEGMENT = '/zipcode';

export const buildZipcodePath = () =>
  `${MARKETS_AVAILABILITY_API_PATH}${ZIPCODE_SEGMENT}`;

export const marketsAvailabilitySlice =
  onlineSelfSchedulingApiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getMarketsAvailabilityZipCode: builder.query<
        DomainMarketsAvailabilityZipCode,
        MarketsAvailabilityZipCodeQuery
      >({
        query: ({ zipCode }) => ({
          url: buildZipcodePath(),
          params: { zipcode: zipCode },
        }),
        transformResponse: ({
          data,
        }: {
          data: DomainMarketsAvailabilityZipCode;
        }) => data,
      }),
    }),
  });

export const domainSelectMarketsAvailabilityZipCode =
  marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.select;

export const { useGetMarketsAvailabilityZipCodeQuery } =
  marketsAvailabilitySlice;
