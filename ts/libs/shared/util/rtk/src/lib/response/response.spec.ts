import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { SerializedError } from '@reduxjs/toolkit';

import {
  isFetchBaseQueryError,
  isSerializedError,
  isQueryErrorResponse,
} from './response';

const mockedFetchBaseQueryError: FetchBaseQueryError = {
  status: 'FETCH_ERROR',
  error: 'Something went wrong',
};
const mockedSerializedError: SerializedError = {
  name: 'Fetch error',
  message: 'Something went wrong',
};

describe('response utils', () => {
  describe('isFetchBaseQueryError', () => {
    it('should return that response contains FetchBaseQueryError error', () => {
      const res = isFetchBaseQueryError({ error: mockedFetchBaseQueryError });
      expect(res).toBeTruthy();
    });

    it('should return that error does not contain FetchBaseQuery error', () => {
      const serializedErrorResponse = isFetchBaseQueryError({
        error: mockedSerializedError,
      });
      expect(serializedErrorResponse).toBeFalsy();

      const dataResponse = isFetchBaseQueryError({ data: 'success' });
      expect(dataResponse).toBeFalsy();
    });
  });

  describe('isSerializedError', () => {
    it('should return that response contains SerializedError error', () => {
      const res = isSerializedError({ error: mockedSerializedError });
      expect(res).toBeTruthy();
    });

    it('should return that error does not contain SerializedError error', () => {
      const fetchBaseQueryErrorResponse = isSerializedError({
        error: mockedFetchBaseQueryError,
      });
      expect(fetchBaseQueryErrorResponse).toBeFalsy();

      const dataResponse = isSerializedError({ data: 'success' });
      expect(dataResponse).toBeFalsy();
    });
  });

  describe('isQueryErrorResponse', () => {
    it('should return that response contains error', () => {
      const serializedErrorResponse = isQueryErrorResponse({
        error: mockedSerializedError,
      });
      expect(serializedErrorResponse).toBeTruthy();

      const fetchBaseQueryErrorResponse = isFetchBaseQueryError({
        error: mockedFetchBaseQueryError,
      });
      expect(fetchBaseQueryErrorResponse).toBeTruthy();
    });

    it('should return that error does not contain error', () => {
      const dataResponse = isFetchBaseQueryError({ data: 'success' });
      expect(dataResponse).toBeFalsy();
    });
  });
});
