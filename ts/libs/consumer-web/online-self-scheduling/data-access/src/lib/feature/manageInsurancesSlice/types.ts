import { OnlineSelfSchedulingError } from '../../types';

export type InsurancesState = {
  insuranceId?: string;
  insuranceEligibility?: string;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: OnlineSelfSchedulingError | null;
  isLoaded: boolean;
};
