import { ChangeEvent, FC, useState } from 'react';
import { NOTE_TEST_IDS } from '../../testIds';
import { Button, Grid, TextField } from '../../../..';

export type EditSectionProps = {
  text: string;
  onCancel: () => void;
  onSave: (text: string) => void;
};

const EditSection: FC<EditSectionProps> = ({ text, onCancel, onSave }) => {
  const [newValue, setNewValue] = useState(text);

  const onChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value },
    } = ev;
    setNewValue(value);
  };

  const onSaveChangesClick = () => {
    onSave(newValue);
  };

  const isTextSame = text.localeCompare(newValue) === 0;

  const isSaveButtonDisabled = isTextSame || !newValue;

  return (
    <>
      <TextField
        placeholder="Edit a note"
        size="small"
        fullWidth
        defaultValue={text}
        multiline
        inputProps={{
          'data-testid': NOTE_TEST_IDS.EDIT_INPUT,
        }}
        onChange={onChange}
      />
      <Grid container spacing={2} justifyContent="end" pt={2}>
        <Grid item>
          <Button
            variant="text"
            onClick={onCancel}
            data-testid={NOTE_TEST_IDS.EDIT_CANCEL_BUTTON}
          >
            Cancel
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            onClick={onSaveChangesClick}
            disabled={isSaveButtonDisabled}
            data-testid={NOTE_TEST_IDS.EDIT_SAVE_CHANGES_BUTTON}
          >
            Save Changes
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

export default EditSection;
