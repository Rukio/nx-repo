import { createSelector } from '@reduxjs/toolkit';
import {
  SelectMarketsAvailabilityZipCodeQuery,
  domainSelectMarketsAvailabilityZipCode,
  useGetMarketsAvailabilityZipCodeQuery,
} from '../../domain';

export const selectMarketAvailability = (
  query: SelectMarketsAvailabilityZipCodeQuery
) =>
  createSelector(
    domainSelectMarketsAvailabilityZipCode(query),
    ({ isLoading, isError, isSuccess, data }) => ({
      isMarketAvailabilityLoading: isLoading,
      isMarketAvailabilityError: isError,
      isMarketAvailabilityClosed: isSuccess && !data,
      isMarketAvailabilityOpen: isSuccess && !!data,
    })
  );

export const selectMarketAvailabilityDetails = (
  query: SelectMarketsAvailabilityZipCodeQuery
) =>
  createSelector(domainSelectMarketsAvailabilityZipCode(query), ({ data }) => ({
    marketAvailabilityDetails: data,
  }));

export { useGetMarketsAvailabilityZipCodeQuery };
