import {
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  TaskWithOperation,
  editTasksFromType,
  mapTask,
  removeTaskFromTaskMap,
} from '../TaskTemplateTasks.utils';

const tasks: Record<string, TaskWithOperation[]> = {
  daily_and_onboarding: [
    {
      id: '20',
      task: 'test',
      taskType: TaskTypeEnum.DailyAndOnboarding,
      operation: 'create',
      taskableType: 'string',
      taskableId: '1',
      status: TaskStatusEnum.Pending,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
};

describe('removeTaskFromTaskMap', () => {
  it('should return the tasks without the task with the given id', () => {
    const result = removeTaskFromTaskMap(
      '20',
      TaskTypeEnum.DailyAndOnboarding,
      tasks
    );
    expect(result.length).toBe(0);
  });

  it('should return the tasks with the original tasks', () => {
    const result = removeTaskFromTaskMap(
      '1',
      TaskTypeEnum.DailyAndOnboarding,
      tasks
    );
    expect(result.length).toBe(1);
  });

  it('should mark existing task as deleted if the operation is not of type created', () => {
    const result = removeTaskFromTaskMap(
      '20',
      TaskTypeEnum.DailyAndOnboarding,
      {
        daily_and_onboarding: [
          { ...tasks.daily_and_onboarding[0], operation: null },
        ],
      }
    );
    expect(result.length).toBe(1);
    expect(result[0]?.operation).toBe('delete');
  });
});

describe('editTasksFromType', () => {
  const dailyAndOnboardingTask = {
    id: '116',
    task: 'mock task',
    taskType: TaskTypeEnum.DailyAndOnboarding,
    taskableType: 'string',
    taskableId: '0',
    status: TaskStatusEnum.Pending,
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
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const mockTasks = { daily_and_onboarding: [dailyAndOnboardingTask] };

  it('should update the task from a task type', () => {
    const updatedTasks = editTasksFromType(
      mockTasks,
      dailyAndOnboardingTask,
      'updated task'
    );
    const updatedTask = updatedTasks[0];
    expect(updatedTask.task).toBe('updated task');
  });
});

describe('mapTask', () => {
  it('should return a new task', () => {
    const result = mapTask('mock task', TaskTypeEnum.DailyAndOnboarding);
    expect(result.task).toBe('mock task');
    expect(result.taskType).toEqual(TaskTypeEnum.DailyAndOnboarding);
    expect(result.status).toEqual(TaskStatusEnum.Pending);
  });
});
