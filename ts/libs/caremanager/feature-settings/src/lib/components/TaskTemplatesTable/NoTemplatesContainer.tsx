import { RouterButton } from '@*company-data-covered*/caremanager/ui';
import {
  AddIcon,
  Box,
  SearchIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: { padding: 8 },
  searchIcon: { width: 65, height: 65, color: '#DADADA' },
});

const NoTemplatesContainer = () => (
  <Box data-testid="no-templates-container" sx={styles.container}>
    <SearchIcon sx={styles.searchIcon} />
    <Typography variant="body1" mt="16px" mb="16px" color="#5E696F">
      No templates found
    </Typography>
    <RouterButton
      title="Create Template"
      color="primary"
      variant="contained"
      href="/settings/task-templates/new"
      testIdPrefix="templates-no-templates-add-task-templates"
      startIcon={<AddIcon />}
    />
  </Box>
);

export default NoTemplatesContainer;
