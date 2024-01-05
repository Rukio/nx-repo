import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { TaskTypeEnum } from '@*company-data-covered*/caremanager/data-access-types';
import { TaskForm, TaskFormProps } from '../TaskForm';

const addNewTask = vi.fn();
const setup = () => {
  const taskFormProps: TaskFormProps = {
    taskType: TaskTypeEnum.DailyAndOnboarding,
    addNewTask,
  };
  renderWithClient(<TaskForm {...taskFormProps} />);
};

describe('TaskForm', () => {
  it('submits tasks', async () => {
    setup();
    const taskInput = screen.getByTestId('task-input');
    const submitButton = screen.getByTestId('submit-new-task');
    fireEvent.change(taskInput, { target: { value: 'this is a test' } });
    await waitFor(() => {
      expect((taskInput as HTMLInputElement).value).toBe('this is a test');
    });
    submitButton.click();
    expect(addNewTask).toHaveBeenCalled();
  });

  it('filter out tasks with empty bodies', () => {
    setup();
    const taskInput = screen.getByTestId('task-input');
    const submitButton = screen.getByTestId('submit-new-task');
    fireEvent.change(taskInput, {
      target: { value: 'task1\ntask2 \n \n\ntask3' },
    });
    submitButton.click();
    expect(addNewTask).toHaveBeenCalledWith(
      ['task1', 'task2', 'task3'],
      'daily_and_onboarding'
    );
  });
});
