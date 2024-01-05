import {
  SelectZipCodeDetailsQuery,
  SelectMarketQuery,
  domainSelectZipCodeDetails,
  selectMarket as domainSelectMarketDetails,
} from '@*company-data-covered*/station/data-access';
import { createSelector } from '@reduxjs/toolkit';
import { toMarketDetails, toZipCodeDetails } from '../../utils';

export const selectZipCodeDetails = (query: SelectZipCodeDetailsQuery) =>
  createSelector(
    domainSelectZipCodeDetails(query),
    ({ isError, isLoading, error, data, isSuccess }) => ({
      isError,
      isLoading,
      error,
      isSuccess,
      zipCodeDetails: toZipCodeDetails(data),
    })
  );

export const selectMarketDetails = (query: SelectMarketQuery) =>
  createSelector(
    domainSelectMarketDetails(query),
    ({ isError, isLoading, error, data, isSuccess }) => ({
      isError,
      isLoading,
      error,
      isSuccess,
      marketDetails: toMarketDetails(data),
    })
  );
