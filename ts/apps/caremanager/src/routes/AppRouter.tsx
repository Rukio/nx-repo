import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppContainer from '../AppContainer';
import useRoutes from './routes';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Box, CircularProgress } from '@*company-data-covered*/design-system';
import {
  MaintenanceMode,
  NotFound,
} from '@*company-data-covered*/caremanager/feature-status-pages';
import {
  useAuth0Token,
  useFeatureFlagDisplayMaintenanceMode,
} from '@*company-data-covered*/caremanager/utils-react';

const ProtectedAppContainer = withAuthenticationRequired(AppContainer);
const MaintenanceRedirect = () => <Navigate to="/503" />;

const AppRouter = React.memo(() => {
  const { protectedRoutes, normalRoutes } = useRoutes();
  const displayMaintenanceMode = useFeatureFlagDisplayMaintenanceMode();
  const authToken = useAuth0Token();

  if (!authToken) {
    return (
      <Box
        sx={{
          display: 'flex',
          position: 'fixed',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={100} />
      </Box>
    );
  }

  return displayMaintenanceMode ? (
    <Routes>
      <Route path="/503" element={<MaintenanceMode />} />
      <Route path="*" element={<MaintenanceRedirect />} />
    </Routes>
  ) : (
    <Routes>
      {normalRoutes.map(({ path, component: Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
      {protectedRoutes.map(({ path, component: Component }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedAppContainer>
              <Component />
            </ProtectedAppContainer>
          }
        />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
});

export default AppRouter;
