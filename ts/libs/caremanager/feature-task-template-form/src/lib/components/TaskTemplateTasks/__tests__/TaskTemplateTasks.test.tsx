import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import { TaskTemplateTasks } from '../TaskTemplateTasks';
import { TaskWithOperation } from '../TaskTemplateTasks.utils';

const setTasks = vi.fn();

const existingTasks: Record<string, TaskWithOperation[]> = {
  [TaskTypeEnum.DailyAndOnboarding]: [
    {
      id: '20',
      task: 'test',
      taskType: TaskTypeEnum.DailyAndOnboarding,
      taskableId: '1',
      taskableType: 'Episode',
      status: TaskStatusEnum.Pending,
      operation: 'create',
      updatedAt: new Date().toISOString(),
    },
  ],
};

const setup = (
  initialRoutes: [Record<string, string>],
  tasks: Record<string, TaskWithOperation[]>
) => {
  renderWithClient(
    <MemoryRouter initialEntries={initialRoutes}>
      <TaskTemplateTasks tasks={tasks} setTasks={setTasks} />
    </MemoryRouter>
  );
};

describe('TaskTemplateTasks', () => {
  beforeEach(() => {
    setTasks.mockClear();
  });

  it('should be able to delete a task', async () => {
    setup(
      [{ pathname: '/settings/task-templates/new', hash: '' }],
      existingTasks
    );
    const menuButton = screen.getByTestId('task-menu-button');
    menuButton.click();
    const deleteButton = await screen.findByTestId('task-edit-menu-item');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should add a new task', async () => {
    setup(
      [{ pathname: '/settings/task-templates/new', hash: '' }],
      existingTasks
    );
    const tasks = screen.getAllByTestId('task-item');
    expect(tasks.length).toBe(1);
    const taskInput = screen.getAllByTestId('task-input')[0];
    const submitButton = screen.getAllByTestId('submit-new-task')[0];
    fireEvent.change(taskInput, { target: { value: 'this is a test' } });
    submitButton.click();
    await waitFor(() => {
      expect(setTasks).toHaveBeenCalled();
    });
  });

  it('should add new tasks from multiline input', async () => {
    setup([{ pathname: '/settings/task-templates/new', hash: '' }], {});
    const taskInput = screen.getAllByTestId('task-input')[0];
    const submitButton = screen.getAllByTestId('submit-new-task')[0];
    fireEvent.change(taskInput, { target: { value: 'Task 1\nTask 2' } });
    submitButton.click();
    await waitFor(() =>
      expect(setTasks.mock.calls[0][0]).toMatchObject({
        [TaskTypeEnum.DailyAndOnboarding]: [
          {
            task: 'Task 1',
            taskType: TaskTypeEnum.DailyAndOnboarding,
            operation: 'create',
          },
          {
            task: 'Task 2',
            taskType: TaskTypeEnum.DailyAndOnboarding,
            operation: 'create',
          },
        ],
      })
    );
  });
});
