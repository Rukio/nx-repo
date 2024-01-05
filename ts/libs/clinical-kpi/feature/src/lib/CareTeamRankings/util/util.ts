import { LeaderHubMetricsData } from '@*company-data-covered*/clinical-kpi/data-access';
import {
  LeaderHubMetricsChangeKeys,
  LeaderHubMetricsKeys,
  LeaderHubMetricsRankKeys,
} from '../../constants';
import {
  getNumericMetricValue,
  getValidMetricValue,
} from '../../util/metricUtils';
import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';

export type LeaderHubRankTableRow = {
  id: number;
  rank: number;
  name: string;
  value?: number;
  valueChange: number;
  position?: string;
};

export type BuildLeaderHubProvidersRankingParams = {
  metrics?: LeaderHubMetricsData[];
  key: LeaderHubMetricsKeys;
  changeKey: LeaderHubMetricsChangeKeys;
  type: Metrics;
  rankKey: LeaderHubMetricsRankKeys;
};

type LeaderHubRankingsData = {
  rankTableProviders: LeaderHubRankTableRow[];
};

const formatLeaderHubProviderData = (
  metric: LeaderHubMetricsData,
  key: LeaderHubMetricsKeys,
  changeKey: LeaderHubMetricsChangeKeys,
  rankKey: LeaderHubMetricsRankKeys,
  type: Metrics
): LeaderHubRankTableRow | null => {
  const value = metric[key];
  const valueChange = metric[changeKey];
  const provider = metric.provider;
  const rank = metric[rankKey];

  return {
    id: Number(metric.providerId),
    name: `${provider.firstName} ${provider.lastName}`,
    rank: parseInt(rank, 10),
    value: getValidMetricValue(type, value),
    valueChange: getNumericMetricValue(valueChange, type),
    position: provider.profile.position,
  };
};

export const buildProvidersLeaderHubRanking = ({
  metrics: marketMetrics,
  key,
  changeKey,
  type,
  rankKey,
}: BuildLeaderHubProvidersRankingParams): LeaderHubRankingsData => {
  if (!marketMetrics) {
    return {
      rankTableProviders: [],
    };
  }

  return {
    rankTableProviders: marketMetrics
      .map((metric) =>
        formatLeaderHubProviderData(metric, key, changeKey, rankKey, type)
      )
      .filter(
        (formattedProvider): formattedProvider is LeaderHubRankTableRow =>
          formattedProvider !== null
      ),
  };
};
