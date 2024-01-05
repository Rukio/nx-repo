import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Tab, Tabs } from '@*company-data-covered*/caremanager/ui';
import {
  Box,
  Container,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: {
    backgroundColor: (theme) => theme.palette.common.white,
    position: { xs: 'static', md: 'fixed' },
    width: '100%',
    left: 0,
    zIndex: 1,
    paddingTop: 2,
    paddingX: 2,
  },
  innerContainer: { paddingX: { xs: 0, xl: 2 } },
  header: { marginBottom: 1.5 },
});

type TabType = 'task-templates';

type SettingsHeaderProps = {
  tab: TabType;
  onTabChange: (
    _: React.SyntheticEvent<Element, Event>,
    newTab: TabType
  ) => void;
};

const SettingsHeader: FC<SettingsHeaderProps> = ({ tab, onTabChange }) => (
  <Box sx={styles.container} data-testid="settings-header">
    <Container disableGutters maxWidth="xl" sx={styles.innerContainer}>
      <Box sx={styles.header}>
        <Typography variant="h6" data-testid="settings-title">
          Settings
        </Typography>
      </Box>
      <Tabs value={tab} onChange={onTabChange} data-testid="tabs-component">
        <Tab
          value="task-templates"
          label="Task Templates"
          iconPosition="start"
          LinkComponent={Link}
          data-testid="task-templates-tab"
        />
      </Tabs>
    </Container>
  </Box>
);

export default SettingsHeader;
