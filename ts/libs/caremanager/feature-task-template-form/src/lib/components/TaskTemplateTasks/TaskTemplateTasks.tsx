import { FC } from 'react';
import {
  AccordionDetails,
  AccordionSummary,
  Divider,
  ExpandMoreIcon,
  List,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { formatDataTestId } from '@*company-data-covered*/caremanager/utils';
import {
  CreateTemplateTask,
  TaskTypeEnum,
  UpdateTaskTemplateTask,
} from '@*company-data-covered*/caremanager/data-access-types';
import { useHash } from '@*company-data-covered*/caremanager/utils-react';
import { Accordion } from '@*company-data-covered*/caremanager/ui';
import { TaskForm } from '../TaskForm';
import { TaskItem } from '../TaskItem';
import {
  TaskOperation,
  TaskWithOperation,
  defaultExpandedState,
  editTasksFromType,
  mapTask,
  removeTaskFromTaskMap,
  taskTypes,
} from './TaskTemplateTasks.utils';

const styles = makeSxStyles({
  accordionSummary: { flexDirection: 'row-reverse', p: 2 },
  accordionTitle: {
    width: { xs: 'auto', md: '33%' },
    flexShrink: 0,
    pl: 1.5,
  },
  accordionStatus: {
    textAlign: 'right',
    flexGrow: '1',
    color: 'text.secondary',
  },
  accordionDetails: { paddingTop: 0 },
});

type TaskTemplateTasksProps = {
  tasks: Record<string, TaskWithOperation[]>;
  setTasks: React.Dispatch<
    React.SetStateAction<Record<string, TaskWithOperation[]>>
  >;
};

type ParsedTask = (CreateTemplateTask | UpdateTaskTemplateTask) & {
  destroy?: boolean;
};

const parseTaskOperationForAPI = ({
  operation,
  id,
  body,
  taskTypeId,
}: {
  operation: TaskOperation;
  id?: string;
  body?: string;
  taskTypeId?: string;
}): ParsedTask | null => {
  const isCreate =
    operation === 'create' && body !== undefined && taskTypeId !== undefined;
  const isUpdate =
    operation === 'update' &&
    id !== undefined &&
    body !== undefined &&
    taskTypeId !== undefined;
  const isDelete = operation === 'delete' && id !== undefined;

  switch (true) {
    case isCreate:
      return {
        body,
        taskTypeId,
      };
    case isUpdate:
      return {
        id,
        body,
        taskTypeId,
      };
    case isDelete:
      return {
        id,
        destroy: true,
      };
    default:
      return null;
  }
};
const getHardcodedTaskId = (taskType: string) => {
  const taskIdMap: Record<string, string> = {
    nurse_navigator: '4',
    daily_and_onboarding: '6',
    t1: '7',
    t2: '8',
  };
  if (taskType in taskIdMap) {
    return taskIdMap[taskType];
  }

  return taskIdMap['Nurse Navigator'];
};

export const composeTasks = (tasks: Record<string, TaskWithOperation[]>) => {
  const parsedTasks: ParsedTask[] = [];

  Object.entries(taskTypes).forEach(([taskType]) => {
    if (tasks[taskType] && tasks[taskType].length) {
      tasks[taskType].forEach((task) => {
        const parsedTaskOperation = parseTaskOperationForAPI({
          operation: task.operation,
          id: task.id,
          body: task.task,
          taskTypeId: getHardcodedTaskId(taskType),
        });
        if (parsedTaskOperation) {
          parsedTasks.push(parsedTaskOperation);
        }
      });
    }
  });

  return parsedTasks.length ? parsedTasks : undefined;
};

export const TaskTemplateTasks: FC<TaskTemplateTasksProps> = ({
  tasks,
  setTasks,
}) => {
  const { hash, handleChange } = useHash({
    initialState: defaultExpandedState,
    hashPattern: 'header',
  });

  const addTasks = (newTasks: string[], newTaskType: TaskTypeEnum) => {
    const mappedTasks = newTasks.map((task) => mapTask(task, newTaskType));
    const existingTasksForType = tasks[newTaskType] || [];
    setTasks({
      ...tasks,
      [newTaskType]: [...mappedTasks, ...existingTasksForType],
    });
  };

  const mapTaskTypeList = (task: TaskWithOperation) => {
    if (task.operation === 'delete') {
      return null;
    }

    const handleDelete = () => {
      const filteredTasks = removeTaskFromTaskMap(
        task.id,
        task.taskType,
        tasks
      );
      setTasks({ ...tasks, [task.taskType]: filteredTasks });
    };
    const handleDescriptionChange = (taskDescription: string) => {
      const updatedTasksFromType = editTasksFromType(
        tasks,
        task,
        taskDescription
      );
      setTasks((prev) => ({
        ...prev,
        [task.taskType]: updatedTasksFromType,
      }));
    };

    return (
      <TaskItem
        key={`task-${task.id}`}
        task={task}
        onDelete={handleDelete}
        onChange={(input) => input.task && handleDescriptionChange(input.task)}
        formWrapper={false}
        customListStyle={{ paddingLeft: '48px' }}
        isTemplate
      />
    );
  };

  return (
    <>
      {Object.keys(taskTypes).map((key) => {
        const taskType = key as TaskTypeEnum;

        return (
          <Accordion
            data-testid={`${formatDataTestId(taskType)}-test`}
            key={taskType}
            expanded={hash[taskType]}
            onChange={handleChange(taskType)}
          >
            <AccordionSummary
              sx={styles.accordionSummary}
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${formatDataTestId(taskType)}-content`}
              id={`${formatDataTestId(taskType)}-header`}
            >
              <Typography variant="h6" sx={styles.accordionTitle}>
                {taskTypes[taskType]} Tasks
              </Typography>
              <Typography
                variant="body2"
                sx={styles.accordionStatus}
                data-testid="task-counter-status"
              >
                {tasks[taskType]
                  ? `${tasks[taskType].length} Tasks added`
                  : 'None added yet'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={styles.accordionDetails}>
              <List>
                <TaskForm taskType={taskType} addNewTask={addTasks} />
                <Divider />
                {tasks[taskType] &&
                  tasks[taskType].map((task: TaskWithOperation) =>
                    mapTaskTypeList(task)
                  )}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};
