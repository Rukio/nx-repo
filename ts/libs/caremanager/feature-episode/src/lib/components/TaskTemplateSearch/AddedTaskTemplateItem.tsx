import { useGetServiceLines } from '@*company-data-covered*/caremanager/data-access';
import { TaskTemplate } from '@*company-data-covered*/caremanager/data-access-types';
import {
  Button,
  Divider,
  Grid,
  ListItem,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: { padding: '20px 10px' },
  containerCanRemove: { padding: '16px 10px' },
  text: { flexGrow: 1 },
});

type AddedTaskTemplateItemProps = {
  listItem: TaskTemplate;
  handleRemove?: () => void;
};

const AddedTaskTemplateItem = ({
  listItem,
  handleRemove,
}: AddedTaskTemplateItemProps) => {
  const [getServiceLine] = useGetServiceLines();
  const serviceLine =
    getServiceLine(listItem.serviceLineId) ?? listItem.serviceLine;

  return (
    <>
      <ListItem
        key={listItem.id}
        sx={handleRemove ? styles.containerCanRemove : styles.container}
        data-testid={`add-task-template-menu-item-${listItem.id}`}
      >
        <Grid container>
          <Grid item xs={9}>
            <Typography variant="body2" sx={styles.text}>
              {serviceLine?.name || 'Unknown service line'} - {listItem.name}
            </Typography>
          </Grid>
          <Grid item xs={3} textAlign="right">
            {handleRemove ? (
              <Button
                color="error"
                onClick={handleRemove}
                size="small"
                data-testid={`add-task-template-remove-item-${listItem.id}`}
              >
                Remove
              </Button>
            ) : (
              <Typography
                variant="label"
                color="text.disabled"
                data-testid={`add-task-template-prev-added-${listItem.id}`}
              >
                Previously Added
              </Typography>
            )}
          </Grid>
        </Grid>
      </ListItem>
      <Divider />
    </>
  );
};

AddedTaskTemplateItem.defaultProps = {
  handleRemove: undefined,
};

export default AddedTaskTemplateItem;
