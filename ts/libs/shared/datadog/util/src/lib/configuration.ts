import { InitConfiguration } from '@datadog/browser-core';

export type DatadogEnabledCheckParams = { env: InitConfiguration['env'] };

export const withDatadogEnabledCheck = (
  { env }: DatadogEnabledCheckParams,
  fn: () => void
) => {
  if (env === 'development') {
    return;
  }
  fn();
};
