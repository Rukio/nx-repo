import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { SnackbarProvider } from 'notistack';
import { initDatadogRum } from '@*company-data-covered*/caremanager/utils';
import { startMockWorker } from '@*company-data-covered*/caremanager/utils-mocks';
import { App } from './app';
import { environment } from './environments/environment';

if (!window.Cypress) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startMockWorker(environment.apiUrl, environment.nodeEnv);
}

if (environment.datadogAppId && environment.datadogClientToken) {
  initDatadogRum({
    applicationId: environment.datadogAppId,
    clientToken: environment.datadogClientToken,
    sessionSampleRate: parseInt(environment.datadogSampleRate, 10),
    env: environment.nodeEnv,
  });
}

const container = document.getElementById('root');
const root = container && ReactDOM.createRoot(container);
root?.render(
  <StrictMode>
    <SnackbarProvider
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <App />
    </SnackbarProvider>
  </StrictMode>
);
