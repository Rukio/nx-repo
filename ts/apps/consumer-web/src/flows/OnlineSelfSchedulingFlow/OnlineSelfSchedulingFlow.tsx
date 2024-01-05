import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  AuthProvider,
  ONLINE_SELF_SCHEDULING_ROUTES,
  ProtectedOutlet,
  StoreProvider,
  AuthLoader,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';
import { AppHeader } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  CssBaseline,
  theme,
  ThemeProvider,
} from '@*company-data-covered*/design-system';
import { environment } from '../../environments/environment';
import { CONSUMER_WEB_FLOWS_TEST_IDS } from '../testIds';

const WhoNeedsCarePage = lazy(
  () => import('../../pages/online-self-scheduling/WhoNeedsCare')
);
const PreferredTimePage = lazy(
  () => import('../../pages/online-self-scheduling/PreferredTime')
);
const SymptomsPage = lazy(
  () => import('../../pages/online-self-scheduling/Symptoms')
);
const PatientDemographicsPage = lazy(
  () => import('../../pages/online-self-scheduling/PatientDemographics')
);
const ConsentPage = lazy(
  () => import('../../pages/online-self-scheduling/Consent')
);
const AddressPage = lazy(
  () => import('../../pages/online-self-scheduling/Address')
);
const InsurancePage = lazy(
  () => import('../../pages/online-self-scheduling/Insurance')
);
const CallScreenerPage = lazy(
  () => import('../../pages/online-self-scheduling/CallScreener')
);
const ConfirmDetailsPage = lazy(
  () => import('../../pages/online-self-scheduling/ConfirmDetails')
);
const BookedTimePage = lazy(
  () => import('../../pages/online-self-scheduling/BookedTime')
);
const ConfirmationPage = lazy(
  () => import('../../pages/online-self-scheduling/Confirmation')
);
const OffboardPage = lazy(
  () => import('../../pages/online-self-scheduling/Offboard')
);

export const OnlineSelfSchedulingFlow = () => {
  return (
    <div data-testid={CONSUMER_WEB_FLOWS_TEST_IDS.ONLINE_SELF_SCHEDULING_FLOW}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StoreProvider>
          <AuthProvider
            domain={environment.auth0Domain}
            clientId={environment.auth0ClientId}
            authorizationParams={{
              redirect_uri: window.location.origin,
              audience: environment.auth0Audience,
            }}
            cacheLocation={window.Cypress ? 'localstorage' : 'memory'}
          >
            <AuthLoader>
              <Suspense>
                <AppHeader homeLink={environment.mainSiteURL} />
                <Routes>
                  <Route
                    path={ONLINE_SELF_SCHEDULING_ROUTES.HOME}
                    element={<WhoNeedsCarePage />}
                  />
                  <Route
                    path={ONLINE_SELF_SCHEDULING_ROUTES.SYMPTOMS}
                    element={<SymptomsPage />}
                  />
                  <Route
                    path={ONLINE_SELF_SCHEDULING_ROUTES.PREFERRED_TIME}
                    element={<PreferredTimePage />}
                  />
                  <Route
                    element={
                      <ProtectedOutlet
                        protectedContentProps={{ useAccessToken: true }}
                      />
                    }
                  >
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.PATIENT_DEMOGRAPHICS}
                      element={<PatientDemographicsPage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.CONSENT}
                      element={<ConsentPage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.ADDRESS}
                      element={<AddressPage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.INSURANCE}
                      element={<InsurancePage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS}
                      element={<ConfirmDetailsPage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.CALL_SCREENER}
                      element={<CallScreenerPage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.BOOKED_TIME}
                      element={<BookedTimePage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.CONFIRMATION}
                      element={<ConfirmationPage />}
                    />
                    <Route
                      path={ONLINE_SELF_SCHEDULING_ROUTES.OFFBOARD}
                      element={<OffboardPage />}
                    />
                  </Route>
                </Routes>
              </Suspense>
            </AuthLoader>
          </AuthProvider>
        </StoreProvider>
      </ThemeProvider>
    </div>
  );
};
