import { TaskTypeEnum } from '@*company-data-covered*/caremanager/data-access-types';
import { composeTasks } from '../TaskTemplateTasks';
import { TaskOperation } from '../TaskTemplateTasks.utils';

const user = {
  id: '1',
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
};
const baseTask = {
  id: '20',
  task: 'A new task',
  taskType: TaskTypeEnum.DailyAndOnboarding,
  operation: 'create' as TaskOperation,
  taskableType: 'string',
  taskableId: '1',
  status: 'pending',
  createdBy: user,
  lastUpdatedBy: user,
  updatedAt: new Date().toString(),
  createdAt: new Date().toString(),
};

describe('composeTasks', () => {
  it('composes tasks for create call', () => {
    const result = composeTasks({ daily_and_onboarding: [baseTask] });
    expect(result).toStrictEqual([{ body: 'A new task', taskTypeId: '6' }]);
  });

  it('composes tasks for patch call', () => {
    const tasks = {
      daily_and_onboarding: [baseTask],
      nurse_navigator: [
        {
          ...baseTask,
          id: '30',
          task: 'An updated task',
          operation: 'update' as TaskOperation,
          task_type: TaskTypeEnum.NurseNavigator,
        },
      ],
      t1: [
        {
          ...baseTask,
          id: '40',
          task: 'A deleted task',
          operation: 'delete' as TaskOperation,
          task_type: TaskTypeEnum.T1,
        },
      ],
      t2: [
        {
          ...baseTask,
          id: '666',
          task: 'this is an existing task with no operation and it should be ignored',
          operation: null,
          task_type: TaskTypeEnum.T2,
        },
      ],
    };

    const result = composeTasks(tasks);
    expect(result).toStrictEqual([
      { body: 'A new task', taskTypeId: '6' },
      { id: '30', body: 'An updated task', taskTypeId: '4' },
      { id: '40', destroy: true },
    ]);
  });
});
