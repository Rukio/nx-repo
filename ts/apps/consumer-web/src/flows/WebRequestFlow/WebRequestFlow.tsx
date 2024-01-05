import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import {
  getRoutesByUserFlow,
  StoreProvider,
  useUserFlow,
  dayjsSetup,
} from '@*company-data-covered*/consumer-web/web-request/feature';
import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
} from '@*company-data-covered*/design-system';
import { theme as webRequestTheme } from '@*company-data-covered*/consumer-web/web-request/ui';
import { CONSUMER_WEB_FLOWS_TEST_IDS } from '../testIds';

const HowItWorksPage = lazy(
  () => import('../../pages/web-request/HowItWorks/HowItWorks')
);
const RequestAddressPage = lazy(
  () => import('../../pages/web-request/RequestAddress/RequestAddress')
);
const RequestCareForPage = lazy(
  () => import('../../pages/web-request/RequestCareFor/RequestCareFor')
);
const RequestContactInfoPage = lazy(
  () => import('../../pages/web-request/RequestContactInfo/RequestContactInfo')
);
const RequestDetailsPage = lazy(
  () => import('../../pages/web-request/RequestDetails/RequestDetails')
);
const RequestHelpPage = lazy(
  () => import('../../pages/web-request/RequestHelp/RequestHelp')
);
const RequestPersonalInfoPage = lazy(
  () =>
    import('../../pages/web-request/RequestPersonalInfo/RequestPersonalInfo')
);
const RequestTimeWindowsPage = lazy(
  () => import('../../pages/web-request/RequestTimeWindows/RequestTimeWindows')
);

const globalStyles = (
  <GlobalStyles
    styles={(theme) => ({
      '.grecaptcha-badge': {
        [theme.breakpoints.down('sm')]: {
          visibility: 'hidden',
        },
      },
      body: {
        '& > img': {
          display: 'none',
        },
      },
    })}
  />
);

// TODO(ON-794): remove when the dayjs package is removed
dayjsSetup();

export const WebRequestFlow = () => {
  const userFlow = useUserFlow();
  const routes = getRoutesByUserFlow({ userFlow });

  return (
    <div data-testid={CONSUMER_WEB_FLOWS_TEST_IDS.WEB_REQUEST_FLOW}>
      <ThemeProvider theme={webRequestTheme}>
        <CssBaseline />
        {globalStyles}
        <StoreProvider>
          <Suspense>
            <Routes>
              <Route path={routes.howItWorks} element={<HowItWorksPage />} />
              <Route path={routes.requestHelp} element={<RequestHelpPage />} />
              <Route
                path={routes.requestPreferredTime}
                element={<RequestTimeWindowsPage />}
              />
              <Route
                path={routes.requestContact}
                element={<RequestContactInfoPage />}
              />
              <Route
                path={routes.requestAddress}
                element={<RequestAddressPage />}
              />
              <Route
                path={routes.requestCareFor}
                element={<RequestCareForPage />}
              />
              <Route
                path={routes.requestPersonalInfo}
                element={<RequestPersonalInfoPage />}
              />
              <Route
                path={routes.requestDetails}
                element={<RequestDetailsPage />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </StoreProvider>
      </ThemeProvider>
    </div>
  );
};
