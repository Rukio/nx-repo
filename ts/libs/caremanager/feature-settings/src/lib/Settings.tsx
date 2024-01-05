import React, { FC, useState } from 'react';
import {
  Container,
  Grid,
  TabContext,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { HEADER_HEIGHT } from '@*company-data-covered*/caremanager/utils';
import { PageContainer } from '@*company-data-covered*/caremanager/ui';
import SettingsHeader from './components/SettingsHeader';
import SettingsRoutes from './SettingsRoutes';

const styles = makeSxStyles({
  grid: {
    minHeight: `calc(100vh - ${HEADER_HEIGHT})`,
    flex: '1 1 auto',
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
  },
});

type Tabs = 'task-templates';

export const Settings: FC = () => {
  const initialTab = 'task-templates';
  const [tab, setTab] = useState<Tabs>(initialTab as Tabs);

  const onTabChange = (
    _: React.SyntheticEvent<Element, Event>,
    newTab: 'task-templates'
  ) => {
    setTab(newTab);
  };

  return (
    <PageContainer disableGutters maxWidth="xl">
      <Container maxWidth={false} disableGutters>
        <Grid sx={styles.grid} container>
          <Grid item xs={12}>
            <TabContext value={tab} data-testid="tab-content">
              <SettingsHeader tab={tab} onTabChange={onTabChange} />
              <Grid
                container
                justifyContent="center"
                paddingTop={{ md: '110px', lg: '79px' }}
                data-testid="settings-routes"
              >
                <Grid item xs={12}>
                  <SettingsRoutes />
                </Grid>
              </Grid>
            </TabContext>
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
};
