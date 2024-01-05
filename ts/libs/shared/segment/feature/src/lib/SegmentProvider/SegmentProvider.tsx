import {
  useEffect,
  FC,
  ReactNode,
  createContext,
  useState,
  PropsWithChildren,
} from 'react';
import {
  AnalyticsBrowser,
  AnalyticsBrowserSettings,
  InitOptions,
} from '@segment/analytics-next';

export type SegmentProviderProps = PropsWithChildren<{
  /** Segment options to control loading os the SDK. */
  loadOptions: AnalyticsBrowserSettings;

  /** Segment initialization options for SDK. */
  initOptions?: InitOptions;

  /**
   * Waits for the Segment SDK to be initialized before render of children.
   * It is optional, since Segment supports lazy loading for SDK and events.
   * See doc here: https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#load
   *
   * @default false
   */
  waitForInitialization?: boolean;

  /** A loading component to render if waitForInitialization is set to true */
  loadingComponent?: ReactNode;

  /** Callback which should be called when Segment SDK is initialized. */
  onInitSuccess?: () => void;

  /** Callback which should be called when Segment SDK failed to initialize. */
  onInitFailure?: (error: unknown) => void;
}>;

const segmentAnalytics = new AnalyticsBrowser();

export const SegmentContext = createContext<AnalyticsBrowser | undefined>(
  undefined
);

/**
 * The SegmentProvider is the wrapper for the entry point of the consuming application.
 *
 * @example
 * ```typescript
 * import { SegmentProvider } from '@*company-data-covered*/shared/segment/feature'
 *
 * const ExampleApp = (props: AppProps) => {
 *  const loadOptions = {
 *    writeKey: "segment-write-key"
 *  }
 *
 *  return (
 *    <SegmentProvider loadOptions={loadOptions}>
 *     <div>My App</div>
 *    </SegmentProvider>
 *  )
 * }
 * ```
 *
 * With waiting for SDK initialization.
 * @example
 * ```typescript
 * import { SegmentProvider } from '@*company-data-covered*/shared/segment/feature'
 *
 * const ExampleApp = (props: AppProps) => {
 *  const loadOptions = {
 *    writeKey: "segment-write-key"
 *  }
 *
 *  return (
 *    <SegmentProvider
 *      loadOptions={loadOptions}
 *      waitForInitialization
 *      loadingComponent={<div>Loading...</div>}
 *    >
 *     <div>My App</div>
 *    </SegmentProvider>
 *  )
 * }
 * ```
 */
export const SegmentProvider: FC<SegmentProviderProps> = ({
  children,
  loadOptions,
  initOptions,
  onInitSuccess,
  onInitFailure,
  loadingComponent,
  waitForInitialization = false,
}) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      segmentAnalytics
        .load(loadOptions, initOptions)
        .then(() => onInitSuccess?.())
        .catch((error) => onInitFailure?.(error))
        .finally(() => {
          setInitialized(true);
        });
    }
  }, [loadOptions, initOptions, onInitFailure, onInitSuccess, initialized]);

  return (
    <SegmentContext.Provider value={segmentAnalytics}>
      {!initialized && waitForInitialization && loadingComponent
        ? loadingComponent
        : children}
    </SegmentContext.Provider>
  );
};
