import { useRef, useState } from 'react';
import {
  Button,
  ListItemText,
  Stack,
  TextField,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { InputRefType, NoteEditSectionProps } from './NoteEditSection.model';
import NotesChips from '../NotesChips';

const styles = makeSxStyles({
  button: { fontWeight: '300' },
});

const NoteEditSection = ({
  details,
  noteKind,
  onSave,
  onCancelEdit,
}: NoteEditSectionProps) => {
  const [currentNoteKind, setCurrentNoteKind] = useState(noteKind);
  const updateInputRef = useRef<InputRefType>();
  const onSaveClick = () => {
    const updatedNoteValue = updateInputRef?.current?.value;
    onSave(updatedNoteValue || details, currentNoteKind);
    onCancelEdit();
  };

  return (
    <Stack direction="column" width="100%" spacing={2}>
      <ListItemText
        primary={
          <TextField
            data-testid="note-overview-edit-input"
            inputRef={updateInputRef}
            fullWidth
            multiline
            id="outlined-basic"
            variant="outlined"
            defaultValue={details}
            placeholder="Add a note for the team"
          />
        }
      />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        width="100%"
        alignItems="center"
      >
        <NotesChips
          currentNoteKind={currentNoteKind}
          setCurrentNoteKind={setCurrentNoteKind}
        />
        <Stack
          direction="row"
          width="100%"
          alignItems="center"
          justifyContent="flex-end"
          spacing={2}
        >
          <Button
            data-testid="note-overview-edit-cancel-button"
            sx={styles.button}
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
          <Button
            data-testid="note-overview-edit-save-button"
            sx={styles.button}
            onClick={onSaveClick}
            variant="contained"
          >
            Save Changes
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default NoteEditSection;
