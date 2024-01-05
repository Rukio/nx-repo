import { CssBaseline, ThemeProvider } from '@*company-data-covered*/design-system';
import { AuthGuard } from '@*company-data-covered*/auth0/feature';
import {
  StoreProvider,
  ModalityStatsigProvider,
  ModalityStatsigProviderProps,
} from '@*company-data-covered*/modality/feature';

import Dashboard from '../pages/Dashboard';
import { theme } from '@*company-data-covered*/modality/ui';
import { environment } from '../environments/environment';

const {
  auth0Audience,
  auth0ClientId,
  auth0Domain,
  statsigClientKey,
  statsigTier,
} = environment;

const statsigOptions: ModalityStatsigProviderProps['options'] = {
  environment: {
    tier: statsigTier,
  },
};

export const App = () => {
  return (
    <StoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthGuard
          clientId={auth0ClientId}
          domain={auth0Domain}
          authorizationParams={{
            redirect_uri: window.location.origin,
            audience: auth0Audience,
          }}
          cacheLocation={window.Cypress ? 'localstorage' : 'memory'}
        >
          <ModalityStatsigProvider
            clientKey={statsigClientKey}
            options={statsigOptions}
          >
            <Dashboard />
          </ModalityStatsigProvider>
        </AuthGuard>
      </ThemeProvider>
    </StoreProvider>
  );
};

export default App;
