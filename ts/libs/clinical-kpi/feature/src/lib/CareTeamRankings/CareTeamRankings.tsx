import {
  LeaderHubMetricsKeys,
  LeaderHubMetricsChangeKeys,
  LeaderHubMetricsRankKeys,
  dhmtTabsConfiguration,
  appTabsConfiguration,
} from '../constants';
import { useNavigate } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';
import { useSelector } from 'react-redux';
import {
  selectSelectedMarketId,
  useGetLatestMetricsByMarketQuery,
  useGetMarketProviderMetricsQuery,
  Metrics,
  selectCareTeamRankingsParams,
  setSearchText,
  setCurrentPage,
  useAppDispatch,
  setTabSelected,
  selectCareTeamRankingsTabSelected,
  ProfilePosition,
  selectSelectedPositionName,
  selectSearchText,
} from '@*company-data-covered*/clinical-kpi/data-access';
import {
  Box,
  EmojiEventsIcon,
  makeSxStyles,
  Tab,
  TabContext,
  TabPanel,
  Tabs,
  Pagination,
} from '@*company-data-covered*/design-system';
import {
  CareTeamRankTableRow,
  MetricsSection,
} from '@*company-data-covered*/clinical-kpi/ui';
import { LeaderHubPeerRankingTable } from './components';
import * as React from 'react';
import { CARE_TEAM_RANKINGS_TEST_IDS } from './TestIds';

const makeStyles = () =>
  makeSxStyles({
    tabPanelWrapper: {
      p: 0,
    },
    tabsWrapper: {
      my: 2,
    },
    dropdownContainer: {
      mt: 4,
      mb: 1.5,
    },
    pagination: (theme) => ({
      margin: `${theme.spacing()} 0 ${theme.spacing()} auto`,
      width: 'fit-content',
    }),
  });

const CareTeamRankings = () => {
  const styles = makeStyles();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const marketProviderMetricsParams = useSelector(selectCareTeamRankingsParams);
  const selectedTab = useSelector(selectCareTeamRankingsTabSelected);
  const selectedPositionName = useSelector(selectSelectedPositionName);
  const searchText = useSelector(selectSearchText);
  const { selectedMarketId } = useSelector(selectSelectedMarketId);

  const onRowClick = (rowId: CareTeamRankTableRow['id']) => {
    navigate(`/leads/providers/${rowId}`);
  };

  const { isLoading: isLoadingMetricsByMarket } =
    useGetLatestMetricsByMarketQuery(selectedMarketId ?? skipToken);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: Metrics) => {
    dispatch(setTabSelected({ tabSelected: newValue }));
  };

  const { data: metrics } = useGetMarketProviderMetricsQuery(
    marketProviderMetricsParams
  );

  const handleSearch = (value: string) => {
    dispatch(setSearchText({ searchText: value }));
  };

  const handlePaginationChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    dispatch(setCurrentPage({ page }));
  };

  const renderPeerRankingsLeaderHubTable = () => {
    const { marketProviderMetrics: providerMetrics, pagination } =
      metrics || {};

    if (!providerMetrics || !pagination) {
      return null;
    }

    const leaderHubConfigurations =
      selectedPositionName === ProfilePosition.App
        ? appTabsConfiguration
        : dhmtTabsConfiguration;

    return (
      <>
        <TabContext value={selectedTab}>
          <Box sx={styles.tabsWrapper}>
            <Tabs
              value={selectedTab}
              allowScrollButtonsMobile
              variant="scrollable"
              onChange={handleTabChange}
            >
              {leaderHubConfigurations.map((tab) => (
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
            <LeaderHubPeerRankingTable
              metrics={providerMetrics}
              isLoading={isLoadingMetricsByMarket}
              searchText={searchText}
              handleSearch={handleSearch}
              onRowClick={onRowClick}
              valueKey={LeaderHubMetricsKeys.OnSceneTime}
              changeKey={LeaderHubMetricsChangeKeys.OnSceneTime}
              type={Metrics.OnSceneTime}
              rankKey={LeaderHubMetricsRankKeys.OnSceneTime}
            />
          </TabPanel>
          <TabPanel
            sx={styles.tabPanelWrapper}
            id={Metrics.SurveyCapture}
            aria-labelledby={Metrics.SurveyCapture}
            value={Metrics.SurveyCapture}
          >
            <LeaderHubPeerRankingTable
              metrics={providerMetrics}
              isLoading={isLoadingMetricsByMarket}
              searchText={searchText}
              handleSearch={handleSearch}
              onRowClick={onRowClick}
              valueKey={LeaderHubMetricsKeys.SurveyCapture}
              changeKey={LeaderHubMetricsChangeKeys.SurveyCapture}
              type={Metrics.SurveyCapture}
              rankKey={LeaderHubMetricsRankKeys.SurveyCapture}
            />
          </TabPanel>
          <TabPanel
            sx={styles.tabPanelWrapper}
            id={Metrics.ChartClosure}
            aria-labelledby={Metrics.ChartClosure}
            value={Metrics.ChartClosure}
          >
            <LeaderHubPeerRankingTable
              metrics={providerMetrics}
              isLoading={isLoadingMetricsByMarket}
              searchText={searchText}
              handleSearch={handleSearch}
              onRowClick={onRowClick}
              valueKey={LeaderHubMetricsKeys.ChartClosure}
              changeKey={LeaderHubMetricsChangeKeys.ChartClosure}
              type={Metrics.ChartClosure}
              rankKey={LeaderHubMetricsRankKeys.ChartClosure}
            />
          </TabPanel>
          <TabPanel
            sx={styles.tabPanelWrapper}
            id={Metrics.NPS}
            aria-labelledby={Metrics.NPS}
            value={Metrics.NPS}
          >
            <LeaderHubPeerRankingTable
              metrics={providerMetrics}
              isLoading={isLoadingMetricsByMarket}
              searchText={searchText}
              handleSearch={handleSearch}
              onRowClick={onRowClick}
              valueKey={LeaderHubMetricsKeys.NPS}
              changeKey={LeaderHubMetricsChangeKeys.NPS}
              type={Metrics.NPS}
              rankKey={LeaderHubMetricsRankKeys.NPS}
            />
          </TabPanel>
        </TabContext>
        {pagination.totalPages !== 0 && (
          <Pagination
            data-testid={CARE_TEAM_RANKINGS_TEST_IDS.PAGINATION}
            sx={styles.pagination}
            page={pagination.page}
            onChange={handlePaginationChange}
            count={pagination.totalPages}
          />
        )}
      </>
    );
  };

  return (
    <MetricsSection
      testIdPrefix={CARE_TEAM_RANKINGS_TEST_IDS.SECTION_PREFIX}
      icon={<EmojiEventsIcon color="primary" />}
      title="Care Team Rankings"
    >
      {renderPeerRankingsLeaderHubTable()}
    </MetricsSection>
  );
};

export default CareTeamRankings;
