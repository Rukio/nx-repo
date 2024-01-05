import { Pagination, TimeOfDay, ServiceDate, Provider } from './common';

export interface LeaderHubMarketMetrics {
  marketId: string;
  onSceneTimeMedianSeconds: number;
  onSceneTimeWeekChangeSeconds: number;
  chartClosureRate: number;
  chartClosureRateWeekChange: number;
  surveyCaptureRate: number;
  surveyCaptureRateWeekChange: number;
  netPromoterScoreAverage: number;
  netPromoterScoreWeekChange: number;
  marketName: string;
  surveyCaptureRateRank: string;
  marketShortName: string;
}

export interface LeaderHubMarketMetricsResponse {
  marketMetrics: LeaderHubMarketMetrics;
}

export type LeaderHubMarketProviderMetrics = {
  marketId: string;
  providerId: string;
  onSceneTimeMedianSeconds: number;
  onSceneTimeWeekChangeSeconds: number;
  onSceneTimeRank: string;
  chartClosureRate: number;
  chartClosureRateWeekChange: number;
  chartClosureRateRank: string;
  surveyCaptureRate: number;
  surveyCaptureRateWeekChange: number;
  surveyCaptureRateRank: string;
  netPromoterScoreAverage: number;
  netPromoterScoreWeekChange: number;
  netPromoterScoreRank: string;
  onTaskPercent: number;
  onTaskPercentWeekChange: number;
  onTaskPercentRank: string;
  totalProviders: string;
};

export type LeaderHubProviderMetricsResponse = {
  marketProviderMetrics: LeaderHubMarketProviderMetrics;
};

export type LeaderHubProviderMetricsParams = {
  marketId: string | number;
  providerId: string | number;
};

export type LeaderHubIndividualProviderMetricsResponse = {
  providerMetrics: LeaderHubIndividualProviderMetrics;
};

export type LeaderHubIndividualProviderMetrics = {
  provider: Provider;
  onSceneTimeMedianSeconds: number;
  chartClosureRate: number;
  surveyCaptureRate: number;
  netPromoterScoreAverage: number;
  onTaskPercent: number;
  escalationRate: number;
  abxPrescribingRate: number;
};

export type LeaderHubIndividualProviderLatestVisit = {
  careRequestId: string;
  providerId: string;
  patientAthenaId: string;
  patientFirstName: string;
  patientLastName: string;
  serviceDate: ServiceDate;
  chiefComplaint: string;
  diagnosis: string;
  isAbxPrescribed: boolean;
  abxDetails: string;
  isEscalated: boolean;
  escalatedReason: string;
};

export type LeaderHubIndividualProviderVisitsParams = {
  providerId: string;
  page: number;
  searchText: string;
  isAbxPrescribed?: boolean;
  isEscalated?: boolean;
};

export type LeaderHubIndividualProviderVisitsQueryParams = {
  id: string;
  page: number;
  search_text: string;
  is_abx_prescribed?: boolean;
  is_escalated?: boolean;
};

export type LeaderHubIndividualProviderVisitsResponse = {
  providerVisits: LeaderHubIndividualProviderLatestVisit[];
  pagination: Pagination;
};

export type LeaderHubProviderShiftsQuery = {
  id: string | number;
  page: string | number;
  sort_order: string | number;
  from_timestamp?: string;
};

export interface LeaderHubIndividualProviderShifts {
  enRouteDurationSeconds: number;
  endTime: TimeOfDay;
  idleDurationSeconds: number;
  onBreakDurationSeconds: number;
  onSceneDurationSeconds: number;
  outTheDoorDurationSeconds: number;
  patientsSeen: number;
  providerId: string;
  serviceDate: ServiceDate;
  shiftTeamId: string;
  startTime: TimeOfDay;
}

export interface LeaderHubProviderShiftsResponse {
  providerShifts: LeaderHubIndividualProviderShifts[];
  pagination: Pagination;
}
