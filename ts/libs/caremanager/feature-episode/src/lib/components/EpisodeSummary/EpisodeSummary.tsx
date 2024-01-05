import { useState } from 'react';
import Linkify from 'linkify-react';
import {
  Box,
  Button,
  Container,
  EditIcon,
  Stack,
  Typography,
} from '@*company-data-covered*/design-system';

import EditSummary from './EditSummary';

const SummaryContainer = {
  bgcolor: 'background.paper',
  padding: 3,
  paddingRight: 4,
  margin: 0,
  width: '100%',
  minWidth: '100%',
};

type EpisodeSummaryProps = {
  id: string;
  summary: string;
};

const EpisodeSummary = ({ id, summary }: EpisodeSummaryProps) => {
  const [editMode, setEditMode] = useState(false);
  const handleClick = () => {
    setEditMode(!editMode);
  };

  return (
    <Container disableGutters sx={SummaryContainer}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" data-testid="episode-summary-label">
          Summary
        </Typography>
        {editMode ? (
          <EditSummary
            episodeId={id}
            summary={summary}
            setEditMode={setEditMode}
          />
        ) : (
          <>
            <Typography
              variant="body1"
              sx={{ whiteSpace: 'pre-wrap' }}
              data-testid="episode-summary-body"
            >
              <Linkify options={{ target: '_blank' }}>{summary}</Linkify>
            </Typography>
            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleClick}
                data-testid="episode-summary-edit-button"
              >
                Edit Summary
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </Container>
  );
};

export default EpisodeSummary;
