import React from 'react';
import {
  Box,
  Button,
  EditIcon,
  Stack,
  Typography,
} from '@*company-data-covered*/design-system';
import { getShortDateDescription } from '@*company-data-covered*/caremanager/utils';
import { useGetServiceLines } from '@*company-data-covered*/caremanager/data-access';
import { Episode } from '@*company-data-covered*/caremanager/data-access-types';
import EditEpisodeModal from '../EditEpisodeModal';

const EpisodeID = {
  marginRight: '10px',
};

const Dates = {
  color: 'text.secondary',
};

const HeaderContainer = { padding: '0 0 20px 0;' };
const OverviewHeader: React.FC<Episode> = (episode) => {
  const [getServiceLine] = useGetServiceLines();
  const serviceLine =
    getServiceLine(episode.serviceLineId) ?? episode.serviceLine;

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const dischargedDate = episode.dischargedAt || new Date();

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={{ xs: 2, sm: 1 }}
      sx={HeaderContainer}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={{ xs: 2, sm: 1 }}>
          <Typography
            sx={EpisodeID}
            variant="h6"
            data-testid={`episode-id-label-${episode.id}`}
          >
            Episode {episode.id}
          </Typography>
          <Typography
            sx={Dates}
            variant="body2"
            data-testid={`care-days-label-${episode.id}`}
          >
            {getShortDateDescription(new Date(episode.admittedAt))} -{' '}
            {getShortDateDescription(new Date(dischargedDate))}
          </Typography>
        </Stack>
        <Typography
          sx={EpisodeID}
          variant="body2"
          data-testid={`patient-care-line-label-${episode.id}`}
        >
          {serviceLine?.name || 'Unknown service line'},{' '}
          {episode.carePhase?.name || 'Unknown care phase'}
        </Typography>
      </Box>
      <Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={handleOpen}
          data-testid={`edit-episode-details-episode-button-${episode.id}`}
        >
          Edit Episode Details
        </Button>
        <EditEpisodeModal
          episode={episode}
          onClose={handleClose}
          isOpen={open}
        />
      </Box>
    </Stack>
  );
};

export default OverviewHeader;
