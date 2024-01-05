import { LeaderHubMetricsData } from '../../types';
import { MARKET_ID } from '../marketOverallMetricsSlice';

export const MARKET_PROVIDER_METRICS: LeaderHubMetricsData[] = [
  {
    marketId: '192',
    providerId: '113475',
    onSceneTimeMedianSeconds: 34,
    onSceneTimeWeekChangeSeconds: 2,
    onSceneTimeRank: '2',
    chartClosureRate: 95.54,
    chartClosureRateWeekChange: 1.62,
    chartClosureRateRank: '2',
    surveyCaptureRate: 76.06,
    surveyCaptureRateWeekChange: 1.02,
    surveyCaptureRateRank: '8',
    netPromoterScoreAverage: 95.29,
    netPromoterScoreWeekChange: 2.88,
    netPromoterScoreRank: '2',
    onTaskPercent: 72.37,
    onTaskPercentWeekChange: -2.82,
    onTaskPercentRank: '11',
    provider: {
      id: 0,
      firstName: 'Benjamin',
      lastName: 'Jones',
      avatarUrl:
        '/uploads/provider_profile/provider_image/3431/tiny_1655150617-Ben_Jones.jpg',
      profile: {
        position: 'APP',
        credentials: '',
      },
    },
  },
  {
    marketId: '192',
    providerId: '116527',
    onSceneTimeMedianSeconds: 33,
    onSceneTimeWeekChangeSeconds: 0,
    onSceneTimeRank: '1',
    chartClosureRate: 95.49,
    chartClosureRateWeekChange: 4.34,
    chartClosureRateRank: '3',
    surveyCaptureRate: 81.15,
    surveyCaptureRateWeekChange: 2.61,
    surveyCaptureRateRank: '5',
    netPromoterScoreAverage: 82.31,
    netPromoterScoreWeekChange: 0.71,
    netPromoterScoreRank: '8',
    onTaskPercent: 82.61,
    onTaskPercentWeekChange: -3.28,
    onTaskPercentRank: '6',
    provider: {
      id: 0,
      firstName: 'Hollie',
      lastName: 'Johnson',
      avatarUrl: '',
      profile: {
        position: 'APP',
        credentials: '',
      },
    },
  },
  {
    marketId: '192',
    providerId: '116528',
    onSceneTimeMedianSeconds: undefined,
    onSceneTimeWeekChangeSeconds: undefined,
    onSceneTimeRank: '1',
    chartClosureRate: 95.49,
    chartClosureRateWeekChange: 4.34,
    chartClosureRateRank: '3',
    surveyCaptureRate: 81.15,
    surveyCaptureRateWeekChange: 2.61,
    surveyCaptureRateRank: '5',
    netPromoterScoreAverage: 82.31,
    netPromoterScoreWeekChange: 0.71,
    netPromoterScoreRank: '8',
    onTaskPercent: 82.61,
    onTaskPercentWeekChange: -3.28,
    onTaskPercentRank: '6',
    provider: {
      id: 0,
      firstName: 'Hollie',
      lastName: 'Johnson',
      avatarUrl: '',
      profile: {
        position: 'APP',
        credentials: '',
      },
    },
  },
];

export const MOCK_PROVIDER_METRICS_RESPONSE = {
  marketProviderMetrics: MARKET_PROVIDER_METRICS,
  pagination: {
    totalItems: 500,
    totalPages: 50,
    currentPage: 1,
  },
};

export const MOCK_MARKET_PROVIDERS_PARAMS = {
  market_id: 200,
  search_text: '',
  page: '1',
  provider_job_title: 'APP',
};

export const LEADS_MARKET_PROVIDER_METRICS = {
  marketId: '185',
  providerId: '115732',
  onSceneTimeMedianSeconds: 41,
  onSceneTimeWeekChangeSeconds: -2,
  onSceneTimeRank: '4',
  chartClosureRate: 69.08,
  chartClosureRateWeekChange: -4.88,
  chartClosureRateRank: '13',
  surveyCaptureRate: 85.54,
  surveyCaptureRateWeekChange: -3.31,
  surveyCaptureRateRank: '6',
  netPromoterScoreAverage: 88.32,
  netPromoterScoreWeekChange: -3.95,
  netPromoterScoreRank: '5',
  onTaskPercent: 75.06,
  onTaskPercentWeekChange: -2.35,
  onTaskPercentRank: '13',
  totalProviders: '13',
};

export const MOCK_PROVIDER_LEADER_HUB_METRICS_RESPONSE = {
  marketProviderMetrics: LEADS_MARKET_PROVIDER_METRICS,
};

export const MOCK_PROVIDER_LEADER_HUB_METRICS_PARAMS = {
  marketId: MARKET_ID,
  providerId: 115732,
};

export const MOCK_PROVIDER_ID = 113475;
