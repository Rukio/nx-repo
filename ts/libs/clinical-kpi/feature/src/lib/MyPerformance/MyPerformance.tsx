import { useSelector } from 'react-redux';
import statsig from 'statsig-js';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { Grid, makeSxStyles } from '@*company-data-covered*/design-system';
import { IndividualMetric } from '@*company-data-covered*/clinical-kpi/ui';
import {
  MetricsDataStatus,
  selectAuthenticatedUser,
  selectAuthenticatedUserPosition,
  useGetLatestMetricsForProviderQuery,
} from '@*company-data-covered*/clinical-kpi/data-access';

import PerformanceContainer, {
  IndividualMetricConfiguration,
} from '../PerformanceContainer';
import {
  chartClosureConfiguration,
  STATSIG_KEYS,
  MetricsGoalKeys,
  npsConfiguration,
  onSceneTimeConfiguration,
  ProviderPosition,
  surveyCaptureConfiguration,
} from '../constants';
import { getNumericMetricValue } from '../util/metricUtils';

const dhmtConfiguration: IndividualMetricConfiguration[] = [
  onSceneTimeConfiguration,
  surveyCaptureConfiguration,
  npsConfiguration,
];

export const appConfiguration: IndividualMetricConfiguration[] = [
  onSceneTimeConfiguration,
  chartClosureConfiguration,
  npsConfiguration,
];

const makeStyles = () =>
  makeSxStyles({
    metricContainer: {
      width: '100%',
    },
    infoIcon: {
      color: 'green',
    },
    defaultAlertContainer: {
      display: 'flex',
      marginY: 4,
    },
    defaultText: {
      marginLeft: 2,
    },
  });

const MyPerformance = () => {
  const styles = makeStyles();
  const { value: metricsGoals } = statsig.getConfig(
    STATSIG_KEYS.DYNAMIC_CONFIGS.METRICS
  );

  const { userPosition } = useSelector(selectAuthenticatedUserPosition);
  const metricsConfiguration =
    userPosition === ProviderPosition.DHMT
      ? dhmtConfiguration
      : appConfiguration;

  const { data: user } = useSelector(selectAuthenticatedUser);
  const {
    data: metrics,
    isLoading,
    isError,
  } = useGetLatestMetricsForProviderQuery(user?.id ?? skipToken);

  return (
    <PerformanceContainer
      title="My Performance"
      isLoading={isLoading}
      isError={isError || !metrics || metrics.status !== MetricsDataStatus.OK}
      errorMessage={metrics?.errorMessage}
    >
      {metrics &&
        metricsConfiguration.map((metric, index) => (
          <Grid
            item
            sm={4}
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
              possessiveOfMetric="your"
            />
          </Grid>
        ))}
    </PerformanceContainer>
  );
};

export default MyPerformance;
