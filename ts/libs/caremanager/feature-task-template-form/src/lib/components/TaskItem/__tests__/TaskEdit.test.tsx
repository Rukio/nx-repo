import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import TaskEdit from '../TaskEdit';

const mockTask = {
  id: 1,
  task: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed tortor justo. Vivamus nibh sapien, malesuada a tempor porta, vehicula ut nisi',
  taskType: TaskTypeEnum.DailyAndOnboarding,
  taskableType: 'string',
  taskableId: 1,
  status: TaskStatusEnum.Completed,
  createdBy: {
    id: 1,
    firstName: 'Noter',
    lastName: 'McNote',
    email: 'user@example.com',
    jobTitle: 'string',
  },
  lastUpdatedBy: {
    id: 1,
    firstName: 'Noter',
    lastName: 'McNote',
    email: 'user@example.com',
    jobTitle: 'string',
  },
  createdAt: new Date('2022-03-17T02:53:21.641Z'),
  updatedAt: new Date('2022-03-17T02:53:21.641Z'),
};

const handleDismiss = vi.fn();
const handleChange = vi.fn();

const setup = () => {
  renderWithClient(
    <TaskEdit
      taskText={mockTask.task}
      onDismiss={handleDismiss}
      onChange={handleChange}
      formWrapper
    />
  );
};

describe('TaskEdit', () => {
  beforeEach(() => {
    handleDismiss.mockClear();
    handleChange.mockClear();
    setup();
  });

  it('renders without crashing', () => {
    const form = screen.getByTestId('task-edit-form');
    expect(form).toBeInTheDocument();
  });

  it('cancels edit mode', async () => {
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    cancelButton.click();
    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
  });

  it('should save changes', async () => {
    const saveButton = screen.getByTestId('update-task-button');
    saveButton.click();
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });
  });

  it('should close edit mode on esc key', () => {
    const input = screen.getByTestId('taskupdate-input');
    fireEvent.keyDown(input, {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      charCode: 27,
    });
    expect(handleDismiss).toHaveBeenCalled();
  });

  it('should not close edit mode with other keys', () => {
    const input = screen.getByTestId('taskupdate-input');
    fireEvent.keyDown(input, {
      key: 'a',
      code: 'KeyA',
      keyCode: 65,
      charCode: 65,
    });
    expect(handleDismiss).not.toHaveBeenCalled();
  });
});
