import {
  SearchIcon,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  searchIcon: { width: 65, height: 65, color: '#DADADA' },
});

const TaskTemplateEmptyList = () => (
  <Stack
    direction="column"
    display="flex"
    alignItems="center"
    paddingTop={5}
    paddingBottom={10}
    data-testid="no-task-template-added"
  >
    <SearchIcon sx={styles.searchIcon} />
    <Typography variant="body1" color="text.disabled">
      No task templates added yet
    </Typography>
  </Stack>
);

export default TaskTemplateEmptyList;
