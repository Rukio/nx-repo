import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query';
import { NetworkModalityConfigWithOptionalId } from '../../types';

export type NetworkModalitiesError = FetchBaseQueryError | SerializedError;

export interface ManageNetworkModalitiesState {
  configs: NetworkModalityConfigWithOptionalId[];
  filterableConfigs: NetworkModalityConfigWithOptionalId[];
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: NetworkModalitiesError;
}
