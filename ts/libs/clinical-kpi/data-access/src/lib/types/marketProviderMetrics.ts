import { Provider, Market } from './common';

interface MarketProviderMetricsPagination {
  total: string;
  page: number;
  totalPages: number;
}

export interface LeaderHubMetricsData {
  marketId: string;
  providerId: string;
  onSceneTimeMedianSeconds?: number;
  onSceneTimeWeekChangeSeconds?: number;
  onSceneTimeRank: string;
  chartClosureRate?: number;
  chartClosureRateWeekChange?: number;
  chartClosureRateRank: string;
  surveyCaptureRate?: number;
  surveyCaptureRateWeekChange?: number;
  surveyCaptureRateRank: string;
  netPromoterScoreAverage?: number;
  netPromoterScoreWeekChange?: number;
  netPromoterScoreRank: string;
  onTaskPercent?: number;
  onTaskPercentWeekChange?: number;
  onTaskPercentRank: string;
  provider: Provider;
}

export interface MarketProviderMetrics {
  marketProviderMetrics: LeaderHubMetricsData[];
  pagination: MarketProviderMetricsPagination;
}

export interface MarketProviderMetricsParams {
  market_id?: number | string;
  sort_by?: string;
  search_text?: string;
  provider_job_title?: string;
  page?: string;
  per_page?: string;
}

export interface ProviderMarketResponse {
  markets: Market[];
}
