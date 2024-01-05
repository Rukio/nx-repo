import { useFeatureFlagServiceRequests } from '@*company-data-covered*/caremanager/utils-react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ReviewQueue } from './components/ReviewQueue';
import { Archive } from './components/Archive';
import { NotFound } from '@*company-data-covered*/caremanager/feature-status-pages';
import { Box, Container, makeSxStyles } from '@*company-data-covered*/design-system';
import { Tab, Tabs } from '@*company-data-covered*/caremanager/ui';
import { FiltersProvider } from './components/FiltersContext';
import { SidebarProvider } from './components/SidebarContext';

const styles = makeSxStyles({
  tabsContainer: (theme) => ({
    backgroundColor: theme.palette.background.paper,
    boxShadow: `inset 0 7px 5px -5px ${theme.palette.divider}`,
  }),
});

export const ServiceRequests = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const shouldShowServiceRequests = useFeatureFlagServiceRequests();
  if (!shouldShowServiceRequests) {
    return <NotFound />;
  }

  return (
    <SidebarProvider>
      <FiltersProvider>
        <Box sx={styles.tabsContainer}>
          <Container maxWidth="xl">
            <Tabs value={pathname} onChange={(_, tab) => navigate(tab)}>
              <Tab value="/requests" label="Review Queue" />
              <Tab value="/requests/archive" label="Archive" />
            </Tabs>
          </Container>
        </Box>
        <Routes>
          <Route index element={<ReviewQueue />} />
          <Route path="/archive" element={<Archive />} />
        </Routes>
      </FiltersProvider>
    </SidebarProvider>
  );
};
