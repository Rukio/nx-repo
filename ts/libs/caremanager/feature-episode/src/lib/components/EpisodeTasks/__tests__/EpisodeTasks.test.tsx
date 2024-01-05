import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Task,
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import EpisodeTasks from '../EpisodeTasks';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';

const mockTasks: Task[] = [
  {
    id: '1',
    task: 'Task 1',
    taskType: TaskTypeEnum.DailyAndOnboarding,
    taskableType: 'string',
    taskableId: '1',
    status: TaskStatusEnum.Pending,
    completedByUserId: '1',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    task: 'Task 2',
    taskType: TaskTypeEnum.DailyAndOnboarding,
    taskableType: 'string',
    taskableId: '1',
    status: TaskStatusEnum.Pending,
    completedByUserId: '1',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const setup = (tasks: Task[]) => {
  renderWithClient(
    <MemoryRouter initialEntries={['/episodes/1/tasks']}>
      <EpisodeTasks tasks={tasks} episodeId="1" />
    </MemoryRouter>
  );
};

describe('EpisodeTasks', () => {
  it('should render a list of tasks', () => {
    setup([...mockTasks]);
    expect(screen.getByText(mockTasks[0].task)).toBeInTheDocument();
    expect(screen.getByText(mockTasks[1].task)).toBeInTheDocument();
  });

  it('should hide tasks with completed status', () => {
    const listWithCompletedTasks = [...mockTasks];
    listWithCompletedTasks[0].status = TaskStatusEnum.Completed;
    setup(listWithCompletedTasks);
    expect(
      screen.queryByTestId(`task-text-${listWithCompletedTasks[0].id}`)
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`task-text-${listWithCompletedTasks[1].id}`)
    ).toBeInTheDocument();
  });

  it('should show tasks with completed status', async () => {
    const listWithCompletedTasks = [...mockTasks];
    listWithCompletedTasks[0].status = TaskStatusEnum.Completed;
    setup(listWithCompletedTasks);
    expect(
      screen.queryByTestId(`task-text-${listWithCompletedTasks[0].id}`)
    ).not.toBeInTheDocument();
    const statusSwitch = screen.getByTestId('hide-completed-tasks-switch');
    await userEvent.click(statusSwitch);
    expect(
      screen.getByTestId(`task-text-${listWithCompletedTasks[0].id}`)
    ).toBeInTheDocument();
  });
});
