import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import {
  CssBaseline,
  ThemeProvider,
  theme,
} from '@*company-data-covered*/design-system';
import { AuthGuard } from '@*company-data-covered*/auth0/feature';
import {
  StoreProvider,
  INSURANCE_DASHBOARD_ROUTES,
  Header,
  ToastNotifications,
} from '@*company-data-covered*/insurance/feature';
import { environment } from '../environments/environment';

const PayerPage = lazy(() => import('../pages/Payer/Payer'));
const PayersPage = lazy(() => import('../pages/Payers'));
const NewPayerPage = lazy(() => import('../pages/NewPayer'));
const PayersDetailsPage = lazy(
  () => import('../pages/PayersDetails/PayersDetails')
);
const PayersNetworksPage = lazy(
  () => import('../pages/PayersNetworks/PayersNetworks')
);
const NetworkNavigationPage = lazy(
  () => import('../pages/NetworkNavigation/NetworkNavigation')
);
const NetworksDetailsPage = lazy(
  () => import('../pages/NetworksDetails/NetworksDetails')
);
const NetworksBillingCitiesPage = lazy(
  () => import('../pages/NetworksBillingCities/NetworksBillingCities')
);
const NetworksCreditCardRulesPage = lazy(
  () => import('../pages/NetworksCreditCardRules/NetworksCreditCardRules')
);
const NetworksAppointmentTypesPage = lazy(
  () => import('../pages/NetworksAppointmentTypes')
);
const NetworksCreatePage = lazy(
  () => import('../pages/NetworksCreate/NetworksCreate')
);

export const App = () => {
  const { auth0Audience, auth0ClientId, auth0Domain } = environment;

  return (
    <StoreProvider>
      <AuthGuard
        clientId={auth0ClientId}
        domain={auth0Domain}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: auth0Audience,
        }}
        useAccessToken
        cacheLocation={window.Cypress ? 'localstorage' : 'memory'}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Suspense>
            <Header />
            <Routes>
              <Route
                path={INSURANCE_DASHBOARD_ROUTES.HOME}
                element={<Navigate to={INSURANCE_DASHBOARD_ROUTES.PAYERS} />}
              />
              <Route
                path={INSURANCE_DASHBOARD_ROUTES.PAYERS}
                element={<PayersPage />}
              />
              <Route
                path={INSURANCE_DASHBOARD_ROUTES.PAYERS_DETAILS}
                element={<PayerPage />}
              >
                <Route
                  path={INSURANCE_DASHBOARD_ROUTES.PAYERS_DETAILS}
                  element={<PayersDetailsPage />}
                />
                <Route
                  path={INSURANCE_DASHBOARD_ROUTES.PAYERS_NETWORKS}
                  element={<PayersNetworksPage />}
                />
              </Route>
              <Route
                path={INSURANCE_DASHBOARD_ROUTES.PAYERS_NETWORKS_DETAILS}
                element={<NetworkNavigationPage />}
              >
                <Route
                  path={INSURANCE_DASHBOARD_ROUTES.PAYERS_NETWORKS_DETAILS}
                  element={<NetworksDetailsPage />}
                />
                <Route
                  path={
                    INSURANCE_DASHBOARD_ROUTES.PAYERS_NETWORKS_BILLING_CITIES
                  }
                  element={<NetworksBillingCitiesPage />}
                />
                <Route
                  path={INSURANCE_DASHBOARD_ROUTES.PAYERS_NETWORKS_CREDIT_CARD}
                  element={<NetworksCreditCardRulesPage />}
                />
                <Route
                  path={
                    INSURANCE_DASHBOARD_ROUTES.PAYERS_NETWORKS_APPOINTMENT_TYPES
                  }
                  element={<NetworksAppointmentTypesPage />}
                />
              </Route>
              <Route
                path={INSURANCE_DASHBOARD_ROUTES.PAYER_CREATE}
                element={<NewPayerPage />}
              />
              <Route
                path={INSURANCE_DASHBOARD_ROUTES.PAYERS_NETWORKS_CREATE}
                element={<NetworksCreatePage />}
              />
            </Routes>
          </Suspense>
          <ToastNotifications />
        </ThemeProvider>
      </AuthGuard>
    </StoreProvider>
  );
};

export default App;
