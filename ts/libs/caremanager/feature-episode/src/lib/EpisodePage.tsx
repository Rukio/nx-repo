import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  TabContext,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useGetEpisode } from '@*company-data-covered*/caremanager/data-access';
import { PageContainer } from '@*company-data-covered*/caremanager/ui';
import EpisodeHeader from './components/EpisodeHeader';
import EpisodePageSkeleton from './components/EpisodePageSkeleton';
import EpisodeRouter from './Router';

const styles = makeSxStyles({
  container: { minWidth: '100%' },
  grid: { minHeight: '100vh' },
});

type Tabs = 'overview' | 'tasks' | 'notes';

export const EpisodePage: React.FC = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isSuccess } = useGetEpisode(id || '');
  const episode = data?.episode;

  const pathNames = location.pathname.split('/');
  let initialTab = 'overview';
  if (pathNames.length > 3) {
    // This return an array with '', episodes and id
    initialTab = pathNames[3] as Tabs;
  }

  const [tab, setTab] = useState<Tabs>(initialTab as Tabs);

  const onTabChange = (
    _: React.SyntheticEvent<Element, Event>,
    newTab: 'overview' | 'tasks' | 'notes'
  ) => {
    setTab(newTab);
  };

  if (isLoading) {
    return <EpisodePageSkeleton />;
  }

  if (episode) {
    return (
      <PageContainer disableGutters sx={styles.container}>
        <Grid sx={styles.grid} container>
          <Grid item xs={12}>
            <TabContext value={tab}>
              <EpisodeHeader {...episode} tab={tab} onTabChange={onTabChange} />
              <Box marginTop={{ md: '170px', lg: '140px' }}>
                <EpisodeRouter episodeData={episode} isSuccess={isSuccess} />
              </Box>
            </TabContext>
          </Grid>
        </Grid>
      </PageContainer>
    );
  }

  return <p>Episode could not be loaded</p>;
};
