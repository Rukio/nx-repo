import { ProviderProfile } from '@*company-data-covered*/clinical-kpi/data-access';
import {
  buildProviderProfile,
  buildProviderProfileAPP,
  buildProviderProfileDHMT,
} from './testUtil';

describe('buildProviderProfile', () => {
  const providerProfile: ProviderProfile = {
    credentials: 'np',
    position: 'emt',
  };

  it('should buildProviderProfile', () => {
    expect(buildProviderProfile()).toEqual(providerProfile);
  });

  it('should buildProviderProfileDHMT', () => {
    expect(buildProviderProfileDHMT()).toEqual(providerProfile);
  });

  it('should buildProviderProfileAPP', () => {
    expect(buildProviderProfileAPP()).toEqual({
      ...providerProfile,
      position: 'advanced practice provider',
    });
  });
});
