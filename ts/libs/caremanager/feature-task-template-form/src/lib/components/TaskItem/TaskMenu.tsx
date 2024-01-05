import { FC, MouseEvent, useState } from 'react';
import {
  IconButton,
  MoreHorizIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useDeleteTask } from '@*company-data-covered*/caremanager/data-access';
import { GenericMenu } from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  deleteOption: { color: (theme) => theme.palette.error.main },
});

type TaskMenuProps = {
  id: string;
  episodeId: string;
  onDelete?: () => unknown;
  onEditModeChange: (value: boolean) => void;
};
const TaskMenu: FC<TaskMenuProps> = ({
  id,
  episodeId,
  onDelete,
  onEditModeChange,
}) => {
  const { mutate: deleteTask } = useDeleteTask(episodeId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        data-testid="task-menu-button"
        className="edit-icon"
        onClick={handleMenu}
      >
        <MoreHorizIcon />
      </IconButton>
      <GenericMenu
        testIdPrefix="task"
        anchorEl={anchorEl}
        menuPosition="right"
        onClose={handleClose}
        items={[
          {
            text: 'Edit',
            onClick: () => onEditModeChange(true),
          },
          {
            text: 'Delete',
            styles: styles.deleteOption,
            onClick: () => {
              if (onDelete) {
                onDelete();
              } else {
                deleteTask({ taskId: id });
              }
            },
          },
        ]}
      />
    </>
  );
};

export default TaskMenu;
