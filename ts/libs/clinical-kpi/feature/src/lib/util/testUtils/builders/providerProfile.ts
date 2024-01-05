import {
  mockedProviderMetrics,
  Provider,
  ProviderMetrics,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { buildProviderProfileAPP } from '../../../PeerRankings/testUtils/testUtil';

export const generateIncrementalMockedProviderMetrics = (
  previousValue: number
): ProviderMetrics => {
  const newValue = previousValue + 1;

  return {
    ...mockedProviderMetrics,
    careRequestsCompletedLastSevenDays: 3,
    chartClosureRate: newValue,
    chartClosureRateChange: newValue,
    averageNetPromoterScore: newValue,
    averageNetPromoterScoreChange: newValue,
    medianOnSceneTimeSecs: newValue,
    medianOnSceneTimeSecsChange: newValue,
    surveyCaptureRate: newValue,
    surveyCaptureRateChange: newValue,
    completedCareRequests: newValue,
  };
};

export const buildProvider = (
  id: string,
  initialProvider?: Provider
): Provider =>
  initialProvider || {
    id: Number(id),
    firstName: 'Jack',
    lastName: 'Samura',
    avatarUrl: 'avatar.jpg',
    profile: buildProviderProfileAPP(),
  };
