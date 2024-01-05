import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import { TaskItem } from '../TaskItem';

const mockTask = {
  id: '1',
  task: 'Lorem ipsum dolor sit amet',
  taskType: TaskTypeEnum.DailyAndOnboarding,
  taskableType: 'string',
  taskableId: '1',
  status: TaskStatusEnum.Completed,
  createdBy: {
    id: '1',
    firstName: 'Noter',
    lastName: 'McNote',
    email: 'user@example.com',
    jobTitle: 'string',
  },
  lastUpdatedBy: {
    id: '1',
    firstName: 'Noter',
    lastName: 'McNote',
    email: 'user@example.com',
    jobTitle: 'string',
  },
  createdAt: '2022-03-17T02:53:21.641Z',
  updatedAt: '2022-03-17T02:53:21.641Z',
};

const deleteTask = vi.fn();
const onEditAction = vi.fn();

type Options = {
  isTemplate: boolean;
};

const setup = (mockData: typeof mockTask, { isTemplate = false }: Options) => {
  renderWithClient(
    <TaskItem
      task={mockData}
      onDelete={deleteTask}
      isTemplate={isTemplate}
      onChange={onEditAction}
    />
  );
};

describe('TaskItem', () => {
  it('renders the task title', () => {
    setup(mockTask, { isTemplate: false });
    expect(screen.getByTestId(`task-text-${mockTask.id}`)).toBeInTheDocument();
    expect(screen.getByText(mockTask.task)).toBeInTheDocument();
  });

  it('shows check icon when status is not completed', () => {
    setup(
      { ...mockTask, status: TaskStatusEnum.Pending },
      { isTemplate: false }
    );
    expect(screen.getByTestId(`check-icon-${mockTask.id}`)).toBeInTheDocument();
  });

  it('shows completed icon when status is completed', () => {
    setup(
      { ...mockTask, status: TaskStatusEnum.Completed },
      { isTemplate: false }
    );
    expect(
      screen.getByTestId(`completed-icon-${mockTask.id}`)
    ).toBeInTheDocument();
  });

  it('should show edit mode', async () => {
    setup(
      { ...mockTask, status: TaskStatusEnum.Pending },
      { isTemplate: false }
    );
    screen.getByTestId('task-menu-button').click();
    (await screen.findByTestId('task-edit-menu-item')).click();
    const editInput = await screen.findByTestId('taskupdate-input');
    expect(editInput).toBeInTheDocument();
  });
});
