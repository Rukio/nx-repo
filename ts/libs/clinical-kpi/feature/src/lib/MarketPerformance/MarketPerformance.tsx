import statsig from 'statsig-js';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { makeSxStyles, Grid } from '@*company-data-covered*/design-system';
import { IndividualMetric, Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import {
  selectSelectedMarketId,
  useGetMarketLeaderHubMetricsQuery,
} from '@*company-data-covered*/clinical-kpi/data-access';
import {
  STATSIG_KEYS,
  LeaderHubMetricsChangeKeys,
  LeaderHubMetricsKeys,
  MetricsGoalKeys,
} from '../constants';

import PerformanceContainer from '../PerformanceContainer';
import { getNumericMetricValue } from '../util/metricUtils';
import { useSelector } from 'react-redux';

interface LeaderHubMarketMetricConfiguration {
  type: Metrics;
  key: Exclude<LeaderHubMetricsKeys, LeaderHubMetricsKeys.OnTaskPercent>;
  changeKey: Exclude<
    LeaderHubMetricsChangeKeys,
    LeaderHubMetricsChangeKeys.OnTaskPercent
  >;
}

const onSceneTimeConfiguration: LeaderHubMarketMetricConfiguration = {
  type: Metrics.OnSceneTime,
  key: LeaderHubMetricsKeys.OnSceneTime,
  changeKey: LeaderHubMetricsChangeKeys.OnSceneTime,
};
const npsConfiguration: LeaderHubMarketMetricConfiguration = {
  type: Metrics.NPS,
  key: LeaderHubMetricsKeys.NPS,
  changeKey: LeaderHubMetricsChangeKeys.NPS,
};

const surveyCaptureConfiguration: LeaderHubMarketMetricConfiguration = {
  type: Metrics.SurveyCapture,
  key: LeaderHubMetricsKeys.SurveyCapture,
  changeKey: LeaderHubMetricsChangeKeys.SurveyCapture,
};

const chartClosureConfiguration: LeaderHubMarketMetricConfiguration = {
  type: Metrics.ChartClosure,
  key: LeaderHubMetricsKeys.ChartClosure,
  changeKey: LeaderHubMetricsChangeKeys.ChartClosure,
};

const marketConfiguration: LeaderHubMarketMetricConfiguration[] = [
  onSceneTimeConfiguration,
  surveyCaptureConfiguration,
  chartClosureConfiguration,
  npsConfiguration,
];

const makeStyles = () =>
  makeSxStyles({
    metricContainer: {
      width: '100%',
    },
  });

const MarketPerformance = () => {
  const styles = makeStyles();
  const { selectedMarketId } = useSelector(selectSelectedMarketId);

  const {
    data: metrics,
    isLoading,
    isError,
  } = useGetMarketLeaderHubMetricsQuery(selectedMarketId ?? skipToken);

  const { value: metricsGoals } = statsig.getConfig(
    STATSIG_KEYS.DYNAMIC_CONFIGS.METRICS
  );

  return (
    <PerformanceContainer
      title="Market Performance"
      isLoading={isLoading}
      isError={isError || !metrics}
    >
      {metrics &&
        marketConfiguration.map((metric, index) => (
          <Grid
            item
            sm={3}
            sx={styles.metricContainer}
            key={`${metric.type}-${index}`}
          >
            <IndividualMetric
              type={metric.type}
              value={getNumericMetricValue(metrics[metric.key], metric.type)}
              valueChange={getNumericMetricValue(
                metrics[metric.changeKey],
                metric.type
              )}
              goal={metricsGoals[MetricsGoalKeys[metric.type]]}
              testIdPrefix={metric.type}
              possessiveOfMetric={"the Market's"}
            />
          </Grid>
        ))}
    </PerformanceContainer>
  );
};

export default MarketPerformance;
