import {
  getGTMIframeScriptSnippet,
  getGTMScriptSnippet,
  GoogleTagManagerOptions,
} from './snippets';

const createGTMIframeScriptElement = (options: GoogleTagManagerOptions) => {
  const script = document.createElement('noscript');
  script.innerHTML = getGTMIframeScriptSnippet(options);

  return script;
};

const createGTMScriptElement = (options: GoogleTagManagerOptions) => {
  const script = document.createElement('script');
  script.innerHTML = getGTMScriptSnippet(options);

  return script;
};

/**
 * Inserts script tags to load Google Tag Manager for SPA application
 * @param {GoogleTagManagerOptions} options - Google Tag Manager initialization options
 *
 * @example
 * ```typescript
 * import { initializeGoogleTagManager } from '@*company-data-covered*/shared/google';
 *
 * initializeGoogleTagManager({ id: 'GTM-XXXXXXX' });
 *
 * const root = ReactDOM.createRoot(
 *   document.getElementById('root') as HTMLElement
 * );
 * root.render(
 *   <StrictMode>
 *     <App />
 *   </StrictMode>
 * );
 * ```
 */
export const initializeGoogleTagManager = (
  options: GoogleTagManagerOptions
) => {
  const gtmScriptElement = createGTMScriptElement(options);
  const gtmIframeScriptElement = createGTMIframeScriptElement(options);

  document.head.insertBefore(gtmScriptElement, document.head.childNodes[0]);
  document.body.insertBefore(
    gtmIframeScriptElement,
    document.body.childNodes[0]
  );
};
