import { useState } from 'react';
import {
  MenuItem,
  Stack,
  TextField,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { Note, NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import NotesList from '../NotesList';

const styles = makeSxStyles({
  notesList: {
    padding: { xs: '20px 16px', md: '24px' },
    backgroundColor: 'white',
    width: '100%',
    borderRadius: '6px',
    margin: '4px 0',
  },
  select: {
    width: { xs: '100%', md: '220px' },
    '& .MuiSelect-select': { padding: '7px 12px' },
  },
});

type EpisodeNotesListProps = {
  notes?: Note[];
};

const sortedByType = (notes: Note[], filter: NoteKind | 'All') => {
  if (filter === 'All') {
    return notes;
  }

  return notes.filter((note) => note.noteKind === filter);
};

type AllButtonFilter = 'All';

const filterTypes = [
  {
    testId: 'episode-notes-list-all-option',
    buttonFilter: 'All' as AllButtonFilter,
    text: 'All Notes',
  },
  {
    testId: 'episode-notes-list-general-option',
    buttonFilter: NoteKind.General,
    text: 'General Notes',
  },
  {
    testId: 'episode-notes-list-daily-update-option',
    buttonFilter: NoteKind.DailyUpdate,
    text: 'Daily Updates',
  },
  {
    testId: 'episode-notes-list-clinical-option',
    buttonFilter: NoteKind.Clinical,
    text: 'Clinical Notes',
  },
  {
    testId: 'episode-notes-list-navigator-option',
    buttonFilter: NoteKind.Navigator,
    text: 'Navigator Notes',
  },
];

const EpisodeNotesList = ({ notes = [] }: EpisodeNotesListProps) => {
  const [currentFilter, setCurrentFilter] = useState<NoteKind | 'All'>('All');
  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value },
    } = e;
    setCurrentFilter(value as NoteKind | AllButtonFilter);
  };

  return (
    <Stack
      sx={styles.notesList}
      direction="column"
      alignItems="flex-start"
      data-testid="episode-notes-list"
      spacing={2}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        width="100%"
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
      >
        <Typography
          data-testid="episode-note-list-header"
          variant="subtitle1"
          fontWeight={500}
          flexGrow={1}
        >
          Notes
        </Typography>
        <TextField
          select
          sx={styles.select}
          name="notes-filter"
          value={currentFilter}
          onChange={onFilterChange}
          fullWidth
          data-testid="episode-note-list-select"
        >
          {filterTypes.map((filter) => (
            <MenuItem
              key={filter.buttonFilter}
              data-testid={filter.testId}
              value={filter.buttonFilter}
            >
              {filter.text}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <NotesList notes={sortedByType(notes, currentFilter)} />
    </Stack>
  );
};

export default EpisodeNotesList;
