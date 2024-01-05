import { FC } from 'react';
import {
  Box,
  CheckCircleIcon,
  CheckCircleOutlineIcon,
  Checkbox,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useGetUsers } from '@*company-data-covered*/caremanager/data-access';
import { TaskStatusEnum } from '@*company-data-covered*/caremanager/data-access-types';
import {
  formattedShortDate,
  getAvatarInitials,
} from '@*company-data-covered*/caremanager/utils';
import CompletedItem from './CompletedItem';
import { TaskViewProps } from './TaskView.model';

const makeStyles = (isCompleted: boolean) =>
  makeSxStyles({
    button: { padding: 0, margin: 0 },
    icon: {
      minWidth: 0,
      '& span': {
        marginRight: '9px',
        marginLeft: 0,
        '& svg': {
          width: 20,
          height: 20,
        },
      },
    },
    taskTextWrapper: {
      margin: '12px 0',
    },
    taskText: {
      textDecorationLine: isCompleted ? 'line-through' : 'none',
      textDecorationStyle: isCompleted ? 'solid' : 'none',
      color: isCompleted ? 'text.secondary' : '',
    },
  });

const TaskView: FC<TaskViewProps> = ({ task, isTemplate, onToggleStatus }) => {
  const { id, task: taskText, completedByUserId, updatedAt } = task;
  const { data: userData } = useGetUsers(
    completedByUserId ? [completedByUserId] : undefined
  );
  const user = userData?.users[0] || task.lastUpdatedBy;
  const initials = user ? getAvatarInitials(user.firstName, user.lastName) : '';

  let formattedDate = '';
  if (typeof updatedAt === 'string') {
    formattedDate = formattedShortDate(new Date(updatedAt));
  } else if (updatedAt) {
    formattedDate = formattedShortDate(updatedAt);
  }

  const isCompleted = task.status === TaskStatusEnum.Completed;

  const styles = makeStyles(isCompleted);

  return (
    <>
      <ListItemButton onClick={onToggleStatus} dense sx={styles.button}>
        {!isTemplate && (
          <ListItemIcon sx={styles.icon}>
            <Checkbox
              icon={
                <CheckCircleOutlineIcon data-testid={`check-icon-${task.id}`} />
              }
              checkedIcon={
                <CheckCircleIcon data-testid={`completed-icon-${task.id}`} />
              }
              checked={isCompleted}
              color="success"
              edge="start"
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
        )}
        <ListItemText sx={styles.taskTextWrapper}>
          <Typography
            sx={styles.taskText}
            variant="body2"
            data-testid={`task-text-${task.id}`}
          >
            {taskText}
          </Typography>
        </ListItemText>
      </ListItemButton>
      {isCompleted && (
        <Box
          data-testid="completed-task-item"
          display="flex"
          alignItems="center"
          mr="20px"
        >
          <CompletedItem
            formattedDate={formattedDate}
            avatarInitials={initials}
            id={id}
          />
        </Box>
      )}
    </>
  );
};

export default TaskView;
