import { FC, Fragment, KeyboardEvent } from 'react';
import { Form, Formik } from 'formik';
import {
  Button,
  Grid,
  Stack,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FormikInputField } from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  container: {
    justifyContent: 'flex-end',
    ml: 1.1,
    mt: 2,
    mb: 2,
  },
  footer: {
    justifyContent: 'flex-end',
    ml: 1.1,
    mt: 2,
    mb: 2,
  },
});

type TaskItemProps = {
  taskText: string;
  onDismiss: () => void;
  onChange: (input: { task: string }) => Promise<void> | void;
  formWrapper: boolean;
};
const TaskEdit: FC<TaskItemProps> = ({
  taskText,
  onDismiss,
  onChange,
  formWrapper,
}) => {
  const initialValues = {
    taskUpdate: taskText,
  };
  const fieldData = {
    name: 'taskUpdate',
    label: 'Update task',
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onDismiss();
    }
  };

  const handleSubmit = async (input: typeof initialValues) => {
    await onChange({ task: input.taskUpdate });
    onDismiss();
  };

  const FormElement = formWrapper ? Form : Fragment;

  return (
    <Formik
      initialValues={initialValues}
      validateOnBlur={false}
      onSubmit={handleSubmit}
    >
      {({ values }) => (
        <FormElement data-testid="task-edit-form">
          <Grid sx={styles.container}>
            <FormikInputField
              fieldData={fieldData}
              fullWidth
              variant="outlined"
              data-testid="edit-task-input"
              onKeyDown={onKeyDown}
            />
            <Stack direction="row" justifyContent="end" sx={styles.footer}>
              <Button
                data-testid="cancel-update-task-button"
                type="button"
                onClick={() => onDismiss()}
              >
                Cancel
              </Button>
              <Button
                data-testid="update-task-button"
                variant="contained"
                color="primary"
                type={formWrapper ? 'submit' : 'button'}
                onClick={formWrapper ? undefined : () => handleSubmit(values)}
              >
                Save changes
              </Button>
            </Stack>
          </Grid>
        </FormElement>
      )}
    </Formik>
  );
};

export default TaskEdit;
