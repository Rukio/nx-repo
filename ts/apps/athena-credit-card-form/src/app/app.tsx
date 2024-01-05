import { lazy, Suspense } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  theme,
} from '@*company-data-covered*/design-system';
import { AuthGuard } from '@*company-data-covered*/auth0/feature';
import {
  ATHENA_CREDIT_CARD_FORM_ROUTES,
  StoreProvider,
} from '@*company-data-covered*/athena-credit-card-form/feature';
import { environment } from '../environments/environment';
import { Navigate, Route, Routes } from 'react-router-dom';

const CollectPaymentPage = lazy(() => import('../pages/CollectPayment'));
const SaveCardOnFilePage = lazy(() => import('../pages/SaveCardOnFile'));

export const App = () => {
  const { auth0Audience, auth0ClientId, auth0Domain } = environment;

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
          cacheLocation="memory"
        >
          <Suspense>
            <Routes>
              <Route
                path={ATHENA_CREDIT_CARD_FORM_ROUTES.HOME}
                element={
                  <Navigate
                    to={ATHENA_CREDIT_CARD_FORM_ROUTES.COLLECT_PAYMENT}
                  />
                }
              />
              <Route
                path={ATHENA_CREDIT_CARD_FORM_ROUTES.COLLECT_PAYMENT}
                element={<CollectPaymentPage />}
              />
              <Route
                path={ATHENA_CREDIT_CARD_FORM_ROUTES.SAVE_CARD_ON_FILE}
                element={<SaveCardOnFilePage />}
              />
            </Routes>
          </Suspense>
        </AuthGuard>
      </ThemeProvider>
    </StoreProvider>
  );
};
export default App;
