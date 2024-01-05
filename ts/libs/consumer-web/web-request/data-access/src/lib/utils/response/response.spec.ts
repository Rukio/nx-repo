import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import {
  getErrorResponseMessages,
  isCareRequestErrorsData,
  CareRequestErrorsData,
} from './response';

const mockedFetchBaseQueryError: FetchBaseQueryError = {
  status: 'FETCH_ERROR',
  error: 'Something went wrong',
};

const mockCareRequestErrorsData: CareRequestErrorsData = {
  errors: {
    base: ['Test error'],
  },
};

describe('utils response', () => {
  describe('isCareRequestErrorsData', () => {
    it('should return that response contains error', () => {
      const careRequestErrors = isCareRequestErrorsData(
        mockCareRequestErrorsData
      );
      expect(careRequestErrors).toBeTruthy();
    });

    it('should return that error does not contain error', () => {
      const dataResponse = isCareRequestErrorsData({ error: 'test' });
      expect(dataResponse).toBeFalsy();
    });
  });

  describe('getErrorResponseMessages', () => {
    it('should return empty array if response does not contain errors', () => {
      const serializedErrorResponse = getErrorResponseMessages({
        error: mockedFetchBaseQueryError,
      });
      expect(serializedErrorResponse).toStrictEqual([]);
    });

    it('should return error messages if response contains custom errors', () => {
      const serializedErrorResponse = getErrorResponseMessages({
        error: {
          status: 'CUSTOM_ERROR',
          error: 'Error',
          data: mockCareRequestErrorsData,
        },
      });
      expect(serializedErrorResponse).toStrictEqual(
        mockCareRequestErrorsData.errors['base']
      );
    });
  });
});
