import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  EmojiEventsIcon,
  makeSxStyles,
  Tabs,
  TabPanel,
  Tab,
  TabContext,
  Alert,
} from '@*company-data-covered*/design-system';
import {
  selectAuthenticatedUserPosition,
  selectSelectedMarketId,
  setMarketId,
  useAppDispatch,
  useGetLatestMetricsByMarketQuery,
  selectAuthenticatedUserId,
  selectAuthenticatedUserSortedMarkets,
  Market,
} from '@*company-data-covered*/clinical-kpi/data-access';
import {
  MarketsDropdown,
  Metrics,
  MetricsSection,
} from '@*company-data-covered*/clinical-kpi/ui';
import { PEER_RANKINGS_TEST_IDS } from './TestIds';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import {
  ProviderPosition,
  appTabsConfiguration,
  dhmtTabsConfiguration,
} from '../constants';
import {
  OnSceneTime,
  ChartClosureRate,
  PatientNPS,
  SurveyCaptureRate,
} from './components';
import { getDefaultSelectedMarket } from './util';

const makeStyles = () =>
  makeSxStyles({
    tabsWrapper: {
      my: 2,
    },
    dropdownContainer: {
      mt: 4,
      mb: 1.5,
    },
    tabPanelWrapper: {
      p: 0,
    },
    alert: {
      marginTop: 3,
      borderRadius: 0,
    },
  });

export const ALERT_ERROR_TEXT = `Content failed to load. Please refresh the page.`;
export const ALERT_NO_INFO_TEXT = `No metrics found. Please try another market.`;

export const buildAlertMessage = (
  markets: Market[],
  selectedMarketId: string | undefined
): string => {
  const selectedMarketName = markets.find(
    (market) => market.id === selectedMarketId
  )?.name;

  if (selectedMarketName === undefined) {
    return ALERT_NO_INFO_TEXT;
  }

  return `No metrics found for the ${
    markets.length === 1
      ? selectedMarketName
      : `${selectedMarketName}. Please try another market.`
  }`;
};

const PeerRankings = () => {
  const styles = makeStyles();
  const dispatch = useAppDispatch();
  // TODO: [PT-1162] refactor PeerRankings feature by storing this in feature slice
  const [tabSelected, setTabSelected] = useState<Metrics>(Metrics.OnSceneTime);
  const { markets = [] } = useSelector(selectAuthenticatedUserSortedMarkets);
  const { selectedMarketId } = useSelector(selectSelectedMarketId);

  const { userId = '' } = useSelector(selectAuthenticatedUserId);
  const { userPosition } = useSelector(selectAuthenticatedUserPosition);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: Metrics) => {
    setTabSelected(newValue);
  };

  useEffect(() => {
    const defaultMarketId = getDefaultSelectedMarket(markets);

    const isSelectedMarketValid =
      selectedMarketId &&
      markets.find((market) => market.id === selectedMarketId);

    if (defaultMarketId && !isSelectedMarketValid) {
      dispatch(setMarketId({ selectedMarketId: defaultMarketId }));
    }
  }, [markets, dispatch, selectedMarketId]);

  const tabsConfiguration = useMemo(() => {
    return userPosition === ProviderPosition.DHMT
      ? dhmtTabsConfiguration
      : appTabsConfiguration;
  }, [userPosition]);

  const {
    data: metricsByMarket,
    isLoading: isLoadingMetricsByMarket,
    isError: isErrorMetricsByMarket,
  } = useGetLatestMetricsByMarketQuery(selectedMarketId ?? skipToken);

  const handleMarketChange = (marketId: string) => {
    dispatch(setMarketId({ selectedMarketId: marketId }));
  };

  const renderPeerRankingsTable = () => {
    if (isErrorMetricsByMarket) {
      return (
        <Alert
          sx={styles.alert}
          color="error"
          severity="error"
          message={ALERT_ERROR_TEXT}
        />
      );
    }
    if (
      !isLoadingMetricsByMarket &&
      (!metricsByMarket?.providerMetrics ||
        !metricsByMarket?.providerMetrics.length)
    ) {
      return (
        <Alert
          sx={styles.alert}
          color="warning"
          severity="warning"
          message={buildAlertMessage(markets, selectedMarketId)}
        />
      );
    }

    return (
      <TabContext value={tabSelected}>
        <Box sx={styles.tabsWrapper}>
          <Tabs
            value={tabSelected}
            allowScrollButtonsMobile
            variant="scrollable"
            onChange={handleTabChange}
          >
            {tabsConfiguration.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                data-testid={tab.dataTestId}
              />
            ))}
          </Tabs>
        </Box>
        <TabPanel
          sx={styles.tabPanelWrapper}
          id={Metrics.OnSceneTime}
          aria-labelledby={Metrics.OnSceneTime}
          value={Metrics.OnSceneTime}
        >
          <OnSceneTime
            metrics={metricsByMarket}
            authenticatedUserId={userId}
            isLoading={isLoadingMetricsByMarket}
          />
        </TabPanel>
        <TabPanel
          sx={styles.tabPanelWrapper}
          id={Metrics.ChartClosure}
          aria-labelledby={Metrics.ChartClosure}
          value={Metrics.ChartClosure}
        >
          <ChartClosureRate
            metrics={metricsByMarket}
            authenticatedUserId={userId}
            isLoading={isLoadingMetricsByMarket}
          />
        </TabPanel>
        <TabPanel
          sx={styles.tabPanelWrapper}
          id={Metrics.NPS}
          aria-labelledby={Metrics.NPS}
          value={Metrics.NPS}
        >
          <PatientNPS
            metrics={metricsByMarket}
            authenticatedUserId={userId}
            isLoading={isLoadingMetricsByMarket}
          />
        </TabPanel>
        <TabPanel
          sx={styles.tabPanelWrapper}
          id={Metrics.SurveyCapture}
          aria-labelledby={Metrics.SurveyCapture}
          value={Metrics.SurveyCapture}
        >
          <SurveyCaptureRate
            metrics={metricsByMarket}
            authenticatedUserId={userId}
            isLoading={isLoadingMetricsByMarket}
          />
        </TabPanel>
      </TabContext>
    );
  };

  return (
    <MetricsSection
      testIdPrefix={PEER_RANKINGS_TEST_IDS.SECTION_PREFIX}
      icon={<EmojiEventsIcon color="primary" />}
      title="Peer Rankings"
    >
      <>
        {markets.length > 1 && (
          <Box sx={styles.dropdownContainer}>
            <MarketsDropdown
              selectedMarketId={selectedMarketId ?? markets[0].id}
              onMarketChange={handleMarketChange}
              markets={markets}
            />
          </Box>
        )}
        {renderPeerRankingsTable()}
      </>
    </MetricsSection>
  );
};

export default PeerRankings;
