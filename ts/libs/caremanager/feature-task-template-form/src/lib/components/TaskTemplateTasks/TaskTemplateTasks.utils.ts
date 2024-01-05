import { v4 as uuid } from 'uuid';
import {
  Task,
  TaskStatusEnum,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';

export type TaskOperation = 'create' | 'update' | 'delete' | null | undefined;

export interface TaskWithOperation extends Task {
  taskType: TaskTypeEnum;
  operation?: TaskOperation;
}

const removeTaskFromTaskMap = (
  id: string,
  taskType: TaskTypeEnum,
  tasks: Record<string, TaskWithOperation[]>
) =>
  tasks[taskType].reduce<TaskWithOperation[]>((acc, task) => {
    let taskToPush = task;
    if (task.id === id) {
      if (task.operation === 'create') {
        return acc;
      }
      taskToPush = { ...task, operation: 'delete' };
    }

    acc.push(taskToPush);

    return acc;
  }, []);

export const defaultExpandedState: Record<string, boolean> = {
  daily_and_onboarding: true,
  nurse_navigator: true,
  t1: false,
  t2: false,
};

export const taskTypes: Record<TaskTypeEnum, string> = {
  daily_and_onboarding: 'Daily & Onboarding',
  nurse_navigator: 'Nurse Navigator',
  t1: 'T1',
  t2: 'T2',
};

const editTasksFromType = (
  tasks: Record<string, TaskWithOperation[]>,
  task: TaskWithOperation,
  updatedTaskText: string
) => {
  const tasksFromType = tasks[task.taskType];

  return tasksFromType.map((taskToUpdate: TaskWithOperation) => {
    if (taskToUpdate.id === task.id) {
      const operation =
        taskToUpdate.operation === 'update' || taskToUpdate.operation === null
          ? ('update' as TaskOperation)
          : taskToUpdate.operation;

      return { ...taskToUpdate, task: updatedTaskText, operation };
    }

    return taskToUpdate;
  });
};

// TODO remove the not needed properties. id, task and taskType are the
// only ones needed
const mapTask = (
  value: string,
  taskType: TaskTypeEnum,
  id?: string
): TaskWithOperation => ({
  id: id || uuid(),
  task: value,
  taskType,
  operation: (!id ? 'create' : null) as TaskOperation,
  taskableType: 'string',
  taskableId: '0',
  status: TaskStatusEnum.Pending,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
});

export { removeTaskFromTaskMap, editTasksFromType, mapTask };
