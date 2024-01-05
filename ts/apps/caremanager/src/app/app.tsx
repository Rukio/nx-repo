import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ErrorBoundary } from 'react-error-boundary';
import '@fontsource/open-sans';
import {
  CssBaseline,
  ThemeProvider,
  theme,
} from '@*company-data-covered*/design-system';
import {
  AnalyticsProvider,
  Auth0ProviderWithHistory as Auth0Provider,
  AuthGuard,
  CaremanagerStatsigProvider,
  PreviousPageProvider,
} from '@*company-data-covered*/caremanager/utils-react';
import { useSnackbar } from '@*company-data-covered*/caremanager/utils';
import { IdleTimer } from '@*company-data-covered*/caremanager/ui';
import { ErrorStatus } from '@*company-data-covered*/caremanager/feature-status-pages';
import AppRouter from '../routes/AppRouter';
import { environment } from '../environments/environment';

export const App = () => {
  const { showError } = useSnackbar();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
        useErrorBoundary: true,
      },
      mutations: {
        onError: (error) => showError(error as Response),
      },
    },
  });

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <Auth0Provider
          auth0Domain={environment.auth0Domain}
          auth0ClientId={environment.auth0ClientId}
          auth0Audience={environment.auth0Audience}
        >
          <AuthGuard>
            <CaremanagerStatsigProvider
              apiKey={environment.statsigApiKey}
              userID={environment.statsigUserId}
              tier={environment.statsigEnvName}
            >
              <ThemeProvider theme={theme}>
                <AnalyticsProvider writeKey={environment.segmentWriteKey}>
                  <PreviousPageProvider>
                    <CssBaseline />
                    <ErrorBoundary FallbackComponent={ErrorStatus}>
                      <IdleTimer>
                        <AppRouter />
                      </IdleTimer>
                    </ErrorBoundary>
                  </PreviousPageProvider>
                </AnalyticsProvider>
              </ThemeProvider>
            </CaremanagerStatsigProvider>
          </AuthGuard>
        </Auth0Provider>
      </QueryClientProvider>
    </Router>
  );
};
