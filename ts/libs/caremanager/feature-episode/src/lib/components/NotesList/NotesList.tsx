import { useMemo } from 'react';
import { Box, List, makeSxStyles } from '@*company-data-covered*/design-system';
import { Note } from '@*company-data-covered*/caremanager/data-access-types';
import NoteOverview from '../NoteOverview';

const MAX_PINNED_NOTES = 3;

type NotesListProps = {
  notes: Note[];
  dataTestPrefix?: string;
};

const styles = makeSxStyles({
  fullWidth: { width: '100%' },
});

const NotesList = ({ notes, dataTestPrefix }: NotesListProps) => {
  const isPinnedFull = useMemo(
    () => notes.filter(({ pinned }: Note) => pinned).length >= MAX_PINNED_NOTES,
    [notes]
  );

  return (
    <Box sx={styles.fullWidth}>
      <List
        data-testid={`${dataTestPrefix}-notes-list-list`}
        sx={styles.fullWidth}
      >
        {notes?.map((note) => (
          <NoteOverview
            key={`${note.noteKind}-${note.id}`}
            data-testid={`${dataTestPrefix}-note-overview-${note.id}`}
            pinButtonEnabled={!isPinnedFull || !!note.pinned}
            note={note}
          />
        ))}
      </List>
    </Box>
  );
};

NotesList.defaultProps = {
  dataTestPrefix: '',
};

export default NotesList;
