import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PATIENT_PORTAL_ROUTES } from '@*company-data-covered*/patient-portal/feature';
import { AppBar } from '@*company-data-covered*/patient-portal/ui';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AddressCreatePage = lazy(() => import('./pages/AddressCreatePage'));
const AddressDetailsPage = lazy(() => import('./pages/AddressDetailsPage'));
const PatientCreatePage = lazy(() => import('./pages/PatientCreatePage'));
const PatientDetailsPage = lazy(() => import('./pages/PatientDetailsPage'));

export const App = () => {
  return (
    <>
      <AppBar />
      <Suspense>
        <Routes>
          <Route
            path={PATIENT_PORTAL_ROUTES.LANDING_PAGE}
            element={<LandingPage />}
          />
          <Route
            path={PATIENT_PORTAL_ROUTES.PATIENT_CREATE}
            element={<PatientCreatePage />}
          />
          <Route
            path={PATIENT_PORTAL_ROUTES.PATIENT_DETAILS}
            element={<PatientDetailsPage />}
          />
          <Route
            path={PATIENT_PORTAL_ROUTES.ADDRESS_CREATE}
            element={<AddressCreatePage />}
          />
          <Route
            path={PATIENT_PORTAL_ROUTES.ADDRESS_DETAILS}
            element={<AddressDetailsPage />}
          />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
