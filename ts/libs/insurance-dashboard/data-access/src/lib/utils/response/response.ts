import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { SerializedError } from '@reduxjs/toolkit';
import {
  isFetchBaseQueryError,
  isSerializedError,
} from '@*company-data-covered*/shared/util/rtk';

type QueryResponse =
  | { data: unknown }
  | { error: FetchBaseQueryError | SerializedError };

export const getErrorMessageFromResponse = (
  response: QueryResponse
): string => {
  let errorMessage = '';

  if (isFetchBaseQueryError(response)) {
    errorMessage = (<{ message: string }>response.error.data)?.message || '';
  } else if (isSerializedError(response)) {
    errorMessage = response.error.message || '';
  }

  return errorMessage;
};
