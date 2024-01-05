import { ProviderProfile } from '@*company-data-covered*/clinical-kpi/data-access';

export const buildProviderProfile = (
  init: Partial<ProviderProfile> = {}
): ProviderProfile => {
  const result: ProviderProfile = {
    credentials: 'np',
    position: 'emt',
  };

  return Object.assign(result, init);
};

export const buildProviderProfileAPP = () =>
  buildProviderProfile({ position: 'advanced practice provider' });

export const buildProviderProfileDHMT = () =>
  buildProviderProfile({ position: 'emt' });
