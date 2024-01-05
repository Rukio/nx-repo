import { FC, KeyboardEvent } from 'react';
import {
  AddIcon,
  Box,
  Button,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FormikInputField } from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  container: {
    display: 'flex',
    alignItems: 'flex-end',
    borderBottom: '2px solid transparent',
    marginLeft: 1,
    '&:hover': { borderColor: '#1E2930' },
    '&:focus-within': { borderColor: '#1E2930' },
  },
  input: {
    width: '100%',
    '.MuiInputBase-root': {
      paddingBottom: 1.5,
      margin: 0,
      '&:before': {
        display: 'none',
      },
      '&:after': {
        display: 'none',
      },
    },
    '.MuiFormLabel-root': {
      fontSize: '0.875rem',
      marginTop: -1.75,
    },
  },
  addIcon: { color: 'action.active', mr: '16px', my: 0.5, mb: '12px' },
  addButton: { mb: '4px' },
});

type NewTaskProps = {
  handleSubmit: (
    _value: React.MouseEvent<HTMLElement> | KeyboardEvent<HTMLInputElement>
  ) => void;
  disabled: boolean;
};

const NewTask: FC<NewTaskProps> = ({ handleSubmit, disabled = true }) => {
  const fieldData = {
    name: 'task',
    label: 'Add task',
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      handleSubmit(event);
    }
  };

  return (
    <Box sx={styles.container}>
      <AddIcon sx={styles.addIcon} />
      <Box sx={styles.input} className="input-wrapper">
        <FormikInputField
          fieldData={fieldData}
          fullWidth
          variant="standard"
          multiline
          onKeyDown={onKeyDown}
          data-testid="new-task-input"
        />
      </Box>
      <Button
        onClick={handleSubmit}
        data-testid="submit-new-task"
        disabled={disabled}
        sx={styles.addButton}
      >
        Add
      </Button>
    </Box>
  );
};

export default NewTask;
