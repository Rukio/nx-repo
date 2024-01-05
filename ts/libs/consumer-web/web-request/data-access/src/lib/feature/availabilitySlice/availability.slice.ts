import { createSelector } from '@reduxjs/toolkit';
import { SkipToken } from '@reduxjs/toolkit/query';
import {
  ServiceAreaAvailabilityQuery,
  selectServiceAreaAvailability,
  useGetServiceAreaAvailabilityQuery,
} from '@*company-data-covered*/station/data-access';

export const selectAddressAvailability = (
  query: ServiceAreaAvailabilityQuery | SkipToken
) =>
  createSelector(
    selectServiceAreaAvailability(query),
    ({ isError, isSuccess, data }) => ({
      isAddressAvailabilityError: isError,
      isAddressAvailabilityClosed: isSuccess && !data,
      isAddressAvailabilityOpen: isSuccess && data,
    })
  );

export { useGetServiceAreaAvailabilityQuery };
