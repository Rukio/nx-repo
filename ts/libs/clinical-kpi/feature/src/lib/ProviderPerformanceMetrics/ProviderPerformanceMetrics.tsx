import { useSelector } from 'react-redux';
import {
  useAppDispatch,
  useGetProviderLeaderHubMetricsQuery,
  useGetProviderMarketsQuery,
  selectSelectedMarketId,
  setMarketId,
  selectIndividualPerformancePosition,
  ProfilePosition,
} from '@*company-data-covered*/clinical-kpi/data-access';
import {
  DefaultAlert,
  IndividualMetric,
  MetricsSection,
  ProviderMarketsDropdown,
} from '@*company-data-covered*/clinical-kpi/ui';
import {
  Box,
  Grid,
  makeSxStyles,
  Skeleton,
} from '@*company-data-covered*/design-system';
import { PERFORMANCE_TEST_IDS } from '../PerformanceContainer';
import { getNumericMetricValue } from '../util/metricUtils';
import { useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { PROVIDER_PERFORMANCE_METRICS_TEST_IDS } from './testIds';
import { appConfiguration, dhmtConfiguration } from './constants';

const makeStyles = () =>
  makeSxStyles({
    metricsContainer: {
      width: '100%',
      pt: 3,
      pb: 1,
    },
    placeholder: {
      height: '100%',
    },
  });

export type ProviderPerformanceMetricsProps = {
  providerId: string;
};

const ProviderPerformanceMetrics = ({
  providerId,
}: ProviderPerformanceMetricsProps) => {
  const dispatch = useAppDispatch();
  const {
    data: markets,
    isLoading: isLoadingMarkets,
    isError: isErrorMarkets,
  } = useGetProviderMarketsQuery(providerId);
  const styles = makeStyles();
  const { selectedMarketId } = useSelector(selectSelectedMarketId);

  useEffect(() => {
    if (!selectedMarketId && markets?.length) {
      dispatch(setMarketId({ selectedMarketId: markets[0].id.toString() }));
    }
  }, [markets, dispatch, selectedMarketId]);

  const handleMarketChange = (marketId: string) => {
    dispatch(setMarketId({ selectedMarketId: marketId.toString() }));
  };

  const {
    data: providerLeaderHubMetrics,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useGetProviderLeaderHubMetricsQuery(
    selectedMarketId
      ? {
          marketId: selectedMarketId,
          providerId,
        }
      : skipToken
  );
  const isError =
    isErrorMetrics ||
    isErrorMarkets ||
    ((!providerLeaderHubMetrics || !markets) &&
      !isLoadingMetrics &&
      !isLoadingMarkets);

  const position = useSelector(selectIndividualPerformancePosition);
  const configuration =
    position === ProfilePosition.Dhmt ? dhmtConfiguration : appConfiguration;

  return (
    <MetricsSection
      testIdPrefix={PERFORMANCE_TEST_IDS.SECTION}
      title="Performance Per Market:"
      titleColor="initial"
      variant="h5"
      select={
        <Box ml={2}>
          {selectedMarketId && markets && (
            <ProviderMarketsDropdown
              markets={markets}
              onChange={handleMarketChange}
              selectedMarketId={selectedMarketId}
            />
          )}
        </Box>
      }
    >
      {isError ? (
        <DefaultAlert dataTestId={PERFORMANCE_TEST_IDS.DEFAULT_ERROR_ALERT} />
      ) : (
        <Grid container spacing={{ xs: 2 }} sx={styles.metricsContainer}>
          {configuration.map((metric) => (
            <Grid key={metric.type} xs={3} sm={3} item sx={{ minHeight: 182 }}>
              {isLoadingMetrics || isLoadingMarkets ? (
                <Skeleton
                  variant="rectangular"
                  data-testid={PROVIDER_PERFORMANCE_METRICS_TEST_IDS.getMetricSkeleton(
                    metric.type
                  )}
                  sx={styles.placeholder}
                />
              ) : (
                providerLeaderHubMetrics && (
                  <IndividualMetric
                    key={metric.type}
                    type={metric.type}
                    value={getNumericMetricValue(
                      providerLeaderHubMetrics[metric.valueKey],
                      metric.type
                    )}
                    valueChange={getNumericMetricValue(
                      providerLeaderHubMetrics[metric.valueChangeKey],
                      metric.type
                    )}
                    rank={providerLeaderHubMetrics[metric.metricsValueRankKeys]}
                    totalProviders={providerLeaderHubMetrics?.totalProviders}
                    testIdPrefix={metric.type}
                  />
                )
              )}
            </Grid>
          ))}
        </Grid>
      )}
    </MetricsSection>
  );
};

export default ProviderPerformanceMetrics;
