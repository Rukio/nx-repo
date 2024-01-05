import React from 'react';
import { Box, Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import { Episode } from '@*company-data-covered*/caremanager/data-access-types';
import EpisodeNoteCompose from '../EpisodeNoteCompose';
import EpisodeNotesList from '../EpisodeNotesList';

const styles = makeSxStyles({
  container: { padding: { xs: '32px 16px', sm: '40px' } },
});

const EpisodeNotes: React.FC<Episode> = ({ id, notes }) => (
  <Box sx={styles.container}>
    <Typography data-testid="episode-notes-header" variant="h6">
      Notes
    </Typography>
    <EpisodeNoteCompose episodeId={id} />
    <EpisodeNotesList notes={notes} />
  </Box>
);

export default EpisodeNotes;
