import React from 'react';
import { useField } from 'formik';
import {
  Button,
  Grid,
  ListItem,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useGetServiceLines } from '@*company-data-covered*/caremanager/data-access';
import { TaskTemplate } from '@*company-data-covered*/caremanager/data-access-types';

const styles = makeSxStyles({
  container: {
    padding: 2,
    '&:hover': {
      backgroundColor: (theme) => theme.palette.action.selected,
    },
  },
});

type TaskTemplateMenuItemProps = {
  templateItem: TaskTemplate;
  setTemplateList?: React.Dispatch<React.SetStateAction<TaskTemplate[]>>;
};

const TaskTemplateMenuItem = ({
  templateItem,
  setTemplateList,
}: TaskTemplateMenuItemProps) => {
  const [getServiceLine] = useGetServiceLines();
  const serviceLine =
    getServiceLine(templateItem.serviceLineId) ?? templateItem.serviceLine;

  const [templateIds, , helpers] = useField('applyTemplateIds');
  const { setValue: setTemplateIds } = helpers;
  const handleClick = () => {
    if (setTemplateList) {
      setTemplateList((prev) => [...prev, templateItem]);
    }
    templateIds.value.push(templateItem.id);
    setTemplateIds(templateIds.value);
  };

  return (
    <ListItem
      key={templateItem.id}
      sx={styles.container}
      data-testid={`task-template-menu-list-item-${templateItem.id}`}
    >
      <Grid container>
        <Grid item xs={10.7}>
          <Stack direction="row" spacing={1}>
            <Typography variant="subtitle2">
              {serviceLine?.name} - {templateItem.name}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              ·
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {templateItem.tasksCount} Tasks
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.disabled">
            {templateItem.summary}
          </Typography>
        </Grid>
        <Grid item xs={1.3}>
          {templateIds.value.includes(templateItem.id) ? (
            <Typography
              variant="body2"
              color="text.disabled"
              data-testid={`added-task-template-text-${templateItem.id}`}
            >
              Added
            </Typography>
          ) : (
            <Button
              onClick={handleClick}
              data-testid={`add-task-template-button-${templateItem.id}`}
            >
              Add
            </Button>
          )}
        </Grid>
      </Grid>
    </ListItem>
  );
};

export default TaskTemplateMenuItem;
