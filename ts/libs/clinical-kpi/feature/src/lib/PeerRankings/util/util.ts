import {
  Market,
  AuthenticatedUser,
  MarketMetrics,
  ProviderMetrics,
  Provider as ProviderData,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import {
  MetricsKeys,
  MetricsChangeKeys,
  ProviderPosition,
} from '../../constants';
import { Provider, RankingsData, SortOrder } from '../types';
import {
  formatProviderPosition,
  getNumericMetricValue,
  isValidMetricValue,
} from '../../util/metricUtils';

type BuildProvidersRankingParams = {
  metrics: MarketMetrics | undefined;
  key: MetricsKeys;
  changeKey: MetricsChangeKeys;
  sortOrder: SortOrder;
  authenticatedUserId: AuthenticatedUser['id'];
  includedProviderPositions?: ProviderPosition[];
  type: Metrics;
};

type FormatProviderParams = {
  provider: ProviderData;
  metrics: ProviderMetrics;
  key: MetricsKeys;
  changeKey: MetricsChangeKeys;
  includedProviderPositions?: ProviderPosition[];
  type: Metrics;
};

export type LeaderHubRankTable = {
  id: number;
  rank: number;
  name: string;
  value: number;
  valueChange: number;
  position?: string;
};

type FormattedProvider = Omit<Provider, 'rank'>;

type GroupedByValuesProviders = FormattedProvider[];

type ProviderValue = number;

export const isValidProviderPosition = (
  position: string
): position is ProviderPosition => {
  switch (position) {
    case ProviderPosition.APP:
    case ProviderPosition.DHMT:
      return true;
    default:
      return false;
  }
};

export const getFormattedProviderData = ({
  provider,
  metrics,
  key,
  changeKey,
  includedProviderPositions,
  type,
}: FormatProviderParams): FormattedProvider | null => {
  const { position } = provider.profile;
  const value = metrics[key];
  const valueChange = metrics[changeKey];

  const isPositionIncluded =
    includedProviderPositions &&
    includedProviderPositions.length !== 0 &&
    isValidProviderPosition(position)
      ? includedProviderPositions.includes(position)
      : true;

  if (
    metrics &&
    isValidMetricValue(value) &&
    isValidMetricValue(valueChange) &&
    isPositionIncluded
  ) {
    return {
      id: provider.id,
      name: `${provider.firstName} ${provider.lastName}`,
      value: getNumericMetricValue(value, type),
      valueChange: getNumericMetricValue(valueChange, type),
      avatarUrl: provider.avatarUrl ?? '',
      position: formatProviderPosition(provider.profile?.position),
    };
  }

  return null;
};

// TODO: [PT-1162] refactor PeerRankings feature by moving transformation function to the feature slice as selector
export const buildProvidersRanking = ({
  metrics: marketMetrics,
  key,
  changeKey,
  sortOrder,
  authenticatedUserId,
  includedProviderPositions,
  type,
}: BuildProvidersRankingParams): RankingsData => {
  if (!marketMetrics?.providerMetrics) {
    return {
      marqueeLeaderProviders: {
        firstPosition: [],
        secondPosition: [],
        thirdPosition: [],
      },
      rankTableProviders: [],
    };
  }
  const groupedProvidersData = marketMetrics.providerMetrics
    .reduce<[ProviderValue, GroupedByValuesProviders][]>(
      (acc, providerMetric) => {
        const formattedProvider = getFormattedProviderData({
          provider: providerMetric.provider,
          metrics: providerMetric.metrics,
          key: key,
          changeKey: changeKey,
          includedProviderPositions,
          type,
        });

        if (!formattedProvider) {
          return acc;
        }

        const existingProviderIndex = acc.findIndex(
          ([key]) => key === formattedProvider.value
        );

        if (existingProviderIndex !== -1) {
          acc[existingProviderIndex][1].push(formattedProvider);
        } else {
          acc.push([formattedProvider.value, [formattedProvider]]);
        }

        return acc;
      },
      []
    )
    .sort(([providerValueA], [providerValueB]) => {
      if (sortOrder === SortOrder.ASC) {
        return providerValueA - providerValueB;
      }

      return providerValueB - providerValueA;
    })
    .map<[number, Provider[]]>(([providerValue, groupedProviders], index) => {
      const groupedProvidersWithRank = groupedProviders.map<Provider>(
        (provider) => ({
          ...provider,
          rank: index + 1,
        })
      );

      return [providerValue, groupedProvidersWithRank];
    });

  const groupedProvidersArray = groupedProvidersData.map(
    ([, groupedProviders]) => groupedProviders
  );

  const [firstPosition, secondPosition, thirdPosition, ...tableElements] =
    groupedProvidersArray;

  const currentProviderData = groupedProvidersArray
    .flat()
    .find((row) => row.id.toString() === authenticatedUserId);

  return {
    currentProviderData,
    marqueeLeaderProviders: {
      firstPosition: firstPosition || [],
      secondPosition: secondPosition || [],
      thirdPosition: thirdPosition || [],
    },
    rankTableProviders: tableElements.flat().map((row) => ({
      ...row,
      name: row.id.toString() === authenticatedUserId ? row.name : '',
    })),
  };
};

export const getDefaultSelectedMarket = (
  markets: Market[]
): string | undefined => {
  if (!markets.length) {
    return undefined;
  }

  return markets[0].id;
};
