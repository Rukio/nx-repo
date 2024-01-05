import { FC, useState } from 'react';
import {
  ListItem,
  ListItemSecondaryAction,
  SxStylesValue,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useUpdateTask } from '@*company-data-covered*/caremanager/data-access';
import {
  CareManagerServiceUpdateTaskOperationRequest,
  TaskStatusEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import TaskView from './TaskView';
import TaskMenu from './TaskMenu';
import TaskEdit from './TaskEdit';
import { TaskWithOperation } from '../TaskTemplateTasks';

const styles = makeSxStyles({
  container: {
    flexWrap: {
      xs: 'wrap',
      md: 'nowrap',
    },
    justifyContent: {
      xs: 'center',
      md: 'flex-start',
    },
    borderBottom: '1px solid #DDE7EE',
  },
});

type TaskPartial = Partial<
  CareManagerServiceUpdateTaskOperationRequest['body']
>;
type Props = {
  task: TaskWithOperation;
  hiddenIfCompleted?: boolean;
  isTemplate?: boolean;
  formWrapper?: boolean;
  customListStyle?: SxStylesValue;
  onChange?: (input: TaskPartial) => void;
  onDelete?: () => unknown;
};

export const TaskItem: FC<Props> = ({
  task,
  hiddenIfCompleted,
  isTemplate,
  formWrapper = true,
  customListStyle,
  onChange,
  onDelete,
}) => {
  const { mutateAsync: updateTask } = useUpdateTask(task.taskableId.toString());
  const [editMode, setEditMode] = useState(false);

  const handleUpdate = async (input: TaskPartial) => {
    if (onChange) {
      return onChange(input);
    }

    await updateTask({
      taskId: task.id.toString(),
      body: { ...task, ...input },
    });
  };
  const handleToggleStatus = () =>
    handleUpdate({
      status:
        task.status === TaskStatusEnum.Pending
          ? TaskStatusEnum.Completed
          : TaskStatusEnum.Pending,
    });

  if (hiddenIfCompleted && task.status === TaskStatusEnum.Completed) {
    return null;
  }

  if (editMode) {
    return (
      <TaskEdit
        taskText={task.task}
        formWrapper={formWrapper}
        onDismiss={() => setEditMode(false)}
        onChange={handleUpdate}
      />
    );
  }

  return (
    <ListItem
      disablePadding
      sx={{
        ...styles.container,
        ...customListStyle,
      }}
      data-testid="task-item"
    >
      <TaskView
        task={task}
        isTemplate={isTemplate}
        onToggleStatus={handleToggleStatus}
      />
      <ListItemSecondaryAction>
        <TaskMenu
          onEditModeChange={setEditMode}
          id={task.id.toString()}
          episodeId={task.taskableId.toString()}
          onDelete={onDelete}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
};
