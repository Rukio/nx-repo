import {
  Chip,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  NOTE_TYPES_TEXTS,
  NoteKind,
} from '@*company-data-covered*/caremanager/data-access-types';

const styles = makeSxStyles({
  container: { width: { xs: '100%', md: 'auto' } },
  notSelected: {
    backgroundColor: (theme) => theme.palette.primary.contrastText,
    color: (theme) => theme.palette.text.primary,
  },
  selected: {
    backgroundColor: (theme) => theme.palette.primary.main,
    color: (theme) => theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: (theme) => theme.palette.text.secondary,
    },
  },
});

type NotesChipsProps = {
  setCurrentNoteKind: (noteType: NoteKind) => void;
  currentNoteKind: NoteKind;
};

const NotesChips = ({
  currentNoteKind,
  setCurrentNoteKind,
}: NotesChipsProps) => (
  <Stack
    direction="row"
    spacing={1}
    alignItems="center"
    justifyContent="flex-start"
    sx={styles.container}
  >
    <Typography
      data-testid="create-note-tags-header"
      variant="subtitle2"
      fontWeight={500}
    >
      Tags
    </Typography>
    {Object.values(NoteKind).map((noteKind) => (
      <Chip
        key={noteKind}
        label={NOTE_TYPES_TEXTS[noteKind]}
        data-testid={`create-note-${noteKind.replaceAll('_', '-')}-chip`}
        onClick={() => setCurrentNoteKind(noteKind)}
        sx={currentNoteKind === noteKind ? styles.selected : styles.notSelected}
        variant={currentNoteKind === noteKind ? 'filled' : 'outlined'}
      />
    ))}
  </Stack>
);

export default NotesChips;
