import {
  ProviderMetrics,
  MarketMetrics,
  ProviderProfile,
  MetricsDataStatus,
} from '../../types';

export const mockedProviderMetrics: ProviderMetrics = {
  changeDays: 1,
  createdAt: '2023-01-09T12:00:00.000Z',
  updatedAt: '2023-02-09T12:00:00.000Z',
  careRequestsCompletedLastSevenDays: 2,
  chartClosureRate: 3,
  chartClosureRateChange: 4,
  lastCareRequestCompletedAt: '2023-01-11T22:00:00.000Z',
  averageNetPromoterScore: 5,
  averageNetPromoterScoreChange: 6,
  medianOnSceneTimeSecs: 120,
  medianOnSceneTimeSecsChange: 10,
  surveyCaptureRate: 9,
  surveyCaptureRateChange: 10,
  completedCareRequests: 100,
  status: MetricsDataStatus.OK,
  errorMessage: undefined,
};

export const providerProfile: ProviderProfile = {
  credentials: 'np',
  position: 'emt',
};

export const mockedMarketMetrics: MarketMetrics = {
  providerMetrics: [
    {
      provider: {
        id: 1,
        firstName: 'Jack',
        lastName: 'Samura',
        avatarUrl: 'avatar.jpg',
        profile: providerProfile,
      },
      metrics: mockedProviderMetrics,
    },
    {
      provider: {
        id: 2,
        firstName: 'Jack',
        lastName: 'Samura 1',
        avatarUrl: 'avatar.jpg',
        profile: providerProfile,
      },
      metrics: {
        ...mockedProviderMetrics,
        careRequestsCompletedLastSevenDays: 3,
        chartClosureRate: 4,
        chartClosureRateChange: 5,
        averageNetPromoterScore: 6,
        averageNetPromoterScoreChange: 7,
        medianOnSceneTimeSecs: 121,
        medianOnSceneTimeSecsChange: 11,
        surveyCaptureRate: 10,
        surveyCaptureRateChange: 11,
        completedCareRequests: 101,
      },
    },
    {
      provider: {
        id: 3,
        firstName: 'Jack',
        lastName: 'Samura 2',
        avatarUrl: 'avatar.jpg',
        profile: providerProfile,
      },
      metrics: {
        ...mockedProviderMetrics,
        careRequestsCompletedLastSevenDays: 5,
        chartClosureRate: 7,
        chartClosureRateChange: 2,
        averageNetPromoterScore: 9,
        averageNetPromoterScoreChange: 71,
        medianOnSceneTimeSecs: 124,
        medianOnSceneTimeSecsChange: 14,
        surveyCaptureRate: 14,
        surveyCaptureRateChange: 11,
        completedCareRequests: 111,
      },
    },
  ],
};
