import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { SerializedError } from '@reduxjs/toolkit';
import { getErrorMessageFromResponse } from './response';

const mockedFetchBaseQueryWithDataError: FetchBaseQueryError = {
  status: 'CUSTOM_ERROR',
  error: 'Something went wrong',
  data: {
    message: 'Something went wrong',
  },
};
const mockedFetchBaseQueryWithNoMessage: FetchBaseQueryError = {
  status: 'CUSTOM_ERROR',
  error: 'Something went wrong',
  data: null,
};
const mockedSerializedError: SerializedError = {
  name: 'Fetch error',
  message: 'Something went wrong',
};
const mockedSerializedErrorNoMessage: SerializedError = {
  name: 'Fetch error',
};

describe('utils response', () => {
  describe('getErrorMessageFromResponse', () => {
    it('should return response error message because of isSerializedError', () => {
      const serializedErrorMessage = getErrorMessageFromResponse({
        error: mockedSerializedError,
      });
      expect(serializedErrorMessage).toEqual(mockedSerializedError.message);
    });

    it('should return response error message because of isFetchBaseQueryError', () => {
      const fetchBaseQueryErrorResponseMessage = getErrorMessageFromResponse({
        error: mockedFetchBaseQueryWithDataError,
      });
      expect(fetchBaseQueryErrorResponseMessage).toEqual(
        (<{ message: string }>mockedFetchBaseQueryWithDataError.data).message
      );
    });

    it('should return no error message', () => {
      const dataResponse = getErrorMessageFromResponse({ data: 'success' });
      expect(dataResponse).toBeFalsy();

      const fetchBaseQueryErrorResponseNoMessage = getErrorMessageFromResponse({
        error: mockedFetchBaseQueryWithNoMessage,
      });
      expect(fetchBaseQueryErrorResponseNoMessage).toEqual('');

      const serializedErrorNoData = getErrorMessageFromResponse({
        error: mockedSerializedErrorNoMessage,
      });
      expect(serializedErrorNoData).toEqual('');
    });
  });
});
