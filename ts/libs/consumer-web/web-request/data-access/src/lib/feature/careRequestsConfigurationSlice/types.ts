import { CareRequestParams } from '@*company-data-covered*/consumer-web-types';
import { SerializedError } from '@reduxjs/toolkit';

export type CareRequestResult = {
  success: boolean;
  statsigCareRequestId: string;
};

export type CreateCareRequestPayload = CareRequestParams;

export interface CareRequestsConfigurationState {
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: SerializedError;
  careRequestResult?: CareRequestResult;
}
