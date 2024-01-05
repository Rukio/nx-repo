import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { SerializedError } from '@reduxjs/toolkit';

export interface Modality {
  id: number;
  type: string;
  displayName: string;
}

export type ModalityError = FetchBaseQueryError | SerializedError;

export interface MarketModalityConfig {
  id?: number;
  marketId: number;
  serviceLineId: number;
  modalityId: number;
}

export interface ModalityConfig {
  id?: number;
  marketId: number;
  serviceLineId: number;
  insurancePlanId: number;
  modalityId: number;
}
export interface ModalitiesConfigurationState {
  marketsModalityConfigs?: MarketModalityConfig[];
  modalityConfigs?: ModalityConfig[];
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  showSuccessMessage: boolean;
  error?: ModalityError;
}
