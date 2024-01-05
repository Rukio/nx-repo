import { ReactNode, useEffect, useState } from 'react';
import statsig, { StatsigUser, StatsigOptions } from 'statsig-js';

/**
 * Properties required to use the StatsigProvider
 */
export type StatsigProviderProps = {
  children: ReactNode;

  /** A client Statsig key from the Statsig Console */
  clientKey: string;

  /** A Statsig User object */
  user?: StatsigUser;

  /** A Statsig Options object */
  options?: StatsigOptions;

  /** A loading component to render if waitForInitialization is set to true */
  loadingComponent?: ReactNode;

  /**
   * Waits for the Statsig SDK to initialize before rendering children. It is recommended to set this to true so that Statsig will be available for rendered child components that might rely on it.
   *
   * @default true
   */
  waitForInitialization?: boolean;

  /** Should shutdown Statsig SDK on component unmount */
  shutdownOnUnmount?: boolean;
  onInitSuccess?: () => void;
  onInitFailure?: (error: unknown) => void;
};

/**
 * The StatsigProvider is the wrapper for the entry point of the app.
 * It initializes the Statsig SDK with the option of waiting for initialization
 *
 * @example
 * ```typescript
 *
 * const ExampleComponent = (props: ComponentProps) => {
 *   return (
 *    <StatsigProvider
 *      clientKey="client-XXX"
 *      loadingComponent={<Box>Loading...</Box>}
 *    >
 *      <Box>Example</Box>
 *    </StatsigProvider>
 *   );
 * };
 * ```
 */
export const StatsigProvider: React.FC<StatsigProviderProps> = ({
  children,
  clientKey,
  user,
  options,
  loadingComponent,
  waitForInitialization = true,
  shutdownOnUnmount,
  onInitSuccess,
  onInitFailure,
}) => {
  const [initiated, setInitiated] = useState(false);

  useEffect(() => {
    if (!initiated) {
      statsig
        .initialize(clientKey, user, options)
        .then(() => {
          onInitSuccess?.();
        })
        .catch((error) => {
          onInitFailure?.(error);
        })
        .finally(() => {
          setInitiated(true);
        });
    }
  }, [initiated, clientKey, options, user, onInitSuccess, onInitFailure]);

  useEffect(() => {
    return () => {
      if (shutdownOnUnmount) {
        statsig.shutdown();
      }
    };
  }, [shutdownOnUnmount]);

  if (!initiated && waitForInitialization) {
    return <>{loadingComponent}</>;
  }

  return <>{children}</>;
};
