import {
  MARKET_PROVIDER_METRICS,
  Metrics as MarketMetrics,
} from '@*company-data-covered*/clinical-kpi/data-access';
import {
  LeaderHubMetricsChangeKeys,
  LeaderHubMetricsKeys,
  LeaderHubMetricsRankKeys,
} from '../../constants';
import {
  BuildLeaderHubProvidersRankingParams,
  buildProvidersLeaderHubRanking,
} from './util';
import {
  getNumericMetricValue,
  getValidMetricValue,
} from '../../util/metricUtils';

describe('buildProvidersLeaderHubRanking', () => {
  const testCases = [
    {
      type: MarketMetrics.OnSceneTime,
      key: LeaderHubMetricsKeys.OnSceneTime,
      changeKey: LeaderHubMetricsChangeKeys.OnSceneTime,
      rankKey: LeaderHubMetricsRankKeys.OnSceneTime,
      expectedLength: 3,
    },
    {
      type: MarketMetrics.ChartClosure,
      key: LeaderHubMetricsKeys.ChartClosure,
      changeKey: LeaderHubMetricsChangeKeys.ChartClosure,
      rankKey: LeaderHubMetricsRankKeys.ChartClosure,
      expectedLength: 3,
    },
  ];

  test.each(testCases)(
    'should correctly use the provided metrics and keys',
    ({ type, key, changeKey, rankKey, expectedLength }) => {
      const mockParams: BuildLeaderHubProvidersRankingParams = {
        metrics: MARKET_PROVIDER_METRICS,
        key,
        changeKey,
        type,
        rankKey,
      };
      const { rankTableProviders } = buildProvidersLeaderHubRanking(mockParams);

      expect(rankTableProviders).toHaveLength(expectedLength);

      rankTableProviders.forEach((rankTable, index) => {
        const metricEntry = MARKET_PROVIDER_METRICS[index];
        expect(rankTable.rank).toBe(parseInt(metricEntry[rankKey], 10));
        expect(rankTable.value).toBe(
          getValidMetricValue(type, metricEntry[key])
        );
        expect(rankTable.valueChange).toBe(
          getNumericMetricValue(metricEntry[changeKey], type)
        );
      });
    }
  );

  it('should return correct object when metrics is null', () => {
    const mockParams = {
      metrics: undefined,
      key: LeaderHubMetricsKeys.OnSceneTime,
      changeKey: LeaderHubMetricsChangeKeys.OnSceneTime,
      authenticatedUserId: '2',
      type: MarketMetrics.OnSceneTime,
      rankKey: LeaderHubMetricsRankKeys.OnSceneTime,
    };
    const { rankTableProviders } = buildProvidersLeaderHubRanking(mockParams);
    expect(rankTableProviders).toEqual([]);
  });
});
