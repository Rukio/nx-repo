import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { SerializedError } from '@reduxjs/toolkit';

type QueryResponse =
  | { data: unknown }
  | { error: FetchBaseQueryError | SerializedError };

export const isFetchBaseQueryError = (
  response: QueryResponse
): response is { error: FetchBaseQueryError } => {
  return 'error' in response && 'status' in response.error;
};

export const isSerializedError = (
  response: QueryResponse
): response is { error: SerializedError } => {
  return 'error' in response && !isFetchBaseQueryError(response);
};

export const isQueryErrorResponse = (
  response: QueryResponse
): response is { error: FetchBaseQueryError | SerializedError } => {
  return isFetchBaseQueryError(response) || isSerializedError(response);
};
