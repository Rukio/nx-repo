import { useRef, useState } from 'react';
import {
  Button,
  Divider,
  Stack,
  TextField,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useCreateEpisodeNote } from '@*company-data-covered*/caremanager/data-access';
import { NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import NotesChips from '../NotesChips';

const styles = makeSxStyles({
  discardButton: {
    fontWeight: '300',
    color: (theme) => theme.palette.text.secondary,
  },
  postButton: { fontWeight: '300' },
  fullDivider: { width: '100%' },
});

type CreateNoteInputProps = {
  episodeId: string;
  displayChips?: boolean;
  needsDivider?: boolean;
  defaultKind?: NoteKind;
};

type InputRefType = {
  value: string;
};

const CreateNoteInput: React.FC<CreateNoteInputProps> = ({
  episodeId,
  displayChips = true,
  needsDivider = true,
  defaultKind = NoteKind.General,
}) => {
  const { mutateAsync: createEpisodeNote } = useCreateEpisodeNote();
  const [showCreateSection, setShowCreateSection] = useState<boolean>(false);
  const [currentNoteKind, setCurrentNoteKind] = useState<NoteKind>(defaultKind);
  const updateInputRef = useRef<InputRefType>();

  const clearInput = () => {
    if (updateInputRef && updateInputRef.current) {
      updateInputRef.current.value = '';
    }
  };

  const cancelNewNote = () => {
    setShowCreateSection(false);
    clearInput();
  };

  const handleSubmit = async () => {
    await createEpisodeNote({
      episodeId,
      body: {
        note: {
          details: updateInputRef?.current?.value || '',
          noteKind: currentNoteKind,
        },
      },
    });
    clearInput();
    setShowCreateSection(false);
  };

  return (
    <>
      <TextField
        fullWidth
        multiline
        onFocus={() => setShowCreateSection(true)}
        inputRef={updateInputRef}
        id="outlined-basic"
        variant="outlined"
        data-testid="create-note-text-field"
        placeholder="Add a note for the team"
      />
      {showCreateSection && (
        <>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            width="100%"
            spacing={2}
            alignItems="center"
          >
            {displayChips && (
              <NotesChips
                currentNoteKind={currentNoteKind}
                setCurrentNoteKind={setCurrentNoteKind}
              />
            )}
            <Stack
              direction="row"
              width="100%"
              alignItems="center"
              justifyContent="flex-end"
              spacing={2}
            >
              <Button
                data-testid="create-note-discard-button"
                sx={styles.discardButton}
                onClick={cancelNewNote}
              >
                Discard
              </Button>
              <Button
                data-testid="create-note-post-button"
                sx={styles.postButton}
                onClick={handleSubmit}
                variant="contained"
              >
                Post
              </Button>
            </Stack>
          </Stack>
          {needsDivider && (
            <Divider
              data-testid="create-note-divider"
              sx={styles.fullDivider}
            />
          )}
        </>
      )}
    </>
  );
};

export default CreateNoteInput;
