import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { SerializedError } from '@reduxjs/toolkit';
import { isFetchBaseQueryError } from '@*company-data-covered*/shared/util/rtk';

export type CareRequestErrorsData = { errors: Record<string, string[]> };

export const isCareRequestErrorsData = (
  data: unknown
): data is CareRequestErrorsData => {
  return !!data && typeof data === 'object' && 'errors' in data;
};

export const getErrorResponseMessages = (response: {
  error: FetchBaseQueryError | SerializedError;
}): string[] => {
  if (
    isFetchBaseQueryError(response) &&
    isCareRequestErrorsData(response.error.data)
  ) {
    return Object.values(response.error.data.errors).reduce(
      (acc, curr) => [...acc, ...curr],
      []
    );
  }

  return [];
};
