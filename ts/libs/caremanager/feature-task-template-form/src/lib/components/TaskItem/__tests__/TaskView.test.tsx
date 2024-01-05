import { fireEvent, screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import {
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import TaskView from '../TaskView';
import { TaskViewProps } from '../TaskView.model';

const updateStatus = vi.fn();
const setup = (isTemplate = false, templateProps = {}) => {
  let taskViewProps: TaskViewProps = {
    task: {
      id: '1',
      task: 'test',
      taskType: TaskTypeEnum.DailyAndOnboarding,
      taskableType: 'string',
      taskableId: '1',
      status: TaskStatusEnum.Pending,
      completedByUserId: '1',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    onToggleStatus: updateStatus,
  };
  if (isTemplate) {
    taskViewProps = {
      ...taskViewProps,
      ...templateProps,
    };
  }
  renderWithClient(<TaskView {...taskViewProps} />);
};

describe('TaskView', () => {
  it('renders default view', () => {
    setup(false);
    const checkIcon = screen.getByTestId('check-icon-1');
    expect(checkIcon).toBeInTheDocument();
  });

  it('renders template view', () => {
    const templateProps = {
      isTemplate: true,
    };
    setup(true, templateProps);
    expect(screen.queryByTestId('check-icon-1')).not.toBeInTheDocument();
  });

  it('updates status correctly', () => {
    setup(false);
    const checkIcon = screen.getByTestId('check-icon-1');
    fireEvent.click(checkIcon);
    // expect(screen.getByTestId('completed-icon-1')).toBeInTheDocument();
    expect(updateStatus).toHaveBeenCalled();
  });
});
