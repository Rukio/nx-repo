import { memo } from 'react';
import {
  Box,
  Grid,
  Skeleton,
  Stack,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { PageContainer } from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  container: { minWidth: '100%' },
  dailySkeleton: {
    padding: '24px',
    backgroundColor: 'white',
    width: '100%',
    borderRadius: '6px',
    margin: '4px 0',
  },
  headerSkeleton: {
    backgroundColor: 'background.paper',
    paddingLeft: { xs: 2, sm: 6 },
  },
  noteSkeleton: { marginTop: '10px' },
  sumarySkeleton: {
    bgcolor: 'background.paper',
    padding: 3,
    paddingRight: 4,
    margin: 0,
    width: '100%',
    minWidth: '100%',
  },
  sidebarSkeleton: {
    backgroundColor: 'white',
    padding: { xs: '22px 10px 0', sm: '16px 25px 0' },
    '> h6:first-of-type': { margin: '20px 0 12px' },
    borderLeft: (theme) => `1px solid ${theme.palette.grey.A100}`,
    height: '100%',
  },
  tabSkeleton: { marginTop: '5px' },
});

const SidebarSkeleton = () => (
  <Box sx={styles.sidebarSkeleton}>
    <Stack spacing={4}>
      <Box>
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="60%" />
      </Box>
      <Box>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
      </Box>
      <Box>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
      </Box>
      <Box>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
      </Box>
    </Stack>
  </Box>
);

const SummarySkeleton = () => (
  <Box sx={styles.sumarySkeleton}>
    <Stack spacing={1}>
      <Skeleton variant="text" width="100px" />
      <Box>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
      </Box>
      <Skeleton variant="text" width="100px" />
    </Stack>
  </Box>
);

const NoteSkeleton = () => (
  <Stack direction="row" spacing={2}>
    <Skeleton
      variant="circular"
      width="40px"
      height="40px"
      sx={styles.noteSkeleton}
    />
    <Box width="100%">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" />
      <Skeleton variant="text" />
    </Box>
  </Stack>
);

const DailyUpdatesSkeleton = () => (
  <Box sx={styles.dailySkeleton}>
    <Stack spacing={1}>
      <Skeleton variant="text" width="200px" />
      <Skeleton variant="rectangular" width="100%" height="30px" />
      <NoteSkeleton />
      <NoteSkeleton />
    </Stack>
  </Box>
);

const OverviewHeaderSkeleton = () => (
  <Box marginBottom="15px">
    <Stack direction="row" spacing={1}>
      <Skeleton variant="text" width="100px" />
      <Skeleton variant="text" width="200px" />
    </Stack>
    <Skeleton variant="text" width="100px" />
  </Box>
);

const TabSkeleton = () => (
  <Stack direction="row" spacing={1}>
    <Skeleton
      variant="circular"
      width="20px"
      height="20px"
      sx={styles.tabSkeleton}
    />
    <Skeleton variant="text" width="70px" height="30px" />
  </Stack>
);

const HeaderSkeleton = () => (
  <Box sx={styles.headerSkeleton}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 1 }}>
      <Skeleton variant="text" width="100px" height="30px" />
      <Skeleton variant="text" width="300px" />
    </Stack>
    <Stack direction="row" spacing={1}>
      <TabSkeleton />
      <TabSkeleton />
      <TabSkeleton />
    </Stack>
  </Box>
);

const EpisodePageSkeleton = memo(() => (
  <PageContainer disableGutters sx={styles.container}>
    <Grid container data-testid="episodeSkeleton">
      <Grid item xs={12} md={12} lg={10}>
        <HeaderSkeleton />
        <Box margin={{ xs: 2, sm: 6 }}>
          <OverviewHeaderSkeleton />
          <SummarySkeleton />
          <DailyUpdatesSkeleton />
        </Box>
      </Grid>
      <Grid
        item
        lg={2}
        display={{ xs: 'none', lg: 'block' }}
        position="fixed"
        right={0}
        height="100%"
        width="100%"
      >
        <SidebarSkeleton />
      </Grid>
    </Grid>
  </PageContainer>
));

export default EpisodePageSkeleton;
