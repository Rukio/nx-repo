import React, { createContext, useMemo } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';

interface AnalyticsContextProps {
  analytics: AnalyticsBrowser;
}

const defaultAnalyticsContext = {
  analytics: new AnalyticsBrowser(),
};

export const AnalyticsContext = createContext<AnalyticsContextProps>(
  defaultAnalyticsContext
);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  writeKey: string;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  writeKey = '',
}) => {
  const value: AnalyticsContextProps = useMemo(
    () => ({ analytics: AnalyticsBrowser.load({ writeKey }) }),
    [writeKey]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};
