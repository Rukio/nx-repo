import { FC } from 'react';
import { Form, Formik, FormikState } from 'formik';
import { TaskTypeEnum } from '@*company-data-covered*/caremanager/data-access-types';
import NewTask from './NewTask';

export type TaskFormProps = {
  taskType: TaskTypeEnum;
  addNewTask: (tasks: string[], taskType: TaskTypeEnum) => void;
};
export const TaskForm: FC<TaskFormProps> = ({ taskType, addNewTask }) => {
  const initialValues = {
    task: '',
  };

  const handleNewSubmit = (
    values: { task: string },
    setSubmitting: (isSubmitting: boolean) => void,
    resetForm: (nextState?: Partial<FormikState<{ task: string }>>) => void
  ) => {
    const taskText = values.task;
    if (!taskText || taskText === '') {
      return;
    }
    setSubmitting(true);
    const tasks = values.task
      .split('\n')
      .map((task) => task.trim())
      .filter((task) => !!task);
    addNewTask(tasks, taskType);
    setSubmitting(false);
    resetForm();
  };

  return (
    <div data-testid="task-form">
      <Formik
        initialValues={initialValues}
        validateOnBlur={false}
        onSubmit={() => {
          // noop
        }}
      >
        {({ values, resetForm, setSubmitting, isSubmitting }) => (
          <Form>
            <NewTask
              handleSubmit={() => {
                handleNewSubmit(values, setSubmitting, resetForm);
              }}
              disabled={isSubmitting}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
};
