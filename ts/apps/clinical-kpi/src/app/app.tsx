import { lazy, Suspense, useEffect } from 'react';
import { AppBar } from '@*company-data-covered*/clinical-kpi/feature';
import { Routes, Route } from 'react-router-dom';
import {
  AuthGuard,
  StoreProvider,
  UserProvider,
  ClinicalKPIStatsigProvider,
  UserMarketsValidator,
  ClinicalKPIGateGuard,
} from '@*company-data-covered*/clinical-kpi/feature';
import {
  initDatadogRum,
  initDatadogLogs,
} from '@*company-data-covered*/shared/datadog/util';
import AuthProvider from './components/AuthProvider';
import { environment } from '../environments/environment';
import { CLINICAL_KPI_ROUTES, statsigOptions } from './constants';

const LeadersView = lazy(() => import('./pages/LeadersView'));
const MyPerformanceView = lazy(() => import('./pages/MyPerformanceView'));
const IndividualPerformanceView = lazy(
  () => import('./pages/IndividualPerformanceView')
);

export const App = () => {
  useEffect(() => {
    const baseParams = {
      clientToken: environment.datadogClientToken,
      environment: environment.datadogEnvironment,
      site: 'datadoghq.com',
      service: 'clinical-kpi-dashboard',
      sessionSampleRate: 5,
      trackResources: true,
      trackLongTasks: true,
    };

    initDatadogRum({
      ...baseParams,
      applicationId: environment.datadogApplicationId,
      trackResources: true,
      trackLongTasks: true,
      trackUserInteractions: true,
      sessionSampleRate: 5,
      sessionReplaySampleRate: 100,
    });

    initDatadogLogs(baseParams);
  }, []);

  return (
    <StoreProvider>
      <AuthProvider>
        <AuthGuard>
          <UserProvider>
            <ClinicalKPIStatsigProvider
              clientKey={environment.statsigClientKey}
              options={statsigOptions}
            >
              <ClinicalKPIGateGuard stationURL={environment.stationURL}>
                <AppBar stationURL={environment.stationURL} />
                <UserMarketsValidator stationURL={environment.stationURL}>
                  <Suspense>
                    <Routes>
                      <Route
                        path={CLINICAL_KPI_ROUTES.PERFORMANCE_HUB}
                        element={
                          <MyPerformanceView
                            stationURL={environment.stationURL}
                          />
                        }
                      />
                      <Route
                        path={CLINICAL_KPI_ROUTES.LEADER_HUB}
                        element={
                          <LeadersView stationURL={environment.stationURL} />
                        }
                      />
                      <Route
                        path={CLINICAL_KPI_ROUTES.INDIVIDUAL_PERFORMANCE_HUB}
                        element={<IndividualPerformanceView />}
                      />
                    </Routes>
                  </Suspense>
                </UserMarketsValidator>
              </ClinicalKPIGateGuard>
            </ClinicalKPIStatsigProvider>
          </UserProvider>
        </AuthGuard>
      </AuthProvider>
    </StoreProvider>
  );
};

export default App;
