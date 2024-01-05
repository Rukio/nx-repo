import React, { useEffect } from 'react';
import { Box, Grid } from '@*company-data-covered*/design-system';
import { Episode } from '@*company-data-covered*/caremanager/data-access-types';
import {
  VISIT_EPISODE_OVERVIEW,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import EpisodeDailyUpdates from '../EpisodeDailyUpdates';
import EpisodeSummary from '../EpisodeSummary';
import OverviewHeader from './OverviewHeader';
import { PatientSummaryCard } from '@*company-data-covered*/caremanager/feature-patient';

const EpisodeOverview: React.FC<Episode> = (episode) => {
  const { trackPageViewed } = useAnalytics();

  useEffect(() => {
    // TODO(CO-1518): Add previous page as second argument
    trackPageViewed(VISIT_EPISODE_OVERVIEW);
  }, [trackPageViewed]);

  return (
    <Box
      data-testid="episode-header-overview-container"
      padding={{ xs: '32px 16px', sm: '40px' }}
    >
      <OverviewHeader {...episode} />
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8} xl={9}>
          <EpisodeSummary
            id={episode.id}
            summary={episode.patientSummary || ''}
          />
          <EpisodeDailyUpdates
            notes={
              episode.notes?.filter(
                (note) => note.noteKind === 'daily_update'
              ) || []
            }
            episodeId={episode.id}
            dataTestId="episodes"
          />
        </Grid>
        {episode.patient && (
          <Grid item xs={12} lg={4} xl={3}>
            <PatientSummaryCard patientId={episode.patientId} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EpisodeOverview;
