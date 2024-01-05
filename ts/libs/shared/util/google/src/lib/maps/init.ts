export type GoogleMapsOptions = {
  key: string;
  libraries?: string[];
  language?: string;
};

export const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/js';

const createGoogleMapsScriptElement = (options: GoogleMapsOptions) => {
  const searchParams = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, value);
      }
    }
  });

  const queryString = searchParams.toString();

  const script = document.createElement('script');
  script.src = `${GOOGLE_MAPS_API_URL}?${queryString}`;

  return script;
};

/**
 * Inserts script tags to load Google Maps for SPA application
 * @param {GoogleMapsOptions} options - Google Maps initialization options
 *
 * @example
 * ```typescript
 * import { initializeGoogleMaps } from '@*company-data-covered*/shared/util/google';
 *
 * initializeGoogleMaps({ key: 'test' });
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
export const initializeGoogleMaps = (options: GoogleMapsOptions) => {
  const googleMapsScriptElement = createGoogleMapsScriptElement(options);

  document.head.appendChild(googleMapsScriptElement);
};
