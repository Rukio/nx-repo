import {
  Container,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import CreateNoteInput from '../CreateNoteInput';

type EpisodeNoteComposeProps = {
  episodeId: string;
};

const styles = makeSxStyles({
  container: (theme) => ({
    bgcolor: 'background.paper',
    padding: 2,
    margin: '20px 0 8px',
    width: '100%',
    minWidth: '100%',
    [theme.breakpoints.up('sm')]: {
      padding: 3,
      paddingRight: 4,
    },
  }),
});

const EpisodeNoteCompose = ({ episodeId }: EpisodeNoteComposeProps) => (
  <Container
    data-testid="episode-note-compose-container"
    disableGutters
    sx={styles.container}
  >
    <Stack direction="column" spacing={2}>
      <Typography data-testid="episode-note-compose-header" variant="subtitle1">
        Compose
      </Typography>
      <CreateNoteInput needsDivider={false} episodeId={episodeId.toString()} />
    </Stack>
  </Container>
);

export default EpisodeNoteCompose;
