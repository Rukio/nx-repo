import {
  initializeGoogleMaps,
  initializeGoogleRecaptcha,
  initializeGoogleTagManager,
} from '@*company-data-covered*/shared/util/google';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { environment } from './environments/environment';

initializeGoogleMaps({
  key: environment.googleMapsKey,
  libraries: ['places'],
  language: 'en',
});
initializeGoogleRecaptcha({ key: environment.googleRecaptchaKey });
initializeGoogleTagManager({ id: environment.googleTagManagerId });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
