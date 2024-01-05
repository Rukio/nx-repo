export type GoogleRecaptchaOptions = {
  key: string;
};

export const GOOGLE_RECAPTCHA_API_URL =
  'https://www.google.com/recaptcha/api.js';

const createGoogleRecaptchaScriptElement = ({
  key,
}: GoogleRecaptchaOptions) => {
  const queryString = new URLSearchParams({
    render: key,
  }).toString();

  const script = document.createElement('script');
  script.src = `${GOOGLE_RECAPTCHA_API_URL}?${queryString}`;

  return script;
};

/**
 * Inserts script tags to load Google Recaptcha for SPA application
 * @param {GoogleRecaptchaOptions} options - Google Recaptcha initialization options
 *
 * @example
 * ```typescript
 * import { initializeGoogleRecaptcha } from '@*company-data-covered*/shared/google';
 *
 * initializeGoogleRecaptcha({ key: 'test' });
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
export const initializeGoogleRecaptcha = (options: GoogleRecaptchaOptions) => {
  const grecaptchaScriptElement = createGoogleRecaptchaScriptElement(options);

  document.head.appendChild(grecaptchaScriptElement);
};
