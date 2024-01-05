import { useEffect } from 'react';
import { Container, Grid, makeSxStyles } from '@*company-data-covered*/design-system';
import { HEADER_HEIGHT } from '@*company-data-covered*/caremanager/utils';
import {
  VISIT_EPISODE_LIST,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  PageContainer,
  Search,
  SectionHeader,
} from '@*company-data-covered*/caremanager/ui';
import EpisodeTable from './components/EpisodeTable';
import useEpisodes from './useEpisodes';
import { FiltersSection } from './components/Filters/FiltersSection';

const styles = makeSxStyles({
  grid: {
    minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
    flex: '1 1 auto',
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
  },
});

export const EpisodeListPage = () => {
  const {
    isMobile,
    onSearchChange,
    patientName,
    config,
    setSelectedMarkets,
    setSelectedCarePhases,
    setSelectedServiceLines,
    selectedMarkets,
    selectedCarePhases,
    selectedServiceLines,
    setIncompleteTasksSelected,
    incompleteTasksSelected,
    isLoading,
    episodes,
    tablePaginationPage,
    rowsPerPage,
    totalPages,
    totalResults,
    setRowsPerPage,
    setPage,
    resetFilters,
    isFetched,
    error,
  } = useEpisodes();
  const { trackPageViewed } = useAnalytics();

  useEffect(() => {
    // TODO(CO-1518): Add previous page as second argument
    trackPageViewed(VISIT_EPISODE_LIST);
  }, [trackPageViewed]);

  return (
    <PageContainer disableGutters={isMobile} maxWidth="xl">
      <Container maxWidth={false} disableGutters={!isMobile}>
        <Grid sx={styles.grid} container>
          <Grid item xs={12}>
            <SectionHeader sectionName="Episodes" />
            <Grid container spacing={0.5}>
              <Grid item xs={12} md={3} mb={1}>
                <Search
                  placeholder="Search by patient name"
                  testId="episode-search-input"
                  onChange={onSearchChange}
                  value={patientName ?? ''}
                />
              </Grid>
              <Grid item xs={12} md={9}>
                <FiltersSection
                  configData={config}
                  setSelectedMarkets={setSelectedMarkets}
                  setSelectedCarePhases={setSelectedCarePhases}
                  setSelectedServiceLines={setSelectedServiceLines}
                  selectedMarkets={selectedMarkets}
                  selectedCarePhases={selectedCarePhases}
                  selectedServiceLines={selectedServiceLines}
                  setIncompleteTasksSelected={setIncompleteTasksSelected}
                  incompleteTasksSelected={incompleteTasksSelected}
                  handleClearAll={resetFilters}
                />
              </Grid>
            </Grid>
            <EpisodeTable
              isError={error}
              isLoading={isLoading || !isFetched}
              episodes={episodes}
              page={tablePaginationPage}
              rowsPerPage={rowsPerPage}
              totalPages={totalPages}
              totalResults={totalResults}
              setRowsPerPage={setRowsPerPage}
              setPage={setPage}
            />
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
};
