import '@fontsource/open-sans';
import '@fontsource/bree-serif';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ThemeProvider,
  CssBaseline,
  theme,
} from '@*company-data-covered*/design-system';
import { ErrorBoundary } from '@*company-data-covered*/clinical-kpi/feature';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';
import ErrorPage from './app/components/ErrorPage/ErrorPage';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <ErrorBoundary errorComponent={<ErrorPage />}>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
