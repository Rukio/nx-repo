import { Provider } from './common';

export enum MetricsDataStatus {
  UNSPECIFIED = 'STATUS_UNSPECIFIED',
  OK = 'STATUS_OK',
  NOT_ENOUGH_CARE_REQUESTS = 'STATUS_NOT_ENOUGH_COMPLETED_CARE_REQUESTS',
}

export interface ProviderMetrics {
  careRequestsCompletedLastSevenDays: number;
  createdAt: string;
  updatedAt?: string;
  changeDays: number;
  chartClosureRate?: number | null;
  chartClosureRateChange?: number | null;
  lastCareRequestCompletedAt?: string;
  averageNetPromoterScore?: number | null;
  averageNetPromoterScoreChange?: number | null;
  medianOnSceneTimeSecs?: number | null;
  medianOnSceneTimeSecsChange?: number | null;
  surveyCaptureRate?: number | null;
  surveyCaptureRateChange?: number | null;
  completedCareRequests: number;
  errorMessage?: string;
  status: MetricsDataStatus;
}

export interface MarketMetrics {
  providerMetrics: {
    provider: Provider;
    metrics: ProviderMetrics;
  }[];
}
