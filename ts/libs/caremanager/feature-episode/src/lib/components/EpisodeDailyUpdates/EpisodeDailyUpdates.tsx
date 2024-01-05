import { Stack, Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import { Note, NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import NotesList from '../NotesList';
import CreateNoteInput from '../CreateNoteInput';

type EpisodeDailyUpdatesProps = {
  episodeId: string;
  dataTestId: string;
  notes: Note[];
};

const styles = makeSxStyles({
  container: {
    padding: '24px',
    backgroundColor: 'white',
    width: '100%',
    borderRadius: '6px',
    margin: '4px 0',
  },
});

const EpisodeDailyUpdates = ({
  notes,
  dataTestId,
  episodeId,
}: EpisodeDailyUpdatesProps) => (
  <Stack
    sx={styles.container}
    direction="column"
    alignItems="flex-start"
    data-testid={`note-overview-${dataTestId}`}
    spacing={2}
  >
    <Typography
      variant="subtitle1"
      fontWeight={500}
      data-testid="daily-updates-label"
    >
      Daily Team Updates
    </Typography>
    <CreateNoteInput
      displayChips={false}
      episodeId={episodeId}
      defaultKind={NoteKind.DailyUpdate}
    />
    <NotesList dataTestPrefix="episode-daily-updates" notes={notes} />
  </Stack>
);

export default EpisodeDailyUpdates;
